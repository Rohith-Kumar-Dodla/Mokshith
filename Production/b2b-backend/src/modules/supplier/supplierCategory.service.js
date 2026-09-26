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
const escapeRegex = (value) => String(value).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getSupplierCategorySummaries = async (supplierId) => {
  await requireSupplier(supplierId);

  const mappings = await SupplierCategory.find({ supplierId })
    .populate('categoryId', 'name isActive')
    .sort({ createdAt: -1 })
    .lean();

  const categoryIds = mappings
    .map((mapping) => mapping.categoryId?._id || mapping.categoryId)
    .filter(Boolean);

  const productCounts = categoryIds.length > 0
    ? await SupplierProduct.aggregate([
      { $match: { supplierId: new mongoose.Types.ObjectId(supplierId) } },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      { $match: { 'product.categoryId': { $in: categoryIds } } },
      { $group: { _id: '$product.categoryId', productCount: { $sum: 1 } } },
    ])
    : [];

  const countsByCategory = new Map(
    productCounts.map((row) => [String(row._id), row.productCount])
  );

  return mappings.map((mapping) => ({
    _id: mapping._id,
    supplierCategoryId: mapping._id,
    categoryId: mapping.categoryId?._id || mapping.categoryId,
    name: mapping.categoryId?.name || '—',
    status: mapping.status,
    productCount: countsByCategory.get(String(mapping.categoryId?._id || mapping.categoryId)) || 0,
  }));
};

export const listSupplierCategories = async (supplierId, { status = 'all', search = '', page = 1, limit = 20 } = {}) => {
  const supplier = await requireSupplier(supplierId);

  const filter = { supplierId };
  if (status && status !== 'all') {
    filter.status = status;
  }

  if (String(search).trim()) {
    const categoryIds = await Category.find({ name: { $regex: escapeRegex(search), $options: 'i' } }).distinct('_id');
    filter.categoryId = { $in: categoryIds };
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [rows, total] = await Promise.all([
    populateCategory(SupplierCategory.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))),
    SupplierCategory.countDocuments(filter),
  ]);

  const categories = await Promise.all(rows.map(serializeMapping));

  return {
    categories,
    supplier: { _id: supplier._id, supplierName: supplier.supplierName, status: supplier.status },
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)) || 1,
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
    throw new AppError('This category is already associated with this supplier.', 409);
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
      throw new AppError('This category is already associated with this supplier.', 409);
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

  if (nextStatus === SUPPLIER_CATEGORY_STATUS.INACTIVE) {
    const productCount = await countSupplierProductsForCategory(supplierId, mapping.categoryId?._id || mapping.categoryId);
    if (productCount > 0) {
      throw new AppError('Deactivate or remove the supplier products in this category first.', 409);
    }
  }

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

export const listNetworkCategories = async ({ page = 1, limit = 20, search = '' } = {}) => {
  const categoryMatch = String(search).trim() ? { name: { $regex: escapeRegex(search), $options: 'i' } } : {};
  const skip = (Number(page) - 1) * Number(limit);
  const [categories, total] = await Promise.all([
    Category.find(categoryMatch).sort({ name: 1 }).skip(skip).limit(Number(limit)).lean(),
    Category.countDocuments(categoryMatch),
  ]);
  const ids = categories.map((row) => row._id);
  const [supplierCounts, productCounts] = await Promise.all([
    SupplierCategory.aggregate([{ $match: { categoryId: { $in: ids } } }, { $group: { _id: '$categoryId', supplierCount: { $sum: 1 } } }]),
    SupplierProduct.aggregate([{ $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'product' } }, { $unwind: '$product' }, { $match: { 'product.categoryId': { $in: ids } } }, { $group: { _id: '$product.categoryId', productCount: { $sum: 1 } } }]),
  ]);
  const suppliers = new Map(supplierCounts.map((r) => [String(r._id), r.supplierCount]));
  const products = new Map(productCounts.map((r) => [String(r._id), r.productCount]));
  return { categories: categories.map((c) => ({ _id: c._id, name: c.name, isActive: c.isActive, supplierCount: suppliers.get(String(c._id)) || 0, productCount: products.get(String(c._id)) || 0 })), total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1 };
};
