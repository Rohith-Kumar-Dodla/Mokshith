import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import Payment from '../payment/payment.model.js';
import Refund from '../payment/refund.model.js';
import PaymentProof from '../payment-proof/paymentProof.model.js';
import Order from '../order/order.model.js';
import Invoice from '../invoice/invoice.model.js';
import Logistics from '../logistics/logistics.model.js';
import SupplierAllocation from '../procurement/supplierAllocation.model.js';
import SupplierOrder from '../procurement/supplierOrder.model.js';
import User from '../user/user.model.js';
import CompanyDocument from '../companyDocument/companyDocument.model.js';
import Audit from '../audit/audit.model.js';
import AppError from '../../errors/AppError.js';
import { ROLES } from '../../constants/roles.js';
import { uploadFile } from '../../services/fileUpload.service.js';
import { s3Service } from '../../services/s3.service.js';
import { cloudinaryService } from '../../services/cloudinary.service.js';

const DAY = 86400000;
const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function dateRange(query = {}) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const startText = (query.startDate || today).slice(0, 10);
  const endText = (query.endDate || startText).slice(0, 10);
  const start = new Date(`${startText}T00:00:00.000+05:30`);
  const end = new Date(`${endText}T23:59:59.999+05:30`);
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || end < start || end - start > 366 * DAY) {
    throw new AppError('Invalid date range (maximum 366 days)', 400);
  }
  return { start, end, startText, endText };
}

export async function listTransactions(query) {
  if (query.type === 'supplier') {
    return { type: 'supplier', transactions: [], pagination: { page: 1, limit: Number(query.limit || 20), total: 0, pages: 0 }, summary: { totalTransactions: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0 }, authoritativeSourceAvailable: false };
  }
  const { start, end } = dateRange(query);
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const match = { createdAt: { $gte: start, $lte: end } };
  if (query.method) match.paymentMethod = query.method;
  if (query.status) match.status = query.status;
  if (query.customer) {
    const users = await User.find({ $or: [{ name: new RegExp(escapeRegex(query.customer), 'i') }, { email: new RegExp(escapeRegex(query.customer), 'i') }] }).select('_id').lean();
    match.userId = { $in: users.map((u) => u._id) };
  }
  const [payments, total, grouped] = await Promise.all([
    Payment.find(match).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('userId', 'name email mobile').populate('orderId').lean(),
    Payment.countDocuments(match),
    Payment.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } }]),
  ]);
  const orderIds = payments.map((p) => p.orderId?._id || p.orderId).filter(Boolean);
  const paymentIds = payments.map((p) => p._id);
  const [proofs, invoices, logistics, refunds] = await Promise.all([
    PaymentProof.find({ orderId: { $in: orderIds } }).lean(),
    Invoice.find({ orderId: { $in: orderIds } }).lean(),
    Logistics.find({ orderId: { $in: orderIds } }).populate('deliveryPartnerId', 'name mobile').lean(),
    Refund.find({ paymentId: { $in: paymentIds } }).lean(),
  ]);
  const byOrder = (rows) => new Map(rows.map((row) => [String(row.orderId), row]));
  const proofByOrder = byOrder(proofs); const invoiceByOrder = byOrder(invoices); const logisticsByOrder = byOrder(logistics);
  const refundsByPayment = new Map(); refunds.forEach((r) => { const key = String(r.paymentId); refundsByPayment.set(key, [...(refundsByPayment.get(key) || []), r]); });
  const transactions = payments.map((payment) => {
    const order = payment.orderId || {}; const key = String(order._id || '');
    return { ...payment, order, invoice: invoiceByOrder.get(key) || null, paymentProof: proofByOrder.get(key) || null, logistics: logisticsByOrder.get(key) || null, refunds: refundsByPayment.get(String(payment._id)) || [], cod: order.paymentMethod === 'COD' ? { collectionMode: order.collectionMode, collectedBy: order.paymentCollectedBy, collectedAt: order.paymentCollectedAt, proof: order.cashCollectionProof, notes: order.collectionNotes } : null };
  });
  const amount = (status) => grouped.find((row) => row._id === status)?.amount || 0;
  const refundTotal = refunds.filter((r) => r.status === 'SUCCESS').reduce((sum, r) => sum + r.amount, 0);
  return { type: 'customer', transactions, pagination: { page, limit, total, pages: Math.ceil(total / limit) }, summary: { totalTransactions: total, totalAmount: grouped.reduce((s, r) => s + r.amount, 0), paidAmount: amount('SUCCESS'), pendingAmount: amount('PENDING') + amount('INITIATED'), failedAmount: amount('FAILED'), refundedAmount: refundTotal } };
}

export async function createDocument(body, file, actor, ip) {
  if (!file) throw new AppError('Document file is required', 400);
  const required = ['name', 'type']; required.forEach((key) => { if (!body[key]) throw new AppError(`${key} is required`, 400); });
  let result;
  if (!s3Service.isEnabled()) {
    const privateDir = path.resolve(process.cwd(), 'private-uploads', 'company-documents');
    fs.mkdirSync(privateDir, { recursive: true });
    const filename = file.filename || `${crypto.randomBytes(16).toString('hex')}${path.extname(file.originalname)}`;
    const destination = path.join(privateDir, filename);
    if (file.path && fs.existsSync(file.path)) fs.renameSync(file.path, destination);
    else if (file.buffer) fs.writeFileSync(destination, file.buffer);
    else throw new AppError('Uploaded document content is unavailable', 400);
    result = { url: `private://${filename}`, publicId: filename };
  } else {
    result = await uploadFile(file, 'company-documents');
  }
  const document = await CompanyDocument.create({ name: body.name, type: body.type, description: body.description || '', documentNumber: body.documentNumber || '', issuedDate: body.issuedDate || undefined, expiryDate: body.expiryDate || undefined, notes: body.notes || '', fileUrl: result.url, fileKey: result.publicId, originalName: file.originalname, mimeType: file.mimetype, fileSize: file.size, uploadedBy: actor });
  await Audit.create({ userId: actor, action: 'UPLOAD_COMPANY_DOCUMENT', entity: 'COMPANY_DOCUMENT', entityId: document._id, details: `Uploaded company document: ${document.name}`, ip, severity: 'INFO' });
  return document;
}

export async function listDocuments(query) {
  const page = Number(query.page || 1), limit = Number(query.limit || 20); const match = { isArchived: false };
  if (query.search) match.name = new RegExp(escapeRegex(query.search), 'i');
  if (query.type) match.type = query.type;
  const now = new Date(), soon = new Date(now.valueOf() + 30 * DAY);
  if (query.expiry === 'none') match.expiryDate = null;
  if (query.expiry === 'active') match.expiryDate = { $gt: soon };
  if (query.expiry === 'expiring') match.expiryDate = { $gte: now, $lte: soon };
  if (query.expiry === 'expired') match.expiryDate = { $lt: now };
  const [documents, total] = await Promise.all([CompanyDocument.find(match).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('uploadedBy', 'name email').lean(), CompanyDocument.countDocuments(match)]);
  return { documents, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function getDocumentFile(id) {
  const document = await CompanyDocument.findOne({ _id: id, isArchived: false }).select('+fileUrl +fileKey').lean();
  if (!document) throw new AppError('Document not found', 404);
  if (document.fileUrl.startsWith('private://')) return { document, localPath: path.resolve(process.cwd(), 'private-uploads', 'company-documents', document.fileUrl.slice(10)) };
  if (document.fileKey && s3Service.isEnabled()) return { document, redirect: await s3Service.getPresignedUrl(document.fileKey, 300) };
  if (document.fileUrl.startsWith('/uploads/')) return { document, localPath: path.resolve(process.cwd(), document.fileUrl.slice(1)) };
  return { document, redirect: document.fileUrl };
}

export async function archiveDocument(id, actor, ip) {
  const document = await CompanyDocument.findOneAndUpdate({ _id: id, isArchived: false }, { isArchived: true }, { new: true }).select('+fileUrl +fileKey');
  if (!document) throw new AppError('Document not found', 404);
  if (document.fileUrl.startsWith('private://')) { const target = path.resolve(process.cwd(), 'private-uploads', 'company-documents', document.fileUrl.slice(10)); const root = path.resolve(process.cwd(), 'private-uploads', 'company-documents'); if (target.startsWith(root) && fs.existsSync(target)) fs.unlinkSync(target); }
  else if (document.fileKey && s3Service.isEnabled()) await s3Service.delete(document.fileKey);
  else if (document.fileKey && cloudinaryService.isEnabled()) await cloudinaryService.delete(document.fileKey);
  else if (document.fileUrl.startsWith('/uploads/')) { const target = path.resolve(process.cwd(), document.fileUrl.slice(1)); const root = path.resolve(process.cwd(), 'uploads'); if (target.startsWith(root) && fs.existsSync(target)) fs.unlinkSync(target); }
  await Audit.create({ userId: actor, action: 'ARCHIVE_COMPANY_DOCUMENT', entity: 'COMPANY_DOCUMENT', entityId: id, details: `Archived company document: ${document.name}`, ip, severity: 'WARNING' });
  return { message: 'Document archived' };
}

export async function listInternalStaff(query) {
  const page = Number(query.page || 1), limit = Number(query.limit || 20); const match = { role: ROLES.INTERNAL_STAFF };
  if (query.status && query.status !== 'all') match.status = query.status;
  if (query.search) match.$or = [{ name: new RegExp(escapeRegex(query.search), 'i') }, { email: new RegExp(escapeRegex(query.search), 'i') }, { mobile: new RegExp(escapeRegex(query.search), 'i') }];
  const [users, total] = await Promise.all([User.find(match).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), User.countDocuments(match)]);
  return { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function createInternalStaff(data, actor, ip) {
  if (await User.exists({ $or: [{ email: data.email.toLowerCase() }, { mobile: data.mobile }] })) throw new AppError('Email or mobile already exists', 409);
  const password = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
  const user = await User.create({ name: data.name, email: data.email, mobile: data.mobile, phone: data.mobile, password, role: ROLES.INTERNAL_STAFF, internalRole: data.internalRole, department: data.department || '', joiningDate: data.joiningDate || undefined, staffNotes: data.notes || '', status: data.status, isVerified: false });
  await Audit.create({ userId: actor, action: 'CREATE_INTERNAL_STAFF', entity: 'USER', entityId: user._id, details: `Created internal staff: ${user.email} (${user.internalRole})`, ip, severity: 'INFO' });
  return user;
}

export async function updateInternalStaff(id, data, actor, ip) {
  const updates = { ...data }; if ('notes' in updates) { updates.staffNotes = updates.notes; delete updates.notes; }
  const user = await User.findOneAndUpdate({ _id: id, role: ROLES.INTERNAL_STAFF }, updates, { new: true, runValidators: true });
  if (!user) throw new AppError('Internal staff member not found', 404);
  await Audit.create({ userId: actor, action: 'UPDATE_INTERNAL_STAFF', entity: 'USER', entityId: user._id, details: `Updated internal staff: ${user.email}`, ip, severity: 'INFO' });
  return user;
}

export async function reportAnalysis(query) {
  const { start, end, startText, endText } = dateRange(query); const orderMatch = { createdAt: { $gte: start, $lte: end } };
  if (query.orderStatus) orderMatch.status = query.orderStatus;
  if (query.paymentMethod) orderMatch.paymentMethod = query.paymentMethod;
  if (query.product) orderMatch['items.productId'] = query.product;
  let allowedOrders = null;
  if (query.supplier) { allowedOrders = await SupplierAllocation.distinct('customerOrderId', { supplierId: query.supplier, status: 'ACTIVE' }); orderMatch._id = { $in: allowedOrders }; }
  const orders = await Order.find(orderMatch).select('items totalAmount subtotal discountAmount specialDiscountAmount bulkDiscountAmount taxAmount paymentMethod paymentStatus status userId createdAt').lean();
  const orderIds = orders.map((o) => o._id);
  const [payments, allocations, supplierOrders] = await Promise.all([
    Payment.find({ orderId: { $in: orderIds }, createdAt: { $gte: start, $lte: end } }).lean(),
    SupplierAllocation.find({ customerOrderId: { $in: orderIds }, status: 'ACTIVE', ...(query.supplier ? { supplierId: query.supplier } : {}) }).populate('supplierId', 'supplierName companyName').lean(),
    SupplierOrder.find({ customerOrderId: { $in: orderIds }, ...(query.supplier ? { supplierId: query.supplier } : {}) }).populate('supplierId', 'supplierName companyName').lean(),
  ]);
  const grossSales = orders.reduce((s, o) => s + (o.subtotal || o.totalAmount || 0), 0); const discounts = orders.reduce((s, o) => s + (o.discountAmount || 0) + (o.specialDiscountAmount || 0) + (o.bulkDiscountAmount || 0), 0); const tax = orders.reduce((s, o) => s + (o.taxAmount || 0), 0); const netSales = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const procurementCost = allocations.reduce((s, a) => s + a.quantity * a.unitSupplierPriceSnapshot, 0); const covered = new Set(allocations.map((a) => String(a.customerOrderId))); const revenueCovered = orders.filter((o) => covered.has(String(o._id))).reduce((s, o) => s + (o.totalAmount || 0), 0); const margin = revenueCovered - procurementCost;
  const productMap = new Map(); orders.forEach((o) => o.items.forEach((item) => { if (query.product && String(item.productId) !== query.product) return; const key = String(item.productId); const row = productMap.get(key) || { productId: key, name: item.name, unitsSold: 0, orders: new Set(), revenue: 0, discount: 0 }; row.unitsSold += item.quantity; row.orders.add(String(o._id)); row.revenue += (item.finalPrice ?? item.price) * item.quantity; row.discount += (item.discountAmount || 0) + (item.specialDiscountAmount || 0) + (item.bulkDiscountAmount || 0); productMap.set(key, row); }));
  const allocationByProduct = new Map(); allocations.forEach((a) => { const key = String(a.productId); const row = allocationByProduct.get(key) || { cost: 0, suppliers: new Set() }; row.cost += a.quantity * a.unitSupplierPriceSnapshot; row.suppliers.add(a.supplierId?.supplierName || a.supplierId?.companyName || 'Supplier'); allocationByProduct.set(key, row); });
  const products = [...productMap.values()].map((p) => { const cost = allocationByProduct.get(p.productId); return { ...p, orders: p.orders.size, supplier: cost ? [...cost.suppliers].join(', ') : null, supplierCost: cost?.cost ?? null, margin: cost ? p.revenue - cost.cost : null }; }).sort((a, b) => b.revenue - a.revenue).slice(0, 20);
  const paymentMethods = Object.values(payments.reduce((acc, p) => { const key = p.paymentMethod || 'OTHER'; acc[key] ||= { method: key, count: 0, amount: 0 }; acc[key].count++; acc[key].amount += p.amount; return acc; }, {}));
  const orderStatuses = Object.values(orders.reduce((acc, o) => { acc[o.status] ||= { status: o.status, count: 0 }; acc[o.status].count++; return acc; }, {}));
  const trend = Object.values(orders.reduce((acc, o) => { const key = new Date(o.createdAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); acc[key] ||= { date: key, revenue: 0, orders: 0, units: 0 }; acc[key].revenue += o.totalAmount || 0; acc[key].orders++; acc[key].units += o.items.reduce((s, i) => s + i.quantity, 0); return acc; }, {})).sort((a, b) => a.date.localeCompare(b.date));
  return { period: { start: startText, end: endText, timezone: 'Asia/Kolkata' }, sales: { orders: orders.length, productsSold: orders.reduce((s, o) => s + o.items.reduce((x, i) => x + i.quantity, 0), 0), customersWithOrders: new Set(orders.map((o) => String(o.userId))).size, grossSales, discounts, tax, netSales }, payments: { received: payments.filter((p) => p.status === 'SUCCESS').reduce((s, p) => s + p.amount, 0), pending: payments.filter((p) => ['PENDING', 'INITIATED'].includes(p.status)).reduce((s, p) => s + p.amount, 0), failed: payments.filter((p) => p.status === 'FAILED').reduce((s, p) => s + p.amount, 0) }, procurement: { allocations: allocations.length, requests: supplierOrders.length, quantitySourced: allocations.reduce((s, a) => s + a.quantity, 0), procurementCost, supplierPaymentsMade: null, outstandingSupplierAmount: null }, financial: { revenue: netSales, procurementCost, grossMargin: covered.size ? margin : null, grossMarginPercent: covered.size && revenueCovered ? Number(((margin / revenueCovered) * 100).toFixed(2)) : null, costCoveragePercent: orders.length ? Number(((covered.size / orders.length) * 100).toFixed(2)) : 0, ordersWithCost: covered.size, totalOrders: orders.length, isPartial: covered.size < orders.length }, products, paymentMethods, orderStatuses, salesTrend: trend, supplierPaymentsAvailable: false };
}
