import mongoose from 'mongoose';
import ProcurementPlan from './procurementPlan.model.js';
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
  ACTIVE_PROCUREMENT_PLAN_STATUSES,
  PROCUREMENT_PLAN_STATUS,
} from '../../constants/procurementPlanStatus.js';
import { compareSuppliersForProduct } from '../supplier/supplierProduct.service.js';

const assertValidId = (id, label) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label} ID`, 400);
  }
};

const pricesEqual = (a, b) => {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Math.round(Number(a) * 100) === Math.round(Number(b) * 100);
};

const roundMoney = (value) => Math.round(Number(value) * 100) / 100;

const isRankablePrice = (value) => {
  if (value == null) return false;
  const price = Number(value);
  return Number.isFinite(price) && price > 0;
};

const isPositiveInt = (value) => Number.isInteger(Number(value)) && Number(value) >= 1;

const writeAudit = async ({ actorId, ip, action, entityId, details }) => {
  await Audit.create({
    userId: actorId,
    action,
    entity: 'PROCUREMENT_PLAN',
    entityId,
    details,
    ip,
    severity: 'INFO',
  });
};

const calcItemCost = (plannedQuantity, price) => {
  if (!isPositiveInt(plannedQuantity) || !isRankablePrice(price)) return 0;
  return roundMoney(Number(plannedQuantity) * Number(price));
};

const recalcTotals = (items) => roundMoney(items.reduce((sum, item) => sum + (Number(item.estimatedCost) || 0), 0));

const requirePlan = async (planId) => {
  assertValidId(planId, 'procurement plan');
  const plan = await ProcurementPlan.findById(planId);
  if (!plan) throw new AppError('Procurement plan not found', 404);
  return plan;
};

const requireDraft = (plan) => {
  if (plan.status !== PROCUREMENT_PLAN_STATUS.DRAFT) {
    throw new AppError('Only draft procurement plans can be edited.', 400);
  }
};

const findActivePlanByDate = (procurementDate) =>
  ProcurementPlan.findOne({
    procurementDate,
    status: { $in: ACTIVE_PROCUREMENT_PLAN_STATUSES },
  });

const demandMap = (demand) => {
  const map = new Map();
  for (const row of demand.products || []) {
    map.set(String(row.productId), row);
  }
  return map;
};

const loadSelectableMapping = async ({ productId, supplierId, supplierProductId }) => {
  assertValidId(productId, 'product');
  assertValidId(supplierId, 'supplier');
  assertValidId(supplierProductId, 'supplier product');

  const [product, supplier, mapping] = await Promise.all([
    Product.findById(productId).select('name'),
    Supplier.findById(supplierId),
    SupplierProduct.findById(supplierProductId),
  ]);

  if (!product) throw new AppError('Product not found', 404);
  if (!supplier || supplier.isDeleted) throw new AppError('Supplier not found', 404);
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
    throw new AppError('Cannot set supplier while the product mapping is inactive.', 400);
  }
  if (!isRankablePrice(mapping.currentSupplierPrice)) {
    throw new AppError('Supplier price has not been configured for this product.', 400);
  }

  return {
    product,
    supplier,
    mapping,
    price: roundMoney(mapping.currentSupplierPrice),
    moq: Number(mapping.minimumOrderQuantity),
  };
};

const applySupplierSelection = (item, { supplier, mapping, price, moq }) => {
  const requiredQuantity = Number(item.requiredQuantity) || 0;
  const plannedQuantity = item.plannedQuantity == null
    ? requiredQuantity
    : Number(item.plannedQuantity);

  item.supplierId = supplier._id;
  item.supplierProductId = mapping._id;
  item.supplierNameSnapshot = supplier.supplierName;
  item.supplierPriceSnapshot = price;
  item.supplierMoqSnapshot = moq;
  item.plannedQuantity = plannedQuantity;
  item.estimatedCost = calcItemCost(plannedQuantity, price);
};

const validatePlannedQuantity = (plannedQuantity, requiredQuantity, moq) => {
  if (!isPositiveInt(plannedQuantity)) {
    throw new AppError('Planned quantity must be a positive whole number.', 400);
  }
  if (Number(plannedQuantity) < Number(requiredQuantity)) {
    throw new AppError('Planned quantity cannot be less than required quantity.', 400);
  }
  if (Number(plannedQuantity) < Number(moq)) {
    throw new AppError(`Planned quantity must be at least the supplier MOQ of ${moq}.`, 400);
  }
};

const buildItemsFromDemand = (demand) =>
  (demand.products || []).map((row) => ({
    productId: row.productId,
    productNameSnapshot: row.productName,
    requiredQuantity: Number(row.requiredQuantity) || 0,
    supplierId: null,
    supplierProductId: null,
    supplierNameSnapshot: '',
    plannedQuantity: null,
    supplierPriceSnapshot: null,
    supplierMoqSnapshot: null,
    estimatedCost: 0,
  }));

const collectWarnings = async (plan, demand) => {
  const warnings = [];
  const live = demandMap(demand);
  const mappingIds = plan.items.map((item) => item.supplierProductId).filter(Boolean);
  const supplierIds = plan.items.map((item) => item.supplierId).filter(Boolean);

  const [mappings, suppliers] = await Promise.all([
    mappingIds.length ? SupplierProduct.find({ _id: { $in: mappingIds } }) : [],
    supplierIds.length ? Supplier.find({ _id: { $in: supplierIds } }) : [],
  ]);
  const mappingById = new Map(mappings.map((doc) => [String(doc._id), doc]));
  const supplierById = new Map(suppliers.map((doc) => [String(doc._id), doc]));

  for (const row of demand.products || []) {
    const item = plan.items.find((entry) => String(entry.productId) === String(row.productId));
    if (!item) {
      warnings.push({
        type: 'UNPLANNED',
        productId: row.productId,
        message: `${row.productName} is in current demand but is not on this plan.`,
      });
      continue;
    }
    if (Number(row.requiredQuantity) > Number(item.requiredQuantity)) {
      warnings.push({
        type: 'DEMAND_INCREASED',
        productId: item.productId,
        message: `Current demand has increased from ${item.requiredQuantity} to ${row.requiredQuantity}. Review the procurement plan.`,
        previousRequired: item.requiredQuantity,
        currentRequired: row.requiredQuantity,
      });
    }
  }

  for (const item of plan.items) {
    const liveRow = live.get(String(item.productId));
    if (!item.supplierId) {
      warnings.push({
        type: 'UNPLANNED',
        productId: item.productId,
        message: `${item.productNameSnapshot || 'Product'} has no eligible supplier selected.`,
      });
      continue;
    }

    const supplier = supplierById.get(String(item.supplierId));
    const mapping = mappingById.get(String(item.supplierProductId));
    if (!supplier || supplier.isDeleted || supplier.status !== SUPPLIER_STATUS.ACTIVE) {
      warnings.push({
        type: 'SUPPLIER_INACTIVE',
        productId: item.productId,
        message: `${item.supplierNameSnapshot || 'Selected supplier'} is no longer active.`,
      });
      continue;
    }
    if (!mapping || mapping.availabilityStatus !== SUPPLIER_PRODUCT_STATUS.ACTIVE) {
      warnings.push({
        type: 'MAPPING_INACTIVE',
        productId: item.productId,
        message: `Selected supplier is no longer active for ${item.productNameSnapshot || 'this product'}.`,
      });
      continue;
    }
    if (!pricesEqual(item.supplierPriceSnapshot, mapping.currentSupplierPrice)) {
      warnings.push({
        type: 'PRICE_CHANGED',
        productId: item.productId,
        message: `Supplier price changed from ${formatCurrency(Number(item.supplierPriceSnapshot))} to ${formatCurrency(Number(mapping.currentSupplierPrice))}. Review the plan before confirming.`,
        snapshotPrice: item.supplierPriceSnapshot,
        currentPrice: mapping.currentSupplierPrice,
      });
    }
    if (Number(item.supplierMoqSnapshot) !== Number(mapping.minimumOrderQuantity)) {
      warnings.push({
        type: 'MOQ_CHANGED',
        productId: item.productId,
        message: `Supplier MOQ changed from ${item.supplierMoqSnapshot} to ${mapping.minimumOrderQuantity}. Review the plan before confirming.`,
        snapshotMoq: item.supplierMoqSnapshot,
        currentMoq: mapping.minimumOrderQuantity,
      });
    }
    if (item.plannedQuantity != null && Number(item.plannedQuantity) < Number(item.requiredQuantity)) {
      warnings.push({
        type: 'QUANTITY_BELOW_REQUIRED',
        productId: item.productId,
        message: 'Planned quantity cannot be less than required quantity.',
      });
    }
    if (item.plannedQuantity != null && Number(item.plannedQuantity) < Number(item.supplierMoqSnapshot)) {
      warnings.push({
        type: 'QUANTITY_BELOW_MOQ',
        productId: item.productId,
        message: `Planned quantity must be at least the supplier MOQ of ${item.supplierMoqSnapshot}.`,
      });
    }
    if (liveRow && item.plannedQuantity != null && Number(item.plannedQuantity) < Number(liveRow.requiredQuantity)) {
      warnings.push({
        type: 'QUANTITY_BELOW_LIVE_DEMAND',
        productId: item.productId,
        message: `Planned quantity cannot be less than current demand of ${liveRow.requiredQuantity}.`,
      });
    }
  }

  const plannedCount = plan.items.filter((item) => item.supplierId).length;
  return {
    warnings,
    readiness: {
      productsRequired: demand.productCount || 0,
      productsPlanned: plannedCount,
      canConfirm: warnings.length === 0
        && plannedCount === (demand.productCount || 0)
        && (demand.productCount || 0) > 0,
    },
  };
};

const serializePlan = (plan, extras = {}) => {
  const plain = plan?.toObject ? plan.toObject() : plan;
  return {
    _id: plain._id,
    procurementDate: plain.procurementDate,
    status: plain.status,
    items: (plain.items || []).map((item) => ({
      productId: item.productId,
      productNameSnapshot: item.productNameSnapshot,
      requiredQuantity: item.requiredQuantity,
      supplierId: item.supplierId,
      supplierProductId: item.supplierProductId,
      supplierNameSnapshot: item.supplierNameSnapshot || '',
      plannedQuantity: item.plannedQuantity,
      supplierPriceSnapshot: item.supplierPriceSnapshot,
      supplierMoqSnapshot: item.supplierMoqSnapshot,
      estimatedCost: item.estimatedCost || 0,
      additionalQuantity: item.plannedQuantity != null
        ? Math.max(0, Number(item.plannedQuantity) - Number(item.requiredQuantity))
        : 0,
    })),
    totalEstimatedCost: plain.totalEstimatedCost || 0,
    createdBy: plain.createdBy,
    updatedBy: plain.updatedBy,
    confirmedBy: plain.confirmedBy,
    confirmedAt: plain.confirmedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    ...extras,
  };
};

const withLiveContext = async (plan) => {
  const demand = await getProcurementDemand({ date: plan.procurementDate });
  const { warnings, readiness } = await collectWarnings(plan, demand);
  return {
    plan: serializePlan(plan),
    warnings,
    readiness,
    liveDemand: demand,
  };
};

export const getProcurementPlanByDate = async (date) => {
  const demand = await getProcurementDemand({ date });
  const plan = await findActivePlanByDate(demand.date);
  if (!plan) {
    return { plan: null, liveDemand: demand };
  }
  return withLiveContext(plan);
};

export const getProcurementPlanById = async (planId) => {
  const plan = await requirePlan(planId);
  return withLiveContext(plan);
};

export const createProcurementPlan = async (date, actorId, ip) => {
  const demand = await getProcurementDemand({ date });
  if (!demand.products.length) {
    throw new AppError('No procurement demand for this date.', 400);
  }

  const existing = await findActivePlanByDate(demand.date);
  if (existing) {
    return withLiveContext(existing);
  }

  let plan;
  try {
    plan = await ProcurementPlan.create({
      procurementDate: demand.date,
      status: PROCUREMENT_PLAN_STATUS.DRAFT,
      items: buildItemsFromDemand(demand),
      totalEstimatedCost: 0,
      createdBy: actorId || null,
      updatedBy: actorId || null,
    });
  } catch (err) {
    if (err?.code === 11000) {
      const raced = await findActivePlanByDate(demand.date);
      if (raced) return withLiveContext(raced);
    }
    throw err;
  }

  await writeAudit({
    actorId,
    ip,
    action: 'CREATE_PROCUREMENT_PLAN',
    entityId: plan._id,
    details: `Created draft procurement plan for ${demand.date}`,
  });

  return withLiveContext(plan);
};

export const updateProcurementPlan = async (planId, payload, actorId, ip) => {
  const plan = await requirePlan(planId);
  requireDraft(plan);

  if (payload.syncDemand) {
    const demand = await getProcurementDemand({ date: plan.procurementDate });
    const existingByProduct = new Map(plan.items.map((item) => [String(item.productId), item]));
    const nextItems = [];

    for (const row of demand.products) {
      const current = existingByProduct.get(String(row.productId));
      if (current) {
        current.requiredQuantity = row.requiredQuantity;
        current.productNameSnapshot = row.productName;
        if (current.supplierId) {
          current.estimatedCost = calcItemCost(current.plannedQuantity, current.supplierPriceSnapshot);
        }
        nextItems.push(current);
      } else {
        nextItems.push(buildItemsFromDemand({ products: [row] })[0]);
      }
    }
    plan.items = nextItems;
    plan.totalEstimatedCost = recalcTotals(plan.items);
  }

  for (const incoming of payload.items || []) {
    if (!incoming?.productId) continue;
    const item = plan.items.find((entry) => String(entry.productId) === String(incoming.productId));
    if (!item) {
      throw new AppError('Product is not part of this procurement plan.', 400);
    }

    if (incoming.refreshPrice && item.supplierId && item.supplierProductId) {
      const selected = await loadSelectableMapping({
        productId: item.productId,
        supplierId: item.supplierId,
        supplierProductId: item.supplierProductId,
      });
      applySupplierSelection(item, selected);
    }

    if (incoming.supplierId && incoming.supplierProductId) {
      const selected = await loadSelectableMapping({
        productId: item.productId,
        supplierId: incoming.supplierId,
        supplierProductId: incoming.supplierProductId,
      });
      if (incoming.plannedQuantity !== undefined) {
        item.plannedQuantity = incoming.plannedQuantity;
      }
      applySupplierSelection(item, selected);
      if (incoming.plannedQuantity !== undefined) {
        validatePlannedQuantity(item.plannedQuantity, item.requiredQuantity, selected.moq);
      }
    } else if (incoming.plannedQuantity !== undefined) {
      if (!item.supplierId) {
        throw new AppError('Select a supplier before setting planned quantity.', 400);
      }
      validatePlannedQuantity(
        incoming.plannedQuantity,
        item.requiredQuantity,
        item.supplierMoqSnapshot
      );
      item.plannedQuantity = Number(incoming.plannedQuantity);
      item.estimatedCost = calcItemCost(item.plannedQuantity, item.supplierPriceSnapshot);
    }
  }

  plan.totalEstimatedCost = recalcTotals(plan.items);
  plan.updatedBy = actorId || null;
  await plan.save();

  await writeAudit({
    actorId,
    ip,
    action: 'UPDATE_PROCUREMENT_PLAN',
    entityId: plan._id,
    details: `Updated draft procurement plan ${plan._id} for ${plan.procurementDate}`,
  });

  return withLiveContext(plan);
};

export const confirmProcurementPlan = async (planId, actorId, ip) => {
  const plan = await requirePlan(planId);
  requireDraft(plan);

  const demand = await getProcurementDemand({ date: plan.procurementDate });
  const { warnings, readiness } = await collectWarnings(plan, demand);
  if (!readiness.canConfirm) {
    const first = warnings[0]?.message || 'Review the procurement plan before confirming.';
    throw new AppError(first, 400, 'PROCUREMENT_PLAN_INVALID');
  }

  for (const row of demand.products) {
    const item = plan.items.find((entry) => String(entry.productId) === String(row.productId));
    const selected = await loadSelectableMapping({
      productId: item.productId,
      supplierId: item.supplierId,
      supplierProductId: item.supplierProductId,
    });
    validatePlannedQuantity(item.plannedQuantity, row.requiredQuantity, selected.moq);
    const expectedCost = calcItemCost(item.plannedQuantity, item.supplierPriceSnapshot);
    if (!pricesEqual(expectedCost, item.estimatedCost)) {
      item.estimatedCost = expectedCost;
    }
  }

  plan.totalEstimatedCost = recalcTotals(plan.items);
  plan.status = PROCUREMENT_PLAN_STATUS.CONFIRMED;
  plan.confirmedBy = actorId || null;
  plan.confirmedAt = new Date();
  plan.updatedBy = actorId || null;
  await plan.save();

  await writeAudit({
    actorId,
    ip,
    action: 'CONFIRM_PROCUREMENT_PLAN',
    entityId: plan._id,
    details: `Confirmed procurement plan ${plan._id} for ${plan.procurementDate}`,
  });

  return withLiveContext(plan);
};

export const cancelProcurementPlan = async (planId, actorId, ip) => {
  const plan = await requirePlan(planId);
  if (plan.status === PROCUREMENT_PLAN_STATUS.CANCELLED) {
    throw new AppError('Procurement plan is already cancelled.', 400);
  }

  plan.status = PROCUREMENT_PLAN_STATUS.CANCELLED;
  plan.updatedBy = actorId || null;
  await plan.save();

  await writeAudit({
    actorId,
    ip,
    action: 'CANCEL_PROCUREMENT_PLAN',
    entityId: plan._id,
    details: `Cancelled procurement plan ${plan._id} for ${plan.procurementDate}`,
  });

  return withLiveContext(plan);
};

export const getPlanSupplierOptions = async (planId, productId) => {
  const plan = await requirePlan(planId);
  const item = plan.items.find((entry) => String(entry.productId) === String(productId));
  if (!item) {
    throw new AppError('Product is not part of this procurement plan.', 400);
  }
  return compareSuppliersForProduct(productId);
};
