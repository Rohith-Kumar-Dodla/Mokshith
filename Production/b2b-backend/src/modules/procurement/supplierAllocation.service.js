import mongoose from 'mongoose';
import SupplierAllocation from './supplierAllocation.model.js';
import SupplierOrder from './supplierOrder.model.js';
import Order from '../order/order.model.js';
import User from '../user/user.model.js';
import Product from '../product/product.model.js';
import Supplier from '../supplier/supplier.model.js';
import SupplierProduct from '../supplier/supplierProduct.model.js';
import Audit from '../audit/audit.model.js';
import AppError from '../../errors/AppError.js';
import { SUPPLIER_STATUS } from '../../constants/supplierStatus.js';
import { SUPPLIER_PRODUCT_STATUS } from '../../constants/supplierProductStatus.js';
import { compareSuppliersForProduct } from '../supplier/supplierProduct.service.js';
import { SUPPLIER_ORDER_STATUS } from '../../constants/supplierOrderStatus.js';

const validId = (id, label) => { if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(`Invalid ${label} ID`, 400); };
const money = (value) => Math.round(Number(value) * 100) / 100;

const totalsFor = async (orderId, productId, session) => {
  const aggregate = SupplierAllocation.aggregate([
    { $match: { customerOrderId: new mongoose.Types.ObjectId(orderId), productId: new mongoose.Types.ObjectId(productId), status: 'ACTIVE' } },
    { $group: { _id: null, allocated: { $sum: '$quantity' } } },
  ]);
  if (session) aggregate.session(session);
  const rows = await aggregate;
  return Number(rows[0]?.allocated || 0);
};

export const getForOrder = async (orderId) => {
  validId(orderId, 'order');
  const order = await Order.findById(orderId).select('items address shippingAddress').lean();
  if (!order) throw new AppError('Order not found', 404);
  const allocations = await SupplierAllocation.find({ customerOrderId: orderId, status: 'ACTIVE' }).populate('supplierId', 'supplierName companyName status').sort({ createdAt: 1 }).lean();
  const items = await Promise.all(order.items.map(async (item) => {
    const product = await Product.findById(item.productId).select('_id name').lean();
    if (!product) return null;
    const rows = allocations.filter((row) => String(row.productId) === String(item.productId));
    const allocated = rows.reduce((sum, row) => sum + Number(row.quantity), 0);
    const comparison = await compareSuppliersForProduct(product._id);
    return { productId: product._id, productName: product.name || item.name, orderedQuantity: Number(item.quantity), allocatedQuantity: allocated, remainingQuantity: Math.max(0, Number(item.quantity) - allocated), allocations: rows, suppliers: comparison.suppliers || [] };
  }));
  const cleanItems = items.filter(Boolean);
  const allocatedProducts = cleanItems.filter((item) => item.remainingQuantity === 0).length;
  const requests = await SupplierOrder.find({ customerOrderId: orderId }).populate('supplierId', 'supplierName companyName phone status').sort({ createdAt: -1 }).lean();
  const requestStatus = requests.length && requests.every((request) => request.status === 'RECEIVED_AT_WAREHOUSE') ? 'AWAITING_DELIVERY' : requests.some((request) => request.status === 'SENT' || request.status === 'ACKNOWLEDGED') ? 'REQUESTS_SENT' : null;
  return { orderId, status: requestStatus || (cleanItems.length === 0 || allocatedProducts === 0 ? 'NOT_ALLOCATED' : allocatedProducts === cleanItems.length ? 'FULLY_ALLOCATED' : 'PARTIALLY_ALLOCATED'), items: cleanItems, requests };
};

export const listQueue = async ({ orderId, status, supplierId, search, startDate, endDate, page = 1, limit = 25 } = {}) => {
  if (orderId) validId(orderId, 'order');
  const createdAt = {};
  if (startDate) createdAt.$gte = new Date(startDate);
  if (endDate) createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
  const orders = await Order.find({ ...(orderId ? { _id: orderId } : {}), ...(Object.keys(createdAt).length ? { createdAt } : {}) }).sort({ createdAt: -1 }).lean();
  const orderIds = orders.map((order) => order._id);
  if (orderIds.length === 0) {
    return { orders: [], total: 0, page: Number(page), pages: 1 };
  }
  const userIds = orders.map((order) => order.userId).filter((id) => mongoose.Types.ObjectId.isValid(id));
  const [allocationRows, requestRows, users] = await Promise.all([
    SupplierAllocation.find({ customerOrderId: { $in: orderIds }, status: 'ACTIVE' }).lean(),
    SupplierOrder.find({ customerOrderId: { $in: orderIds } }).sort({ createdAt: -1 }).lean(),
    User.find({ _id: { $in: userIds } }).select('name companyName email').lean(),
  ]);
  const usersById = new Map(users.map((user) => [String(user._id), user]));
  const filtered = [];
  for (const order of orders) {
    const customerRecord = usersById.get(String(order.userId));
    const customer = customerRecord?.name || customerRecord?.companyName || customerRecord?.email || 'Customer';
    if (search && !`${order._id} ${customer}`.toLowerCase().includes(String(search).toLowerCase())) continue;
    const allocations = allocationRows.filter((row) => String(row.customerOrderId) === String(order._id));
    const requests = requestRows.filter((row) => String(row.customerOrderId) === String(order._id));
    if (supplierId && !allocations.some((row) => String(row.supplierId?._id || row.supplierId) === String(supplierId))) continue;
    const items = Array.isArray(order.items) ? order.items : [];
    const allocatedProducts = items.filter((item) => allocations.some((row) => String(row.productId) === String(item.productId))).length;
    const fullyAllocatedProducts = items.filter((item) => allocations.filter((row) => String(row.productId) === String(item.productId)).reduce((sum, row) => sum + Number(row.quantity || 0), 0) >= Number(item.quantity || 0)).length;
    const requestStatus = requests.length && requests.every((request) => request.status === 'RECEIVED_AT_WAREHOUSE') ? 'AWAITING_DELIVERY' : requests.some((request) => request.status === 'SENT' || request.status === 'ACKNOWLEDGED') ? 'REQUESTS_SENT' : null;
    const allocationStatus = requestStatus || (fullyAllocatedProducts === 0 ? 'NOT_ALLOCATED' : fullyAllocatedProducts === items.length ? 'FULLY_ALLOCATED' : 'PARTIALLY_ALLOCATED');
    if (status && allocationStatus !== status) continue;
    filtered.push({ orderId: order._id, orderNumber: order.orderNumber || String(order._id).slice(-8), customer, totalAmount: order.totalAmount, createdAt: order.createdAt, status: allocationStatus, productCount: items.length, allocatedProducts, requests });
  }
  const start = (Number(page) - 1) * Number(limit);
  return { orders: filtered.slice(start, start + Number(limit)), total: filtered.length, page: Number(page), pages: Math.ceil(filtered.length / Number(limit)) || 1 };
};

export const getMetrics = async () => {
  const [orders, allocationTotals, requests] = await Promise.all([
    Order.find({}).select('items').lean(),
    SupplierAllocation.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: { orderId: '$customerOrderId', productId: '$productId' }, quantity: { $sum: '$quantity' } } },
    ]),
    SupplierOrder.find({}).select('status').lean(),
  ]);
  const allocatedByItem = new Map(allocationTotals.map((row) => [`${String(row._id.orderId)}:${String(row._id.productId)}`, Number(row.quantity || 0)]));
  let pendingAllocation = 0;
  let partiallyAllocated = 0;
  let fullyAllocated = 0;
  for (const order of orders) {
    const items = Array.isArray(order.items) ? order.items : [];
    if (!items.length) continue;
    const allocatedItems = items.filter((item) => (allocatedByItem.get(`${String(order._id)}:${String(item.productId)}`) || 0) >= Number(item.quantity || 0)).length;
    if (allocatedItems === 0) pendingAllocation += 1;
    else if (allocatedItems === items.length) fullyAllocated += 1;
    else partiallyAllocated += 1;
  }
  return { totalOrders: orders.length, pendingAllocation, partiallyAllocated, fullyAllocated, requestsPending: requests.filter((row) => row.status === 'ASSIGNED').length, requestsSent: requests.filter((row) => ['SENT', 'ACKNOWLEDGED', 'CONFIRMED', 'PROCESSING', 'READY'].includes(row.status)).length, awaitingWarehouse: requests.filter((row) => row.status === 'READY').length, readyForDelivery: requests.filter((row) => row.status === 'RECEIVED_AT_WAREHOUSE').length };
};

export const allocate = async ({ customerOrderId, productId, supplierId, supplierProductId, quantity, idempotencyKey, actorId, ip }) => {
  [customerOrderId, productId, supplierId, supplierProductId].forEach((id, index) => validId(id, ['order', 'product', 'supplier', 'supplier product'][index]));
  const duplicate = await SupplierAllocation.findOne({ idempotencyKey });
  if (duplicate) return duplicate.toObject();
  const lock = await Order.findOneAndUpdate({ _id: customerOrderId, supplierAllocationLock: { $ne: true } }, { $set: { supplierAllocationLock: true } }, { new: true });
  if (!lock) throw new AppError('This order is being updated. Please retry.', 409);
  try {
    const item = lock.items.find((row) => String(row.productId) === String(productId));
    if (!item) throw new AppError('Product is not part of the customer order.', 400);
    const [supplier, mapping] = await Promise.all([Supplier.findById(supplierId).lean(), SupplierProduct.findById(supplierProductId).lean()]);
    if (!supplier || supplier.status !== SUPPLIER_STATUS.ACTIVE || supplier.isDeleted) throw new AppError('Supplier is not active.', 400);
    if (!mapping || String(mapping.supplierId) !== String(supplierId) || String(mapping.productId) !== String(productId) || mapping.availabilityStatus !== SUPPLIER_PRODUCT_STATUS.ACTIVE) throw new AppError('Supplier product mapping is invalid or inactive.', 400);
    const price = Number(mapping.currentSupplierPrice);
    if (!Number.isFinite(price) || price <= 0) throw new AppError('Supplier price is not configured.', 400);
    const current = await totalsFor(customerOrderId, productId);
    if (current + Number(quantity) > Number(item.quantity)) throw new AppError(`Allocation exceeds ordered quantity. Remaining: ${Math.max(0, Number(item.quantity) - current)}.`, 400);
    const allocation = await SupplierAllocation.create({ customerOrderId, productId, supplierId, supplierProductId, quantity: Number(quantity), unitSupplierPriceSnapshot: money(price), idempotencyKey, createdBy: actorId, updatedBy: actorId });
    await Audit.create({ userId: actorId, action: 'SUPPLIER_ALLOCATION_CREATED', entity: 'SUPPLIER_ALLOCATION', entityId: allocation._id, details: `Allocated ${quantity} of product ${productId} to supplier ${supplierId}`, ip, severity: 'INFO' });
    return allocation.toObject();
  } finally { await Order.updateOne({ _id: customerOrderId }, { $set: { supplierAllocationLock: false } }); }
};

export const createRequests = async ({ customerOrderId, actorId, ip }) => {
  validId(customerOrderId, 'order');
  const rows = await SupplierAllocation.find({ customerOrderId, status: 'ACTIVE' }).lean();
  if (!rows.length) throw new AppError('Allocate at least one product before creating supplier requests.', 400);
  const groups = new Map(); rows.forEach((row) => { const key = String(row.supplierId); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(row); });
  const created = [];
  for (const group of groups.values()) {
    let request = await SupplierOrder.findOne({ customerOrderId, supplierId: group[0].supplierId, allocationRequestKey: `${customerOrderId}:${group[0].supplierId}` });
    const order = await Order.findById(customerOrderId).select('address shippingAddress').lean();
    const products = await Product.find({ _id: { $in: group.map((row) => row.productId) } }).select('name').lean();
    const names = new Map(products.map((product) => [String(product._id), product.name]));
    const items = group.map((row) => ({ productId: row.productId, productNameSnapshot: names.get(String(row.productId)) || 'Product', supplierProductId: row.supplierProductId, quantity: row.quantity, unitSupplierPrice: row.unitSupplierPriceSnapshot, subtotal: money(row.quantity * row.unitSupplierPriceSnapshot) }));
    if (request) { request.items = items; request.totalSupplierCost = money(items.reduce((sum, item) => sum + item.subtotal, 0)); await request.save(); }
    else { request = await SupplierOrder.create({ supplierOrderNumber: `SO-${new Date().getFullYear()}-${Date.now()}-${String(group[0].supplierId).slice(-4)}`, allocationRequestKey: `${customerOrderId}:${group[0].supplierId}`, customerOrderId, supplierId: group[0].supplierId, assignedBy: actorId, items, selectedSupplierPrice: items[0].unitSupplierPrice, totalSupplierCost: money(items.reduce((sum, item) => sum + item.subtotal, 0)), status: SUPPLIER_ORDER_STATUS.ASSIGNED, warehouseDestination: [order?.shippingAddress?.city || order?.address?.city, order?.shippingAddress?.addressLine || order?.address?.addressLine].filter(Boolean).join(', ') }); }
    await SupplierAllocation.updateMany({ _id: { $in: group.map((row) => row._id) } }, { $set: { supplierRequestId: request._id, updatedBy: actorId } });
    await Audit.create({ userId: actorId, action: 'SUPPLIER_REQUEST_CREATED', entity: 'SUPPLIER_ORDER', entityId: request._id, details: `Consolidated supplier request for order ${customerOrderId}`, ip, severity: 'INFO' });
    created.push(request.toObject ? request.toObject() : request);
  }
  return created;
};
