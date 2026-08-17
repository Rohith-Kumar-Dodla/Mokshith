import mongoose from 'mongoose';
import Supplier from './supplier.model.js';
import Audit from '../audit/audit.model.js';
import AppError from '../../errors/AppError.js';
import { ROLES } from '../../constants/roles.js';
import { aggregateSupplierCatalogSummaries } from './supplierProduct.service.js';
import { aggregateSupplierCategoryCounts } from './supplierCategory.service.js';
import {
  SUPPLIER_STATUS,
  SUPPLIER_STATUS_TRANSITIONS,
} from '../../constants/supplierStatus.js';

const UPDATABLE_FIELDS = [
  'supplierName',
  'companyName',
  'contactPerson',
  'phone',
  'email',
  'businessAddress',
  'gstNumber',
  'notes',
];

const escapeRegex = (value) => String(value).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const blankToUndefined = (value) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed === '' ? undefined : trimmed;
};

const normalizeOptionalEmail = (value) => {
  const normalized = blankToUndefined(value);
  return normalized ? normalized.toLowerCase() : undefined;
};

const normalizeOptionalGst = (value) => {
  const normalized = blankToUndefined(value);
  return normalized ? normalized.toUpperCase() : undefined;
};

const assertValidId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid supplier ID', 400);
  }
};

const pickCreateFields = (data) => ({
  supplierName: String(data.supplierName || '').trim(),
  companyName: String(data.companyName || '').trim(),
  contactPerson: String(data.contactPerson || '').trim(),
  phone: String(data.phone || '').trim(),
  email: normalizeOptionalEmail(data.email),
  businessAddress: String(data.businessAddress || '').trim(),
  gstNumber: normalizeOptionalGst(data.gstNumber),
  notes: String(data.notes || '').trim(),
});

const pickUpdateFields = (data) => {
  const updates = {};
  for (const field of UPDATABLE_FIELDS) {
    if (data[field] === undefined) continue;
    if (field === 'email') {
      updates.email = normalizeOptionalEmail(data.email);
    } else if (field === 'gstNumber') {
      updates.gstNumber = normalizeOptionalGst(data.gstNumber);
    } else {
      updates[field] = typeof data[field] === 'string' ? data[field].trim() : data[field];
    }
  }
  return updates;
};

export const assertSupplierStatusTransition = (currentStatus, nextStatus) => {
  const allowed = SUPPLIER_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new AppError(
      `Invalid supplier status transition from ${currentStatus} to ${nextStatus}`,
      400
    );
  }
};

const ensureUniqueSupplierFields = async ({
  supplierName,
  companyName,
  email,
  gstNumber,
  excludeSupplierId = null,
}) => {
  const exclude = excludeSupplierId ? { _id: { $ne: excludeSupplierId } } : {};

  if (supplierName) {
    const existingName = await Supplier.findOne({
      ...exclude,
      supplierName: { $regex: `^${escapeRegex(supplierName)}$`, $options: 'i' },
    });
    if (existingName) {
      throw new AppError('A supplier with this name already exists', 400);
    }
  }

  if (companyName) {
    const existingCompany = await Supplier.findOne({
      ...exclude,
      companyName: { $regex: `^${escapeRegex(companyName)}$`, $options: 'i' },
    });
    if (existingCompany) {
      throw new AppError('A supplier with this company name already exists', 400);
    }
  }

  if (email) {
    const existingEmail = await Supplier.findOne({ ...exclude, email });
    if (existingEmail) {
      throw new AppError('A supplier with this email already exists', 400);
    }
  }

  if (gstNumber) {
    const existingGst = await Supplier.findOne({ ...exclude, gstNumber });
    if (existingGst) {
      throw new AppError('A supplier with this GST number already exists', 400);
    }
  }
};

const attachCatalogSummaries = async (suppliers) => {
  const supplierList = Array.isArray(suppliers) ? suppliers : [suppliers];
  if (supplierList.length === 0) return suppliers;

  const summaries = await aggregateSupplierCatalogSummaries(
    supplierList.map((supplier) => supplier._id)
  );
  const categorySummaries = await aggregateSupplierCategoryCounts(
    supplierList.map((supplier) => supplier._id)
  );

  const emptySummary = {
    productCount: 0,
    activeProductCount: 0,
    categoryCount: 0,
    activeCategoryCount: 0,
    pricesConfigured: 0,
    pricesNotSet: 0,
  };

  return supplierList.map((supplier) => {
    const plain = supplier?.toObject ? supplier.toObject() : supplier;
    const productSummary = summaries.get(String(plain._id)) || {};
    const categorySummary = categorySummaries.get(String(plain._id)) || {};
    return {
      ...plain,
      catalogSummary: {
        productCount: productSummary.productCount || 0,
        activeProductCount: productSummary.activeProductCount || 0,
        categoryCount: categorySummary.categoryCount || 0,
        activeCategoryCount: categorySummary.activeCategoryCount || 0,
        pricesConfigured: productSummary.pricesConfigured || 0,
        pricesNotSet: productSummary.pricesNotSet || 0,
      },
    };
  });
};

const writeAudit = async ({
  actorId,
  ip,
  action,
  entityId,
  details,
  severity = 'INFO',
}) => {
  await Audit.create({
    userId: actorId,
    action,
    entity: 'SUPPLIER',
    entityId,
    details,
    ip,
    severity,
  });
};

export const listSuppliers = async ({ page = 1, limit = 10, search = '', status = 'all' } = {}) => {
  const filter = {};

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (search) {
    const sanitized = escapeRegex(search);
    filter.$or = [
      { supplierName: { $regex: sanitized, $options: 'i' } },
      { companyName: { $regex: sanitized, $options: 'i' } },
      { contactPerson: { $regex: sanitized, $options: 'i' } },
      { phone: { $regex: sanitized, $options: 'i' } },
      { email: { $regex: sanitized, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [suppliers, total] = await Promise.all([
    Supplier.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Supplier.countDocuments(filter),
  ]);

  const suppliersWithSummary = await attachCatalogSummaries(suppliers);

  return {
    suppliers: suppliersWithSummary,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)) || 1,
  };
};

export const getSupplierById = async (id) => {
  assertValidId(id);
  const supplier = await Supplier.findById(id);
  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }
  const [withSummary] = await attachCatalogSummaries([supplier]);
  return withSummary;
};

export const createSupplier = async (data, actorId, ip) => {
  const fields = pickCreateFields(data);

  if (!fields.supplierName) {
    throw new AppError('Supplier name is required', 400);
  }
  if (!fields.companyName) {
    throw new AppError('Company name is required', 400);
  }

  await ensureUniqueSupplierFields(fields);

  let supplier;
  try {
    supplier = await Supplier.create({
      ...fields,
      role: ROLES.SUPPLIER,
      status: SUPPLIER_STATUS.PENDING,
      createdBy: actorId || null,
      userId: null,
    });
  } catch (err) {
    if (err?.code === 11000) {
      throw new AppError('A supplier with these details already exists', 400);
    }
    throw err;
  }

  await writeAudit({
    actorId,
    ip,
    action: 'CREATE_SUPPLIER',
    entityId: supplier._id,
    details: `Created supplier: ${supplier.supplierName}`,
  });

  return supplier;
};

export const updateSupplier = async (id, data, actorId, ip) => {
  assertValidId(id);
  const supplier = await Supplier.findById(id);
  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  const updates = pickUpdateFields(data);
  if (Object.keys(updates).length === 0) {
    throw new AppError('No supplier fields to update', 400);
  }

  await ensureUniqueSupplierFields({
    supplierName: updates.supplierName,
    companyName: updates.companyName,
    email: updates.email,
    gstNumber: updates.gstNumber,
    excludeSupplierId: id,
  });

  const unset = {};
  if (Object.prototype.hasOwnProperty.call(updates, 'email') && updates.email === undefined) {
    unset.email = 1;
    delete updates.email;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'gstNumber') && updates.gstNumber === undefined) {
    unset.gstNumber = 1;
    delete updates.gstNumber;
  }

  const updateQuery = { $set: updates };
  if (Object.keys(unset).length > 0) {
    updateQuery.$unset = unset;
  }

  const updated = await Supplier.findByIdAndUpdate(id, updateQuery, { new: true });

  await writeAudit({
    actorId,
    ip,
    action: 'UPDATE_SUPPLIER',
    entityId: id,
    details: `Updated supplier: ${supplier.supplierName}`,
  });

  return updated;
};

export const updateSupplierStatus = async (id, nextStatus, actorId, ip) => {
  assertValidId(id);
  const supplier = await Supplier.findById(id);
  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  assertSupplierStatusTransition(supplier.status, nextStatus);

  supplier.status = nextStatus;
  await supplier.save();

  const actionByStatus = {
    [SUPPLIER_STATUS.APPROVED]: 'APPROVE_SUPPLIER',
    [SUPPLIER_STATUS.ACTIVE]: 'ACTIVATE_SUPPLIER',
    [SUPPLIER_STATUS.INACTIVE]: 'DEACTIVATE_SUPPLIER',
  };

  await writeAudit({
    actorId,
    ip,
    action: actionByStatus[nextStatus] || 'UPDATE_SUPPLIER_STATUS',
    entityId: id,
    details: `Updated supplier status to ${nextStatus}: ${supplier.supplierName}`,
  });

  return supplier;
};
