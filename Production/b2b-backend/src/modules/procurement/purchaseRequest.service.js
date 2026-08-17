import mongoose from 'mongoose';
import PurchaseRequest from './purchaseRequest.model.js';
import PurchaseRequestCounter from './purchaseRequestCounter.model.js';
import { getProcurementDemand } from './procurementDemand.service.js';
import Supplier from '../supplier/supplier.model.js';
import SupplierProduct from '../supplier/supplierProduct.model.js';
import Product from '../product/product.model.js';
import Audit from '../audit/audit.model.js';
import AppError from '../../errors/AppError.js';
import { formatCurrency } from '../../utils/currency.utils.js';
import { SUPPLIER_STATUS } from '../../constants/supplierStatus.js';
import { SUPPLIER_PRODUCT_STATUS } from '../../constants/supplierProductStatus.js';
import {
  CANCELLABLE_PURCHASE_REQUEST_STATUSES,
  EDITABLE_PURCHASE_REQUEST_STATUSES,
  PURCHASE_REQUEST_STATUS,
  RECEIVABLE_PURCHASE_REQUEST_STATUSES,
  TERMINAL_PURCHASE_REQUEST_STATUSES,
} from '../../constants/purchaseRequestStatus.js';
import { compareSuppliersForProduct } from '../supplier/supplierProduct.service.js';
import { addStock, getOrCreateDefaultWarehouse } from '../inventory/inventory.service.js';
import { DATE_ONLY_PATTERN } from '../../constants/procurementDemand.js';

const assertValidId = (id, label) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label} ID`, 400);
  }
};

const roundMoney = (value) => Math.round(Number(value) * 100) / 100;

const isRankablePrice = (value) => {
  if (value == null) return false;
  const price = Number(value);
  return Number.isFinite(price) && price > 0;
};

const isPositiveInt = (value) => Number.isInteger(Number(value)) && Number(value) >= 1;

const pricesEqual = (a, b) => {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Math.round(Number(a) * 100) === Math.round(Number(b) * 100);
};

const calcSubtotal = (purchaseQuantity, price) => {
  if (!isPositiveInt(purchaseQuantity) || !isRankablePrice(price)) return 0;
  return roundMoney(Number(purchaseQuantity) * Number(price));
};

const recalcTotal = (items) => roundMoney(
  (items || []).reduce((sum, item) => sum + (Number(item.estimatedSubtotal) || 0), 0)
);

const isPositiveIntOrZero = (value) => Number.isInteger(Number(value)) && Number(value) >= 0;

const sumReceiptQuantities = (item) => (item.receipts || []).reduce(
  (sum, receipt) => sum + Number(receipt.quantity || 0),
  0
);

const getItemReceivedQuantity = (item) => {
  const stored = Number(item.receivedQuantity || 0);
  const fromReceipts = sumReceiptQuantities(item);
  return Math.max(stored, fromReceipts);
};

const getItemRemainingReceivable = (item) => {
  const confirmed = Number(item.confirmedQuantity);
  if (!Number.isFinite(confirmed) || confirmed < 0) return 0;
  return Math.max(0, confirmed - getItemReceivedQuantity(item));
};

const computeFulfillmentStatus = (request) => {
  const items = request.items || [];
  if (!items.length) return request.status;

  const allAcknowledged = items.every((item) => isPositiveInt(Number(item.confirmedQuantity)));
  if (!allAcknowledged) {
    return request.status === PURCHASE_REQUEST_STATUS.SUBMITTED
      ? PURCHASE_REQUEST_STATUS.SUBMITTED
      : request.status;
  }

  const anyReceived = items.some((item) => getItemReceivedQuantity(item) > 0);
  const allFulfilled = items.every(
    (item) => getItemReceivedQuantity(item) >= Number(item.confirmedQuantity)
  );

  if (allFulfilled) return PURCHASE_REQUEST_STATUS.FULFILLED;
  if (anyReceived) return PURCHASE_REQUEST_STATUS.PARTIALLY_FULFILLED;
  return PURCHASE_REQUEST_STATUS.ACKNOWLEDGED;
};

const findRequestItem = (request, productId) => {
  const item = (request.items || []).find(
    (row) => String(row.productId) === String(productId)
  );
  if (!item) {
    throw new AppError('Product is not part of this purchase request.', 400);
  }
  return item;
};

const itemKey = (productId, supplierProductId) => `${String(productId)}:${String(supplierProductId)}`;

const writeAudit = async ({ actorId, ip, action, entityId, details, session }) => {
  const payload = {
    userId: actorId,
    action,
    entity: 'PURCHASE_REQUEST',
    entityId,
    details,
    ip,
    severity: 'INFO',
  };
  if (session) {
    await Audit.create([payload], { session });
  } else {
    await Audit.create(payload);
  }
};

export const generatePurchaseRequestNumber = async () => {
  const year = new Date().getFullYear();
  const counter = await PurchaseRequestCounter.findOneAndUpdate(
    { year },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return `PR-${year}-${String(counter.seq).padStart(4, '0')}`;
};

const requirePurchaseRequest = async (id) => {
  assertValidId(id, 'purchase request');
  const request = await PurchaseRequest.findById(id);
  if (!request) throw new AppError('Purchase request not found', 404);
  return request;
};

const requireDraft = (request) => {
  if (!EDITABLE_PURCHASE_REQUEST_STATUSES.includes(request.status)) {
    throw new AppError('Only draft purchase requests can be edited.', 400);
  }
};

const requireCancellable = (request) => {
  if (!CANCELLABLE_PURCHASE_REQUEST_STATUSES.includes(request.status)) {
    throw new AppError('This purchase request cannot be cancelled.', 400);
  }
  const hasReceipts = (request.items || []).some((item) => getItemReceivedQuantity(item) > 0);
  if (hasReceipts) {
    throw new AppError('Purchase requests with received goods cannot be cancelled.', 400);
  }
};

const loadSelectableMapping = async ({ supplierId, productId, supplierProductId }) => {
  assertValidId(supplierId, 'supplier');
  assertValidId(productId, 'product');
  assertValidId(supplierProductId, 'supplier product');

  const [supplier, product, mapping] = await Promise.all([
    Supplier.findById(supplierId),
    Product.findById(productId).select('name'),
    SupplierProduct.findById(supplierProductId),
  ]);

  if (!supplier || supplier.isDeleted) throw new AppError('Supplier not found', 404);
  if (!product) throw new AppError('Product not found', 404);
  if (!mapping) throw new AppError('Supplier product mapping not found', 404);

  if (String(mapping.supplierId) !== String(supplier._id)) {
    throw new AppError('Supplier product mapping does not belong to this supplier.', 400);
  }
  if (String(mapping.productId) !== String(product._id)) {
    throw new AppError('Supplier product mapping does not belong to this product.', 400);
  }
  if (supplier.status !== SUPPLIER_STATUS.ACTIVE) {
    throw new AppError('This supplier is not active.', 400);
  }
  if (mapping.availabilityStatus !== SUPPLIER_PRODUCT_STATUS.ACTIVE) {
    throw new AppError('This supplier product is no longer active.', 400);
  }
  if (!isRankablePrice(mapping.currentSupplierPrice)) {
    throw new AppError('Supplier purchase price must be greater than ₹0.', 400);
  }

  return {
    supplier,
    product,
    mapping,
    price: roundMoney(mapping.currentSupplierPrice),
    moq: Number(mapping.minimumOrderQuantity),
  };
};

export const validatePurchaseQuantity = (purchaseQuantity, demandQuantity, moq) => {
  if (!isPositiveInt(purchaseQuantity)) {
    throw new AppError('Purchase quantity must be a positive whole number.', 400);
  }
  if (Number(purchaseQuantity) < Number(moq)) {
    throw new AppError(`Purchase quantity must be at least the supplier MOQ of ${moq}.`, 400);
  }
  if (Number(purchaseQuantity) < Number(demandQuantity)) {
    throw new AppError('Purchase quantity cannot be less than demand quantity.', 400);
  }
};

export const suggestPurchaseQuantity = (demandQuantity, moq) => {
  const demand = Math.max(0, Number(demandQuantity) || 0);
  const minimum = Math.max(1, Number(moq) || 1);
  return Math.max(demand, minimum);
};

const buildItemFromSelection = async ({
  supplierId,
  productId,
  supplierProductId,
  demandQuantity,
  purchaseQuantity,
}) => {
  const selected = await loadSelectableMapping({ supplierId, productId, supplierProductId });
  const qty = purchaseQuantity == null
    ? suggestPurchaseQuantity(demandQuantity, selected.moq)
    : Number(purchaseQuantity);

  validatePurchaseQuantity(qty, demandQuantity, selected.moq);

  return {
    productId: selected.product._id,
    productNameSnapshot: selected.product.name,
    supplierProductId: selected.mapping._id,
    demandQuantity: Number(demandQuantity) || 0,
    purchaseQuantity: qty,
    supplierPriceSnapshot: selected.price,
    supplierMOQSnapshot: selected.moq,
    estimatedSubtotal: calcSubtotal(qty, selected.price),
  };
};

const mergeItems = (existingItems, incomingItems) => {
  const map = new Map();
  for (const item of existingItems || []) {
    map.set(itemKey(item.productId, item.supplierProductId), { ...item });
  }
  for (const item of incomingItems || []) {
    map.set(itemKey(item.productId, item.supplierProductId), item);
  }
  return Array.from(map.values());
};

const serializeItem = (item) => {
  const receivedQuantity = getItemReceivedQuantity(item);
  const confirmedQuantity = item.confirmedQuantity == null ? null : Number(item.confirmedQuantity);
  const remainingQuantity = confirmedQuantity == null
    ? null
    : Math.max(0, confirmedQuantity - receivedQuantity);

  return {
    productId: item.productId,
    productNameSnapshot: item.productNameSnapshot,
    supplierProductId: item.supplierProductId,
    demandQuantity: item.demandQuantity,
    purchaseQuantity: item.purchaseQuantity,
    supplierPriceSnapshot: item.supplierPriceSnapshot,
    supplierMOQSnapshot: item.supplierMOQSnapshot,
    estimatedSubtotal: item.estimatedSubtotal || 0,
    confirmedQuantity,
    receivedQuantity,
    remainingQuantity,
    unconfirmedQuantity: confirmedQuantity == null
      ? null
      : Math.max(0, Number(item.purchaseQuantity) - confirmedQuantity),
    additionalQuantity: Math.max(0, Number(item.purchaseQuantity) - Number(item.demandQuantity)),
    coveragePercent: Number(item.demandQuantity) > 0
      ? Math.round((Number(item.purchaseQuantity) / Number(item.demandQuantity)) * 100)
      : null,
    receipts: (item.receipts || []).map((receipt) => ({
      _id: receipt._id,
      quantity: Number(receipt.quantity),
      receivedAt: receipt.receivedAt,
      receivedBy: receipt.receivedBy,
      notes: receipt.notes || '',
    })),
  };
};

export const serializePurchaseRequest = (doc) => {
  const plain = doc?.toObject ? doc.toObject() : doc;
  return {
    _id: plain._id,
    purchaseRequestNumber: plain.purchaseRequestNumber,
    supplierId: plain.supplierId,
    supplierNameSnapshot: plain.supplierNameSnapshot || '',
    demandDate: plain.demandDate,
    status: plain.status,
    items: (plain.items || []).map(serializeItem),
    totalEstimatedCost: plain.totalEstimatedCost || 0,
    notes: plain.notes || '',
    expectedDeliveryDate: plain.expectedDeliveryDate || '',
    supplierResponseNotes: plain.supplierResponseNotes || '',
    requestedAt: plain.requestedAt,
    requestedBy: plain.requestedBy,
    submittedAt: plain.submittedAt,
    submittedBy: plain.submittedBy,
    acknowledgedAt: plain.acknowledgedAt,
    acknowledgedBy: plain.acknowledgedBy,
    fulfilledAt: plain.fulfilledAt,
    cancelledAt: plain.cancelledAt,
    cancelledBy: plain.cancelledBy,
    createdBy: plain.createdBy,
    updatedBy: plain.updatedBy,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const getDemandProductSupplierAllocation = async (date, productId) => {
  const demand = await getProcurementDemand({ date });
  const comparison = await compareSuppliersForProduct(productId);
  const demandRow = (demand.products || []).find(
    (row) => String(row.productId) === String(productId)
  );

  const demandQuantity = demandRow?.requiredQuantity ?? 0;

  return {
    demandDate: demand.date,
    product: comparison.product,
    demandQuantity,
    suppliers: (comparison.suppliers || []).map((row) => ({
      ...row,
      suggestedPurchaseQuantity: row.minimumOrderQuantity != null
        ? suggestPurchaseQuantity(demandQuantity, row.minimumOrderQuantity)
        : suggestPurchaseQuantity(demandQuantity, 1),
    })),
    lowestPrice: comparison.lowestPrice,
    emptyReason: comparison.emptyReason,
  };
};

export const listPurchaseRequests = async ({
  page = 1,
  limit = 20,
  status,
  supplierId,
  demandDate,
  search,
} = {}) => {
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  if (supplierId) {
    assertValidId(supplierId, 'supplier');
    filter.supplierId = supplierId;
  }
  if (demandDate) filter.demandDate = demandDate;
  if (search) {
    const escaped = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.purchaseRequestNumber = { $regex: escaped, $options: 'i' };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [rows, total] = await Promise.all([
    PurchaseRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    PurchaseRequest.countDocuments(filter),
  ]);

  return {
    purchaseRequests: rows.map(serializePurchaseRequest),
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)) || 1,
  };
};

export const getPurchaseRequestById = async (id) => {
  const request = await requirePurchaseRequest(id);
  return serializePurchaseRequest(request);
};

export const createPurchaseRequest = async (payload, actorId, ip) => {
  assertValidId(payload.supplierId, 'supplier');
  if (!payload.demandDate) throw new AppError('Demand date is required.', 400);

  const supplier = await Supplier.findById(payload.supplierId);
  if (!supplier || supplier.isDeleted) throw new AppError('Supplier not found', 404);
  if (supplier.status !== SUPPLIER_STATUS.ACTIVE) {
    throw new AppError('This supplier is not active.', 400);
  }

  const incomingItems = payload.items || [];
  if (!incomingItems.length) {
    throw new AppError('At least one purchase request item is required.', 400);
  }

  const builtItems = [];
  for (const row of incomingItems) {
    const item = await buildItemFromSelection({
      supplierId: payload.supplierId,
      productId: row.productId,
      supplierProductId: row.supplierProductId,
      demandQuantity: row.demandQuantity,
      purchaseQuantity: row.purchaseQuantity,
    });
    builtItems.push(item);
  }

  const mergedItems = mergeItems([], builtItems);
  const purchaseRequestNumber = await generatePurchaseRequestNumber();

  const request = await PurchaseRequest.create({
    purchaseRequestNumber,
    supplierId: supplier._id,
    supplierNameSnapshot: supplier.supplierName,
    demandDate: payload.demandDate,
    status: PURCHASE_REQUEST_STATUS.DRAFT,
    items: mergedItems,
    totalEstimatedCost: recalcTotal(mergedItems),
    notes: String(payload.notes || '').trim(),
    createdBy: actorId || null,
    updatedBy: actorId || null,
  });

  await writeAudit({
    actorId,
    ip,
    action: 'CREATE_PURCHASE_REQUEST',
    entityId: request._id,
    details: `Created draft purchase request ${request.purchaseRequestNumber} for ${supplier.supplierName}`,
  });

  return serializePurchaseRequest(request);
};

export const updatePurchaseRequest = async (id, payload, actorId, ip) => {
  const request = await requirePurchaseRequest(id);
  requireDraft(request);

  if (payload.supplierId && String(payload.supplierId) !== String(request.supplierId)) {
    throw new AppError('Supplier cannot be changed on an existing purchase request.', 400);
  }

  let nextItems = [...(request.items || [])];

  if (payload.removeProductIds?.length) {
    const removeSet = new Set(payload.removeProductIds.map(String));
    nextItems = nextItems.filter((item) => !removeSet.has(String(item.productId)));
  }

  if (payload.items?.length) {
    const builtItems = [];
    for (const row of payload.items) {
      const item = await buildItemFromSelection({
        supplierId: request.supplierId,
        productId: row.productId,
        supplierProductId: row.supplierProductId,
        demandQuantity: row.demandQuantity,
        purchaseQuantity: row.purchaseQuantity,
      });
      builtItems.push(item);
    }
    nextItems = mergeItems(nextItems, builtItems);
  }

  if (!nextItems.length) {
    throw new AppError('At least one purchase request item is required.', 400);
  }

  if (payload.notes !== undefined) {
    request.notes = String(payload.notes || '').trim();
  }

  request.items = nextItems;
  request.totalEstimatedCost = recalcTotal(nextItems);
  request.updatedBy = actorId || null;
  await request.save();

  await writeAudit({
    actorId,
    ip,
    action: 'UPDATE_PURCHASE_REQUEST',
    entityId: request._id,
    details: `Updated draft purchase request ${request.purchaseRequestNumber}`,
  });

  return serializePurchaseRequest(request);
};

const collectSubmitWarnings = async (request) => {
  const warnings = [];
  for (const item of request.items) {
    const mapping = await SupplierProduct.findById(item.supplierProductId);
    const supplier = await Supplier.findById(request.supplierId);
    if (!supplier || supplier.isDeleted || supplier.status !== SUPPLIER_STATUS.ACTIVE) {
      warnings.push({
        type: 'SUPPLIER_INACTIVE',
        productId: item.productId,
        message: 'This supplier is no longer active.',
      });
      continue;
    }
    if (!mapping || mapping.availabilityStatus !== SUPPLIER_PRODUCT_STATUS.ACTIVE) {
      warnings.push({
        type: 'MAPPING_INACTIVE',
        productId: item.productId,
        message: 'This supplier product is no longer active.',
      });
      continue;
    }
    if (!isRankablePrice(mapping.currentSupplierPrice)) {
      warnings.push({
        type: 'PRICE_MISSING',
        productId: item.productId,
        message: 'Supplier purchase price must be greater than ₹0.',
      });
      continue;
    }
    if (!pricesEqual(item.supplierPriceSnapshot, mapping.currentSupplierPrice)) {
      warnings.push({
        type: 'PRICE_CHANGED',
        productId: item.productId,
        message: `Supplier price changed from ${formatCurrency(Number(item.supplierPriceSnapshot))} to ${formatCurrency(Number(mapping.currentSupplierPrice))}.`,
        snapshotPrice: item.supplierPriceSnapshot,
        currentPrice: mapping.currentSupplierPrice,
      });
    }
    try {
      validatePurchaseQuantity(
        item.purchaseQuantity,
        item.demandQuantity,
        item.supplierMOQSnapshot
      );
    } catch (err) {
      warnings.push({
        type: 'INVALID_QUANTITY',
        productId: item.productId,
        message: err.message,
      });
    }
  }
  return warnings;
};

export const submitPurchaseRequest = async (id, payload = {}, actorId, ip) => {
  const request = await requirePurchaseRequest(id);
  requireDraft(request);

  if (!request.items?.length) {
    throw new AppError('At least one purchase request item is required.', 400);
  }

  const warnings = await collectSubmitWarnings(request);
  const priceWarnings = warnings.filter((row) => row.type === 'PRICE_CHANGED');
  const blockingWarnings = warnings.filter((row) => row.type !== 'PRICE_CHANGED');

  if (blockingWarnings.length) {
    throw new AppError(blockingWarnings[0].message, 400);
  }

  if (priceWarnings.length && !payload.confirmPriceRefresh) {
    throw new AppError(
      `${priceWarnings[0].message} Confirm the updated supplier price before submitting.`,
      400,
      'PRICE_CHANGED'
    );
  }

  if (payload.confirmPriceRefresh) {
    for (const item of request.items) {
      const selected = await loadSelectableMapping({
        supplierId: request.supplierId,
        productId: item.productId,
        supplierProductId: item.supplierProductId,
      });
      item.supplierPriceSnapshot = selected.price;
      item.supplierMOQSnapshot = selected.moq;
      item.estimatedSubtotal = calcSubtotal(item.purchaseQuantity, selected.price);
    }
    request.totalEstimatedCost = recalcTotal(request.items);
  }

  for (const item of request.items) {
    const expected = calcSubtotal(item.purchaseQuantity, item.supplierPriceSnapshot);
    if (!pricesEqual(expected, item.estimatedSubtotal)) {
      item.estimatedSubtotal = expected;
    }
  }
  request.totalEstimatedCost = recalcTotal(request.items);

  request.status = PURCHASE_REQUEST_STATUS.SUBMITTED;
  request.submittedAt = new Date();
  request.submittedBy = actorId || null;
  request.requestedAt = request.submittedAt;
  request.requestedBy = actorId || null;
  request.updatedBy = actorId || null;
  await request.save();

  await writeAudit({
    actorId,
    ip,
    action: 'SUBMIT_PURCHASE_REQUEST',
    entityId: request._id,
    details: `Submitted purchase request ${request.purchaseRequestNumber}`,
  });

  return serializePurchaseRequest(request);
};

export const acknowledgePurchaseRequest = async (id, payload, actorId, ip) => {
  const request = await requirePurchaseRequest(id);

  if (request.status !== PURCHASE_REQUEST_STATUS.SUBMITTED) {
    throw new AppError('Only submitted purchase requests can be acknowledged.', 400);
  }

  const incomingItems = payload.items || [];
  if (!incomingItems.length) {
    throw new AppError('At least one confirmed quantity is required.', 400);
  }

  const incomingByProduct = new Map(
    incomingItems.map((row) => [String(row.productId), row])
  );

  for (const item of request.items) {
    const incoming = incomingByProduct.get(String(item.productId));
    if (!incoming) {
      throw new AppError(`Confirmed quantity is required for ${item.productNameSnapshot || 'product'}.`, 400);
    }

    const confirmedQuantity = Number(incoming.confirmedQuantity);
    if (!isPositiveInt(confirmedQuantity)) {
      throw new AppError('Confirmed quantity must be a positive whole number.', 400);
    }
    if (confirmedQuantity > Number(item.purchaseQuantity)) {
      throw new AppError('Confirmed quantity cannot exceed purchase quantity.', 400);
    }

    item.confirmedQuantity = confirmedQuantity;
  }

  if (payload.expectedDeliveryDate) {
    if (!DATE_ONLY_PATTERN.test(String(payload.expectedDeliveryDate))) {
      throw new AppError('Expected delivery date must be YYYY-MM-DD.', 400);
    }
    request.expectedDeliveryDate = String(payload.expectedDeliveryDate);
  }

  request.supplierResponseNotes = String(payload.supplierResponseNotes || '').trim();
  request.status = PURCHASE_REQUEST_STATUS.ACKNOWLEDGED;
  request.acknowledgedAt = new Date();
  request.acknowledgedBy = actorId || null;
  request.updatedBy = actorId || null;
  await request.save();

  await writeAudit({
    actorId,
    ip,
    action: 'ACKNOWLEDGE_PURCHASE_REQUEST',
    entityId: request._id,
    details: `Acknowledged purchase request ${request.purchaseRequestNumber}`,
  });

  return serializePurchaseRequest(request);
};

export const receivePurchaseRequest = async (id, payload, actorId, ip) => {
  assertValidId(id, 'purchase request');
  assertValidId(payload.productId, 'product');

  const quantity = Number(payload.quantity);
  if (!isPositiveInt(quantity)) {
    throw new AppError('Receive quantity must be a positive whole number.', 400);
  }

  const productObjectId = new mongoose.Types.ObjectId(payload.productId);
  const existing = await PurchaseRequest.findById(id);
  if (!existing) throw new AppError('Purchase request not found', 404);

  if (!RECEIVABLE_PURCHASE_REQUEST_STATUSES.includes(existing.status)) {
    throw new AppError('Goods can only be received for acknowledged purchase requests.', 400);
  }

  const previewItem = findRequestItem(existing, payload.productId);
  if (previewItem.confirmedQuantity == null) {
    throw new AppError('Supplier confirmation is required before receiving goods.', 400);
  }

  const currentReceived = getItemReceivedQuantity(previewItem);
  const remaining = getItemRemainingReceivable(previewItem);
  if (quantity > remaining) {
    throw new AppError(`Receive quantity cannot exceed remaining quantity of ${remaining}.`, 400);
  }

  const warehouse = await getOrCreateDefaultWarehouse();
  const receipt = {
    quantity,
    receivedAt: new Date(),
    receivedBy: actorId || null,
    notes: String(payload.notes || '').trim(),
  };

  const updated = await PurchaseRequest.findOneAndUpdate(
    {
      _id: id,
      status: { $in: RECEIVABLE_PURCHASE_REQUEST_STATUSES },
      items: {
        $elemMatch: {
          productId: productObjectId,
          confirmedQuantity: { $gte: currentReceived + quantity },
          receivedQuantity: currentReceived,
        },
      },
    },
    {
      $push: { 'items.$.receipts': receipt },
      $inc: { 'items.$.receivedQuantity': quantity },
      $set: { updatedBy: actorId || null },
    },
    { new: true }
  );

  if (!updated) {
    throw new AppError('Receive quantity cannot exceed remaining receivable quantity.', 400);
  }

  const item = findRequestItem(updated, payload.productId);
  updated.status = computeFulfillmentStatus(updated);
  if (updated.status === PURCHASE_REQUEST_STATUS.FULFILLED) {
    updated.fulfilledAt = new Date();
  } else {
    updated.fulfilledAt = null;
  }

  try {
    await addStock({
      productId: item.productId,
      warehouseId: warehouse._id,
      stock: quantity,
    });
    await updated.save();
  } catch (err) {
    await PurchaseRequest.findOneAndUpdate(
      { _id: id, 'items.productId': productObjectId },
      {
        $pull: { 'items.$.receipts': { quantity, receivedAt: receipt.receivedAt } },
        $inc: { 'items.$.receivedQuantity': -quantity },
      }
    );
    throw err;
  }

  await writeAudit({
    actorId,
    ip,
    action: 'RECEIVE_PURCHASE_REQUEST',
    entityId: updated._id,
    details: `Received ${quantity} units of ${item.productNameSnapshot} for ${updated.purchaseRequestNumber}`,
  });

  return serializePurchaseRequest(updated);
};

export const cancelPurchaseRequest = async (id, actorId, ip) => {
  const request = await requirePurchaseRequest(id);
  requireCancellable(request);

  if (request.status === PURCHASE_REQUEST_STATUS.CANCELLED) {
    throw new AppError('Purchase request is already cancelled.', 400);
  }

  request.status = PURCHASE_REQUEST_STATUS.CANCELLED;
  request.cancelledAt = new Date();
  request.cancelledBy = actorId || null;
  request.updatedBy = actorId || null;
  await request.save();

  await writeAudit({
    actorId,
    ip,
    action: 'CANCEL_PURCHASE_REQUEST',
    entityId: request._id,
    details: `Cancelled purchase request ${request.purchaseRequestNumber}`,
  });

  return serializePurchaseRequest(request);
};
