import mongoose from 'mongoose';
import SupplierCategory from './supplierCategory.model.js';
import SupplierProduct from './supplierProduct.model.js';
import Supplier from './supplier.model.js';
import Category from '../category/category.model.js';
import Product from '../product/product.model.js';
import Audit from '../audit/audit.model.js';
import AppError from '../../errors/AppError.js';
import { SUPPLIER_STATUS } from '../../constants/supplierStatus.js';
import { SUPPLIER_CATEGORY_STATUS } from '../../constants/supplierCategoryStatus.js';

const assertValidId = (id, label) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label} ID`, 400);
  }
};

const writeAudit = async ({ actorId, ip, action, entityId, details }) => {
  await Audit.create({
    userId: actorId,
    action,
    entity: 'SUPPLIER_CATEGORY',
    entityId,
    details,
    ip,
    severity: 'INFO',
  });
};

const populateCategory = (query) => query.populate('categoryId', 'name isActive parentId');

const requireSupplier = async (supplierId) => {
  assertValidId(supplierId, 'supplier');
  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }
  return supplier;
};

const requireActiveSupplier = async (supplierId) => {
  const supplier = await requireSupplier(supplierId);
  if (supplier.status !== SUPPLIER_STATUS.ACTIVE) {
    throw new AppError('This supplier is not active.', 400);
  }
  return supplier;
};

const requireCategory = async (categoryId) => {
  assertValidId(categoryId, 'category');
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new AppError('Category not found', 404);
  }
  return category;
};

const requireMapping = async (supplierId, mappingId) => {
  assertValidId(mappingId, 'supplier category');
  const mapping = await populateCategory(
    SupplierCategory.findOne({ _id: mappingId, supplierId })
  );
  if (!mapping) {
    throw new AppError('Supplier category association not found', 404);
  }
  return mapping;
};

const countSupplierProductsForCategory = async (supplierId, categoryId) => {
  const productIds = await Product.find({ categoryId }).select('_id').lean();
  if (productIds.length === 0) return 0;

  return SupplierProduct.countDocuments({
    supplierId,
    productId: { $in: productIds.map((product) => product._id) },
  });
};

const serializeMapping = async (doc) => {
  const plain = doc?.toObject ? doc.toObject() : doc;
  const category = plain.categoryId && typeof plain.categoryId === 'object' && plain.categoryId.name
    ? {
      _id: plain.categoryId._id,
      name: plain.categoryId.name,
      isActive: plain.categoryId.isActive,
    }
    : null;

  const categoryId = category?._id || plain.categoryId;
  const productCount = categoryId
    ? await countSupplierProductsForCategory(plain.supplierId, categoryId)
    : 0;

  return {
    _id: plain._id,
    supplierId: plain.supplierId,
    categoryId,
    category,
    name: category?.name || '—',
    status: plain.status,
    productCount,
    createdBy: plain.createdBy,
    updatedBy: plain.updatedBy,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const aggregateSupplierCategoryCounts = async (supplierIds = []) => {
  const normalizedIds = supplierIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (normalizedIds.length === 0) {
    return new Map();
  }

  const rows = await SupplierCategory.aggregate([
    { $match: { supplierId: { $in: normalizedIds } } },
    {
      $group: {
        _id: '$supplierId',
        categoryCount: { $sum: 1 },
        activeCategoryCount: {
          $sum: {
            $cond: [{ $eq: ['$status', SUPPLIER_CATEGORY_STATUS.ACTIVE] }, 1, 0],
          },
        },
      },
    },
  ]);

  return new Map(rows.map((row) => [String(row._id), {
    categoryCount: row.categoryCount,
    activeCategoryCount: row.activeCategoryCount,
  }]));
};

export const listSupplierCategories = async (supplierId, { status = 'all' } = {}) => {
  await requireSupplier(supplierId);

  const filter = { supplierId };
  if (status && status !== 'all') {
    filter.status = status;
  }

  const rows = await populateCategory(
    SupplierCategory.find(filter).sort({ createdAt: -1 })
  );

  const categories = await Promise.all(rows.map(serializeMapping));

  return {
    categories,
    total: categories.length,
  };
};

export const getSupplierCategory = async (supplierId, mappingId) => {
  await requireSupplier(supplierId);
  const mapping = await requireMapping(supplierId, mappingId);
  return serializeMapping(mapping);
};

export const createSupplierCategory = async (supplierId, data, actorId, ip) => {
  const supplier = await requireActiveSupplier(supplierId);
  const category = await requireCategory(data.categoryId);

  const existing = await SupplierCategory.findOne({
    supplierId: supplier._id,
    categoryId: category._id,
  });
  if (existing) {
    throw new AppError('This category is already associated with this supplier.', 400);
  }

  let mapping;
  try {
    mapping = await SupplierCategory.create({
      supplierId: supplier._id,
      categoryId: category._id,
      status: data.status || SUPPLIER_CATEGORY_STATUS.ACTIVE,
      createdBy: actorId || null,
      updatedBy: actorId || null,
    });
  } catch (err) {
    if (err?.code === 11000) {
      throw new AppError('This category is already associated with this supplier.', 400);
    }
    throw err;
  }

  await writeAudit({
    actorId,
    ip,
    action: 'CREATE_SUPPLIER_CATEGORY',
    entityId: mapping._id,
    details: `Associated category ${category.name} with supplier ${supplier.supplierName}`,
  });

  const populated = await populateCategory(SupplierCategory.findById(mapping._id));
  return serializeMapping(populated);
};

export const updateSupplierCategoryStatus = async (supplierId, mappingId, nextStatus, actorId, ip) => {
  await requireSupplier(supplierId);
  const mapping = await requireMapping(supplierId, mappingId);

  mapping.status = nextStatus;
  mapping.updatedBy = actorId || null;
  await mapping.save();

  const action = nextStatus === SUPPLIER_CATEGORY_STATUS.ACTIVE
    ? 'ACTIVATE_SUPPLIER_CATEGORY'
    : 'DEACTIVATE_SUPPLIER_CATEGORY';

  const categoryName = mapping.categoryId?.name || mapping.categoryId;

  await writeAudit({
    actorId,
    ip,
    action,
    entityId: mapping._id,
    details: `Set supplier category association ${mapping._id} (${categoryName}) to ${nextStatus}`,
  });

  const populated = await populateCategory(SupplierCategory.findById(mapping._id));
  return serializeMapping(populated);
};
