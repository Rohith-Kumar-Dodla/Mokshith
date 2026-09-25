import mongoose from 'mongoose';
import SupplierOrder from './supplierOrder.model.js';
import SupplierOrderCounter from './purchaseRequestCounter.model.js';
import Order from '../order/order.model.js';
import Product from '../product/product.model.js';
import Supplier from '../supplier/supplier.model.js';
import SupplierProduct from '../supplier/supplierProduct.model.js';
import Audit from '../audit/audit.model.js';
import AppError from '../../errors/AppError.js';
import { compareSuppliersForProduct } from '../supplier/supplierProduct.service.js';
import { SUPPLIER_STATUS } from '../../constants/supplierStatus.js';
import { SUPPLIER_PRODUCT_STATUS } from '../../constants/supplierProductStatus.js';
import { SUPPLIER_ORDER_STATUS, SUPPLIER_ORDER_TRANSITIONS } from '../../constants/supplierOrderStatus.js';

const validId = (id, label) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(`Invalid ${label} ID`, 400);
};
const money = (value) => Math.round(Number(value) * 100) / 100;
const audit = (actorId, action, entityId, details) => Audit.create({ userId: actorId, action, entity: 'SUPPLIER_ORDER', entityId, details, severity: 'INFO' });

async function nextNumber() {
  const year = new Date().getFullYear();
  const counter = await SupplierOrderCounter.findOneAndUpdate({ year }, { $inc: { seq: 1 } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  return `SO-${year}-${String(counter.seq).padStart(4, '0')}`;
}

const serialize = (doc) => {
  const row = doc?.toObject ? doc.toObject() : doc;
  return { ...row, customerOrderId: row.customerOrderId, supplierId: row.supplierId, items: row.items || [] };
};

export const getEligibleForOrder = async (orderId) => {
  validId(orderId, 'order');
  const order = await Order.findById(orderId).select('items isActive status').lean();
  if (!order) throw new AppError('Order not found', 404);
  const products = await Product.find({ _id: { $in: order.items.map((item) => item.productId) }, isActive: true }).select('_id name').lean();
  const productMap = new Map(products.map((row) => [String(row._id), row]));
  const rows = [];
  for (const item of order.items) {
    const product = productMap.get(String(item.productId));
    if (!product) continue;
    const comparison = await compareSuppliersForProduct(product._id);
    rows.push({ productId: product._id, productName: product.name, quantity: Number(item.quantity), recommendedSupplierId: comparison.suppliers.find((row) => row.isLowestPrice && Number(row.minimumOrderQuantity) <= Number(item.quantity))?.supplierId || null, recommendationPrice: comparison.suppliers.find((row) => row.isLowestPrice && Number(row.minimumOrderQuantity) <= Number(item.quantity))?.currentSupplierPrice || null, suppliers: comparison.suppliers.filter((row) => Number(row.minimumOrderQuantity) <= Number(item.quantity)) });
  }
  return { orderId, items: rows, existing: (await SupplierOrder.find({ customerOrderId: orderId }).sort({ createdAt: -1 }).lean()).map(serialize) };
};

async function loadSelection(selection, orderItem) {
  validId(selection.productId, 'product'); validId(selection.supplierId, 'supplier'); validId(selection.supplierProductId, 'supplier product');
  if (String(selection.productId) !== String(orderItem.productId)) throw new AppError('Supplier selection does not match the customer order item.', 400);
  const [product, supplier, mapping] = await Promise.all([Product.findById(orderItem.productId).select('name isActive'), Supplier.findById(selection.supplierId), SupplierProduct.findById(selection.supplierProductId)]);
  if (!product || product.isActive === false) throw new AppError('Product is not active.', 400);
  if (!supplier || supplier.isDeleted || supplier.status !== SUPPLIER_STATUS.ACTIVE) throw new AppError('Supplier is not active.', 400);
  if (!mapping || String(mapping.supplierId) !== String(supplier._id) || String(mapping.productId) !== String(product._id) || mapping.availabilityStatus !== SUPPLIER_PRODUCT_STATUS.ACTIVE) throw new AppError('Supplier product mapping is invalid or inactive.', 400);
  const price = Number(mapping.currentSupplierPrice);
  if (!Number.isFinite(price) || price <= 0) throw new AppError('Supplier price is not configured.', 400);
  const quantity = Math.max(Number(selection.quantity || orderItem.quantity), Number(mapping.minimumOrderQuantity || 1));
  return { product, supplier, mapping, quantity, price: money(price) };
}

export const createForOrder = async ({ customerOrderId, selections, actorId }) => {
  validId(customerOrderId, 'order');
  const order = await Order.findById(customerOrderId).select('items').lean();
  if (!order) throw new AppError('Order not found', 404);
  const byProduct = new Map(order.items.map((item) => [String(item.productId), item]));
  if (selections.length !== byProduct.size) throw new AppError('Select an eligible supplier for every customer order item.', 400);
  const prepared = [];
  for (const selection of selections) {
    const item = byProduct.get(String(selection.productId));
    if (!item) throw new AppError('Selected product is not part of the customer order.', 400);
    prepared.push({ selection, item, resolved: await loadSelection(selection, item) });
  }
  const groups = new Map();
  for (const row of prepared) {
    const key = String(row.resolved.supplier._id);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const created = [];
  for (const rows of groups.values()) {
    const first = rows[0].resolved;
    const items = rows.map(({ resolved }) => ({ productId: resolved.product._id, productNameSnapshot: resolved.product.name, supplierProductId: resolved.mapping._id, supplierSkuSnapshot: resolved.mapping.sku || '', quantity: resolved.quantity, unitSupplierPrice: resolved.price, subtotal: money(resolved.quantity * resolved.price) }));
    const doc = await SupplierOrder.create({ supplierOrderNumber: await nextNumber(), customerOrderId, supplierId: first.supplier._id, assignedBy: actorId, recommendedSupplierId: rows[0].selection.recommendedSupplierId || null, recommendationPrice: rows[0].selection.recommendationPrice ?? null, selectedSupplierPrice: first.price, items, totalSupplierCost: money(items.reduce((sum, item) => sum + item.subtotal, 0)), status: SUPPLIER_ORDER_STATUS.ASSIGNED });
    await audit(actorId, 'SUPPLIER_ORDER_CREATED', doc._id, `Created ${doc.supplierOrderNumber} for customer order ${customerOrderId}`);
    created.push(serialize(doc));
  }
  return created;
};

export const listForOrder = async (orderId) => {
  validId(orderId, 'order');
  return (await SupplierOrder.find({ customerOrderId: orderId }).sort({ createdAt: -1 }).lean()).map(serialize);
};

const requireOrder = async (id) => { validId(id, 'supplier order'); const doc = await SupplierOrder.findById(id); if (!doc) throw new AppError('Supplier order not found', 404); return doc; };

const buildMessage = (order) => ['Mokshith Enterprises', '', 'New Supplier Order', `Supplier Order: ${order.supplierOrderNumber}`, '', 'Items:', ...order.items.map((item) => `${item.productNameSnapshot}\nQuantity: ${item.quantity}\nSupplier Price: ₹${Number(item.unitSupplierPrice).toFixed(2)}\nSubtotal: ₹${Number(item.subtotal).toFixed(2)}`), '', 'Please confirm availability and expected collection readiness.', '', `Reference: ${order.supplierOrderNumber}`].join('\n');

export const generateWhatsApp = async (id, actorId) => {
  const order = await requireOrder(id);
  if (!order.supplierId) throw new AppError('Supplier is missing contact information.', 400);
  const supplier = await Supplier.findById(order.supplierId).select('phone');
  const digits = String(supplier?.phone || '').replace(/\D/g, '');
  if (!digits) throw new AppError('Supplier phone number is unavailable.', 400);
  const message = buildMessage(order);
  order.whatsappStatus = 'MESSAGE_GENERATED'; order.whatsappMessage = message; order.whatsappGeneratedAt = new Date();
  if (order.status === SUPPLIER_ORDER_STATUS.ASSIGNED) order.status = SUPPLIER_ORDER_STATUS.SENT;
  await order.save(); await audit(actorId, 'SUPPLIER_ORDER_WHATSAPP_GENERATED', order._id, `Generated WhatsApp message for ${order.supplierOrderNumber}`);
  return { supplierOrder: serialize(order), whatsappUrl: `https://wa.me/${digits}?text=${encodeURIComponent(message)}` };
};

export const markWhatsAppOpened = async (id, actorId) => { const order = await requireOrder(id); order.whatsappStatus = 'WHATSAPP_OPENED'; order.whatsappOpenedAt = new Date(); await order.save(); await audit(actorId, 'SUPPLIER_ORDER_WHATSAPP_OPENED', order._id, `Opened WhatsApp for ${order.supplierOrderNumber}`); return serialize(order); };

export const transition = async (id, status, actorId, reason = '') => {
  const order = await requireOrder(id);
  if (!Object.values(SUPPLIER_ORDER_STATUS).includes(status)) throw new AppError('Invalid supplier order status.', 400);
  if (!(SUPPLIER_ORDER_TRANSITIONS[order.status] || []).includes(status)) throw new AppError(`Cannot move supplier order from ${order.status} to ${status}.`, 400);
  order.status = status; if (status === SUPPLIER_ORDER_STATUS.REJECTED) order.rejectionReason = String(reason || '').trim();
  if (status === SUPPLIER_ORDER_STATUS.ACKNOWLEDGED) order.acknowledgedAt = new Date();
  if (status === SUPPLIER_ORDER_STATUS.COLLECTED) order.collectedAt = new Date();
  if (status === SUPPLIER_ORDER_STATUS.RECEIVED_AT_WAREHOUSE) order.receivedAtWarehouseAt = new Date();
  await order.save(); await audit(actorId, `SUPPLIER_ORDER_${status}`, order._id, `Supplier order ${order.supplierOrderNumber} moved to ${status}`); return serialize(order);
};

export const isOrderWarehouseReady = async (orderId) => { const rows = await SupplierOrder.find({ customerOrderId: orderId }).select('status').lean(); return rows.length === 0 || rows.every((row) => row.status === SUPPLIER_ORDER_STATUS.RECEIVED_AT_WAREHOUSE); };
