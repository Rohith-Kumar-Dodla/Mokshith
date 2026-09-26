import mongoose from 'mongoose';
import SupplierProduct from './supplierProduct.model.js';
import SupplierProductPriceHistory from './supplierProductPriceHistory.model.js';
import SupplierCategory from './supplierCategory.model.js';
import Supplier from './supplier.model.js';
import Product from '../product/product.model.js';
import Category from '../category/category.model.js';
import Audit from '../audit/audit.model.js';
import SupplierAllocation from '../procurement/supplierAllocation.model.js';
import AppError from '../../errors/AppError.js';
import { SUPPLIER_STATUS } from '../../constants/supplierStatus.js';
import { SUPPLIER_PRODUCT_STATUS } from '../../constants/supplierProductStatus.js';
import { CATALOG_SCOPE } from '../../constants/catalogScope.js';
import { createProduct as createCanonicalProduct } from '../product/product.service.js';
import { getTransactionSupport } from '../../config/db.js';
import { formatCurrency } from '../../utils/currency.utils.js';

const UPDATABLE_FIELDS = ['minimumOrderQuantity', 'quantity', 'availabilityStatus', 'notes'];

const assertValidId = (id, label) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label} ID`, 400);
  }
};

const writeAudit = async ({ actorId, ip, action, entityId, details, session }) => {
  const payload = {
    userId: actorId,
    action,
    entity: 'SUPPLIER_PRODUCT',
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

const normalizeSupplierPrice = (value) => {
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) {
    throw new AppError('Supplier price must be a valid amount greater than 0.', 400);
  }
  // Match existing INR display precision (currency.utils / product money as Number).
  return Math.round(price * 100) / 100;
};

const pricesEqual = (a, b) => {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Math.round(Number(a) * 100) === Math.round(Number(b) * 100);
};

const serializeMapping = (doc) => {
  const plain = doc?.toObject ? doc.toObject() : doc;
  const populatedProduct = plain.productId && typeof plain.productId === 'object' && plain.productId.name
    ? {
      _id: plain.productId._id,
      name: plain.productId.name,
      sku: plain.productId.sku || '',
      unit: plain.productId.unit,
      image: plain.productId.image || '',
      imageUrl: plain.productId.imageUrl || '',
      imagePublicId: plain.productId.imagePublicId || null,
      updatedAt: plain.productId.updatedAt,
      isActive: plain.productId.isActive,
      catalogScope: plain.productId.catalogScope || 'CUSTOMER',
      categoryId: plain.productId.categoryId?._id || plain.productId.categoryId || null,
      category: plain.productId.categoryId && typeof plain.productId.categoryId === 'object'
        ? {
          _id: plain.productId.categoryId._id,
          name: plain.productId.categoryId.name,
        }
        : null,
    }
    : null;

  const currentSupplierPrice = plain.currentSupplierPrice == null
    ? null
    : Number(plain.currentSupplierPrice);

  return {
    _id: plain._id,
    supplierId: plain.supplierId,
    productId: populatedProduct?._id || plain.productId,
    product: populatedProduct,
    minimumOrderQuantity: plain.minimumOrderQuantity,
    quantity: Number(plain.quantity || 0),
    currentSupplierPrice,
    availabilityStatus: plain.availabilityStatus,
    notes: plain.notes || '',
    createdBy: plain.createdBy,
    updatedBy: plain.updatedBy,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

const serializePriceHistory = (doc) => {
  const plain = doc?.toObject ? doc.toObject() : doc;
  return {
    _id: plain._id,
    supplierProductId: plain.supplierProductId,
    supplierId: plain.supplierId,
    productId: plain.productId,
    price: Number(plain.price),
    previousPrice: plain.previousPrice == null ? null : Number(plain.previousPrice),
    changedBy: plain.changedBy,
    changedAt: plain.changedAt,
  };
};

export const isSupplierPriceConfigured = (value) => {
  if (value == null) return false;
  const price = Number(value);
  return Number.isFinite(price) && price > 0;
};

const populateProduct = (query) => query.populate({
  path: 'productId',
  select: 'name sku unit image imageUrl imagePublicId updatedAt isActive categoryId catalogScope',
  populate: { path: 'categoryId', select: 'name' },
});

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

const requireProduct = async (productId) => {
  assertValidId(productId, 'product');
  const product = await Product.findById(productId).populate('categoryId', 'name');
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  return product;
};

const requireSupplierCategoryForSupplier = async (supplierId, supplierCategoryId) => {
  assertValidId(supplierCategoryId, 'supplier category');
  const mapping = await SupplierCategory.findOne({ _id: supplierCategoryId, supplierId })
    .populate('categoryId', 'name isActive');
  if (!mapping) {
    throw new AppError('Please select a valid supplier category.', 400);
  }
  return mapping;
};

const canonicalCategoryIdFromSupplierCategory = (supplierCategory) => {
  const category = supplierCategory.categoryId;
  return String(category?._id || category);
};

const assertProductMatchesSupplierCategory = (product, supplierCategory) => {
  const productCategoryId = String(product.categoryId?._id || product.categoryId);
  const supplierCategoryId = canonicalCategoryIdFromSupplierCategory(supplierCategory);
  if (productCategoryId !== supplierCategoryId) {
    throw new AppError('Selected supplier category does not match the product category.', 400);
  }
};

const serializeProductSearchResult = (product, mappedProductIds) => ({
  _id: product._id,
  name: product.name,
  sku: product.sku || '',
  price: product.price,
  moq: product.moq,
  isActive: product.isActive,
  category: product.categoryId && typeof product.categoryId === 'object'
    ? { _id: product.categoryId._id, name: product.categoryId.name }
    : null,
  vendor: product.vendorId && typeof product.vendorId === 'object'
    ? { _id: product.vendorId._id, name: product.vendorId.name }
    : null,
  company: product.companyId && typeof product.companyId === 'object'
    ? { _id: product.companyId._id, name: product.companyId.name }
    : null,
  alreadyMapped: mappedProductIds.has(String(product._id)),
});

const requireMapping = async (supplierId, mappingId, { session } = {}) => {
  assertValidId(mappingId, 'supplier product');
  let query = SupplierProduct.findOne({ _id: mappingId, supplierId });
  if (session) query = query.session(session);
  const mapping = await populateProduct(query);
  if (!mapping) {
    throw new AppError('Supplier product mapping not found', 404);
  }
  return mapping;
};

const escapeRegex = (value) => String(value).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const resolveProductIdsForCatalogFilters = async ({ search, categoryId } = {}) => {
  const normalizedSearch = String(search || '').trim();
  const hasCategory = categoryId && categoryId !== 'all';
  if (!normalizedSearch && !hasCategory) return null;

  const productFilter = {};
  if (hasCategory) {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new AppError('Invalid category ID', 400);
    }
    productFilter.categoryId = categoryId;
  }
  if (normalizedSearch) {
    productFilter.name = { $regex: escapeRegex(normalizedSearch), $options: 'i' };
  }

  const products = await Product.find(productFilter).select('_id').lean();
  return products.map((product) => product._id);
};

const buildSupplierProductCatalogFilter = ({
  supplierId,
  status = 'all',
  priceStatus = 'all',
  productIds = null,
} = {}) => {
  const filter = { supplierId };

  if (status && status !== 'all') {
    filter.availabilityStatus = status;
  }

  if (priceStatus === 'set') {
    filter.currentSupplierPrice = { $gt: 0 };
  } else if (priceStatus === 'not_set') {
    filter.$or = [
      { currentSupplierPrice: null },
      { currentSupplierPrice: { $exists: false } },
      { currentSupplierPrice: { $lte: 0 } },
    ];
  }

  if (productIds) {
    filter.productId = { $in: productIds };
  }

  return filter;
};

export const aggregateSupplierCatalogSummaries = async (supplierIds = []) => {
  const normalizedIds = supplierIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (normalizedIds.length === 0) {
    return new Map();
  }

  const rows = await SupplierProduct.aggregate([
    { $match: { supplierId: { $in: normalizedIds } } },
    {
      $lookup: {
        from: 'products',
        localField: 'productId',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $group: {
        _id: '$supplierId',
        productCount: { $sum: 1 },
        activeProductCount: {
          $sum: {
            $cond: [{ $eq: ['$availabilityStatus', SUPPLIER_PRODUCT_STATUS.ACTIVE] }, 1, 0],
          },
        },
        pricesConfigured: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$currentSupplierPrice', null] },
                  { $gt: ['$currentSupplierPrice', 0] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $project: {
        productCount: 1,
        activeProductCount: 1,
        pricesConfigured: 1,
        pricesNotSet: { $subtract: ['$productCount', '$pricesConfigured'] },
      },
    },
  ]);

  return new Map(rows.map((row) => [String(row._id), {
    productCount: row.productCount,
    activeProductCount: row.activeProductCount,
    pricesConfigured: row.pricesConfigured,
    pricesNotSet: row.pricesNotSet,
  }]));
};

export const getSupplierCatalogSummary = async (supplierId) => {
  await requireSupplier(supplierId);
  const summaries = await aggregateSupplierCatalogSummaries([supplierId]);
  return summaries.get(String(supplierId)) || {
    productCount: 0,
    activeProductCount: 0,
    pricesConfigured: 0,
    pricesNotSet: 0,
  };
};

export const listSupplierProducts = async (
  supplierId,
  {
    page = 1,
    limit = 10,
    status = 'all',
    search,
    categoryId,
    priceStatus = 'all',
  } = {}
) => {
  await requireSupplier(supplierId);

  const productIds = await resolveProductIdsForCatalogFilters({ search, categoryId });
  if (productIds && productIds.length === 0) {
    return {
      mappings: [],
      total: 0,
      page: Number(page),
      pages: 1,
    };
  }

  const filter = buildSupplierProductCatalogFilter({
    supplierId,
    status,
    priceStatus,
    productIds,
  });

  const skip = (Number(page) - 1) * Number(limit);
  const [rows, total] = await Promise.all([
    populateProduct(SupplierProduct.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))),
    SupplierProduct.countDocuments(filter),
  ]);

  return {
    mappings: rows.map(serializeMapping),
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)) || 1,
  };
};

export const listSupplierCategoryProducts = async (
  supplierId,
  categoryId,
  { page = 1, limit = 12, status = 'all', search = '' } = {}
) => {
  const supplier = await requireSupplier(supplierId);
  assertValidId(categoryId, 'category');

  const category = await Category.findById(categoryId).select('name isActive').lean();
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  const association = await SupplierCategory.findOne({ supplierId, categoryId }).select('_id status').lean();
  if (!association) {
    throw new AppError('Supplier category association not found', 404);
  }

  const result = await listSupplierProducts(supplierId, {
    page,
    limit,
    status,
    search,
    categoryId,
  });

  return {
    supplier: {
      _id: supplier._id,
      supplierName: supplier.supplierName,
      companyName: supplier.companyName,
      status: supplier.status,
    },
    category: {
      _id: category._id,
      name: category.name,
      isActive: category.isActive,
      associationId: association._id,
      associationStatus: association.status,
    },
    products: result.mappings,
    total: result.total,
    page: result.page,
    pages: result.pages,
  };
};

export const getSupplierProduct = async (supplierId, mappingId) => {
  await requireSupplier(supplierId);
  const mapping = await requireMapping(supplierId, mappingId);
  return serializeMapping(mapping);
};

export const searchProductsForSupplier = async (supplierId, { search = '', page = 1, limit = 20, categoryId } = {}) => {
  await requireSupplier(supplierId);

  const normalizedSearch = String(search || '').trim();
  const filter = {};
  if (categoryId) {
    assertValidId(categoryId, 'category');
    const category = await Category.findById(categoryId).select('_id').lean();
    if (!category) throw new AppError('Category not found', 404);
    const association = await SupplierCategory.findOne({ supplierId, categoryId }).select('_id').lean();
    if (!association) throw new AppError('Supplier category association not found', 404);
    filter.categoryId = categoryId;
  }
  if (normalizedSearch) {
    if (mongoose.Types.ObjectId.isValid(normalizedSearch)) {
      filter.$or = [
        { _id: normalizedSearch },
        { name: { $regex: escapeRegex(normalizedSearch), $options: 'i' } },
        { sku: { $regex: escapeRegex(normalizedSearch), $options: 'i' } },
      ];
    } else {
      filter.$or = [
        { name: { $regex: escapeRegex(normalizedSearch), $options: 'i' } },
        { sku: { $regex: escapeRegex(normalizedSearch), $options: 'i' } },
      ];
    }
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total, existingMappings] = await Promise.all([
    Product.find(filter)
      .select('name sku price moq isActive categoryId vendorId companyId')
      .populate('categoryId', 'name')
      .populate('vendorId', 'name')
      .populate('companyId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Product.countDocuments(filter),
    SupplierProduct.find({ supplierId }).select('productId').lean(),
  ]);

  const mappedProductIds = new Set(existingMappings.map((row) => String(row.productId)));

  return {
    products: products.map((product) => serializeProductSearchResult(product, mappedProductIds)),
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)) || 1,
  };
};

export const createSupplierProduct = async (supplierId, data, actorId, ip) => {
  const supplier = await requireActiveSupplier(supplierId);
  const product = await requireProduct(data.productId);

  if (data.supplierPrice != null && data.supplierPrice !== '') {
    normalizeSupplierPrice(data.supplierPrice);
    if ((data.availabilityStatus || SUPPLIER_PRODUCT_STATUS.ACTIVE) !== SUPPLIER_PRODUCT_STATUS.ACTIVE) {
      throw new AppError('Cannot set supplier price while the product mapping is inactive.', 400);
    }
  }

  if (data.supplierCategoryId) {
    const supplierCategory = await requireSupplierCategoryForSupplier(supplierId, data.supplierCategoryId);
    assertProductMatchesSupplierCategory(product, supplierCategory);
  }

  const minimumOrderQuantity = Number(data.minimumOrderQuantity);
  if (!Number.isInteger(minimumOrderQuantity) || minimumOrderQuantity < 1) {
    throw new AppError('Minimum order quantity must be a positive number.', 400);
  }

  const existing = await SupplierProduct.findOne({
    supplierId: supplier._id,
    productId: product._id,
  });
  if (existing) {
    throw new AppError('This product is already mapped to this supplier.', 400);
  }

  let mapping;
  try {
    mapping = await SupplierProduct.create({
      supplierId: supplier._id,
      productId: product._id,
      minimumOrderQuantity,
      quantity: Number(data.quantity || 0),
      availabilityStatus: data.availabilityStatus || SUPPLIER_PRODUCT_STATUS.ACTIVE,
      notes: String(data.notes || '').trim(),
      currentSupplierPrice: null,
      createdBy: actorId || null,
      updatedBy: actorId || null,
    });
  } catch (err) {
    if (err?.code === 11000) {
      throw new AppError('This product is already mapped to this supplier.', 400);
    }
    throw err;
  }

  await writeAudit({
    actorId,
    ip,
    action: 'CREATE_SUPPLIER_PRODUCT',
    entityId: mapping._id,
    details: `Mapped product ${product._id} to supplier ${supplier._id} (MOQ ${minimumOrderQuantity})`,
  });

  if (data.supplierPrice != null && data.supplierPrice !== '') {
    await setSupplierProductPrice(supplierId, mapping._id, data.supplierPrice, actorId, ip);
    const populated = await populateProduct(SupplierProduct.findById(mapping._id));
    return serializeMapping(populated);
  }

  const populated = await populateProduct(SupplierProduct.findById(mapping._id));
  return serializeMapping(populated);
};

export const createSupplierCategoryProduct = async (supplierId, categoryId, data, actorId, ip) => {
  await requireSupplier(supplierId);
  assertValidId(categoryId, 'category');
  const category = await Category.findById(categoryId).select('_id').lean();
  if (!category) throw new AppError('Category not found', 404);
  const association = await SupplierCategory.findOne({ supplierId, categoryId }).select('_id').lean();
  if (!association) throw new AppError('Supplier category association not found', 404);
  return createSupplierProduct(
    supplierId,
    { ...data, supplierCategoryId: association._id },
    actorId,
    ip
  );
};

const requireCategoryScopedMapping = async (supplierId, categoryId, mappingId) => {
  await requireSupplier(supplierId);
  assertValidId(categoryId, 'category');
  const category = await Category.findById(categoryId).select('_id').lean();
  if (!category) throw new AppError('Category not found', 404);
  const association = await SupplierCategory.findOne({ supplierId, categoryId }).select('_id').lean();
  if (!association) throw new AppError('Supplier category association not found', 404);
  const mapping = await requireMapping(supplierId, mappingId);
  const productCategoryId = String(mapping.productId?.categoryId?._id || mapping.productId?.categoryId || '');
  if (productCategoryId !== String(categoryId)) {
    throw new AppError('Supplier product mapping does not belong to this category.', 404);
  }
  return mapping;
};

export const updateSupplierCategoryProduct = async (supplierId, categoryId, mappingId, data, actorId, ip) => {
  const mapping = await requireCategoryScopedMapping(supplierId, categoryId, mappingId);
  const nextStatus = data.availabilityStatus || mapping.availabilityStatus;
  if (data.supplierPrice !== undefined && nextStatus !== SUPPLIER_PRODUCT_STATUS.ACTIVE) {
    throw new AppError('Cannot set supplier price while the product mapping is inactive.', 400);
  }
  const mappingUpdates = Object.fromEntries(
    Object.entries(data).filter(([key]) => key !== 'supplierPrice')
  );
  let updated = serializeMapping(mapping);
  if (Object.keys(mappingUpdates).length > 0) {
    updated = await updateSupplierProduct(supplierId, mappingId, mappingUpdates, actorId, ip);
  }
  if (data.supplierPrice !== undefined && !pricesEqual(updated.currentSupplierPrice, data.supplierPrice)) {
    updated = await setSupplierProductPrice(supplierId, mappingId, data.supplierPrice, actorId, ip);
  }
  return updated;
};

export const createSupplierProductWithNewProduct = async (supplierId, data, actorId, ip) => {
  await requireActiveSupplier(supplierId);
  const supplierCategory = await requireSupplierCategoryForSupplier(supplierId, data.supplierCategoryId);
  const canonicalCategoryId = canonicalCategoryIdFromSupplierCategory(supplierCategory);

  const minimumOrderQuantity = Number(data.minimumOrderQuantity);
  if (!Number.isInteger(minimumOrderQuantity) || minimumOrderQuantity < 1) {
    throw new AppError('Minimum order quantity must be a positive number.', 400);
  }

  const productInput = data.product || {};
  const customerPrice = Number(productInput.price);
  if (!Number.isFinite(customerPrice) || customerPrice <= 0) {
    throw new AppError('Customer selling price must be greater than 0', 400);
  }
  if (!String(productInput.name || '').trim()) {
    throw new AppError('Product name is required', 400);
  }

  const productPayload = {
    name: String(productInput.name).trim(),
    description: String(productInput.description || '').trim(),
    price: customerPrice,
    categoryId: canonicalCategoryId,
    stock: productInput.stock != null ? Number(productInput.stock) : 0,
    moq: productInput.moq != null ? Number(productInput.moq) : 1,
    isActive: productInput.isActive !== false,
    imageUrl: productInput.imageUrl || undefined,
    catalogScope: CATALOG_SCOPE.SUPPLIER_ONLY,
  };

  let createdProduct = null;
  try {
    createdProduct = await createCanonicalProduct(productPayload);

    return await createSupplierProduct(
      supplierId,
      {
        productId: createdProduct._id,
        supplierCategoryId: data.supplierCategoryId,
        minimumOrderQuantity,
        availabilityStatus: data.availabilityStatus,
        notes: data.notes,
        supplierPrice: data.supplierPrice,
      },
      actorId,
      ip
    );
  } catch (err) {
    if (createdProduct?._id) {
      await SupplierProduct.deleteMany({ supplierId, productId: createdProduct._id });
      await Product.findByIdAndDelete(createdProduct._id);
    }
    throw err;
  }
};

export const updateSupplierProduct = async (supplierId, mappingId, data, actorId, ip) => {
  await requireSupplier(supplierId);
  const mapping = await requireMapping(supplierId, mappingId);

  const updates = {};
  for (const field of UPDATABLE_FIELDS) {
    if (data[field] === undefined) continue;
    if (field === 'minimumOrderQuantity') {
      const moq = Number(data.minimumOrderQuantity);
      if (!Number.isInteger(moq) || moq < 1) {
        throw new AppError('Minimum order quantity must be a positive number.', 400);
      }
      updates.minimumOrderQuantity = moq;
    } else if (field === 'quantity') {
      const quantity = Number(data.quantity);
      if (!Number.isInteger(quantity) || quantity < 0) {
        throw new AppError('Supplier quantity must be a non-negative integer.', 400);
      }
      updates.quantity = quantity;
    } else if (field === 'notes') {
      updates.notes = String(data.notes || '').trim();
    } else {
      updates[field] = data[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError('No supplier product fields to update', 400);
  }

  updates.updatedBy = actorId || null;
  const updated = await populateProduct(
    SupplierProduct.findByIdAndUpdate(mapping._id, { $set: updates }, { new: true })
  );

  await writeAudit({
    actorId,
    ip,
    action: 'UPDATE_SUPPLIER_PRODUCT',
    entityId: mapping._id,
    details: `Updated supplier product mapping ${mapping._id} for supplier ${supplierId}`,
  });

  return serializeMapping(updated);
};

export const updateSupplierProductStatus = async (supplierId, mappingId, nextStatus, actorId, ip) => {
  await requireSupplier(supplierId);
  const mapping = await requireMapping(supplierId, mappingId);

  mapping.availabilityStatus = nextStatus;
  mapping.updatedBy = actorId || null;
  await mapping.save();

  const action = nextStatus === SUPPLIER_PRODUCT_STATUS.ACTIVE
    ? 'ACTIVATE_SUPPLIER_PRODUCT'
    : 'DEACTIVATE_SUPPLIER_PRODUCT';

  await writeAudit({
    actorId,
    ip,
    action,
    entityId: mapping._id,
    details: `Set supplier product mapping ${mapping._id} to ${nextStatus}`,
  });

  const populated = await populateProduct(SupplierProduct.findById(mapping._id));
  return serializeMapping(populated);
};

export const removeSupplierProduct = async (supplierId, mappingId, actorId, ip) => {
  await requireSupplier(supplierId);
  const mapping = await requireMapping(supplierId, mappingId);
  const activeAllocation = await SupplierAllocation.exists({
    supplierProductId: mapping._id,
    status: 'ACTIVE',
  });
  if (activeAllocation) {
    throw new AppError('This supplier product has an active allocation and cannot be removed.', 409);
  }
  if (mapping.availabilityStatus === SUPPLIER_PRODUCT_STATUS.INACTIVE) {
    throw new AppError('This supplier product is already inactive.', 409);
  }

  mapping.availabilityStatus = SUPPLIER_PRODUCT_STATUS.INACTIVE;
  mapping.updatedBy = actorId || null;
  await mapping.save();
  await writeAudit({
    actorId,
    ip,
    action: 'DEACTIVATE_SUPPLIER_PRODUCT',
    entityId: mapping._id,
    details: `Removed supplier product mapping ${mapping._id} from active supplier use without deleting product ${mapping.productId?._id || mapping.productId}`,
  });
  const populated = await populateProduct(SupplierProduct.findById(mapping._id));
  return serializeMapping(populated);
};

export const removeSupplierCategoryProduct = async (supplierId, categoryId, mappingId, actorId, ip) => {
  await requireCategoryScopedMapping(supplierId, categoryId, mappingId);
  return removeSupplierProduct(supplierId, mappingId, actorId, ip);
};

export const listNetworkSupplierProducts = async ({ page = 1, limit = 20, search = '', supplierId, categoryId, status = 'all' } = {}) => {
  const match = {};
  if (supplierId && supplierId !== 'all') {
    assertValidId(supplierId, 'supplier');
    match.supplierId = new mongoose.Types.ObjectId(supplierId);
  }
  if (status && status !== 'all') match.availabilityStatus = status;
  const productMatch = {};
  if (categoryId && categoryId !== 'all') {
    assertValidId(categoryId, 'category');
    productMatch['product.categoryId'] = new mongoose.Types.ObjectId(categoryId);
  }
  if (String(search).trim()) {
    const regex = new RegExp(escapeRegex(search), 'i');
    productMatch.$or = [{ 'product.name': regex }, { 'product.sku': regex }];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const pipeline = [
    { $match: match },
    { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $match: productMatch },
    { $lookup: { from: 'suppliers', localField: 'supplierId', foreignField: '_id', as: 'supplier' } },
    { $unwind: '$supplier' },
    { $lookup: { from: 'categories', localField: 'product.categoryId', foreignField: '_id', as: 'category' } },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    { $sort: { createdAt: -1 } },
    { $facet: { rows: [{ $skip: skip }, { $limit: Number(limit) }], meta: [{ $count: 'total' }] } },
  ];
  const [result] = await SupplierProduct.aggregate(pipeline);
  const total = result?.meta?.[0]?.total || 0;
  return {
    products: (result?.rows || []).map((row) => ({
      _id: row._id, supplierId: row.supplierId, productId: row.productId,
      product: { _id: row.product._id, name: row.product.name, sku: row.product.sku || '', imageUrl: row.product.imageUrl || row.product.image || '' },
      supplier: { _id: row.supplier._id, supplierName: row.supplier.supplierName, status: row.supplier.status },
      category: row.category ? { _id: row.category._id, name: row.category.name } : null,
      quantity: Number(row.quantity || 0), currentSupplierPrice: row.currentSupplierPrice,
      minimumOrderQuantity: row.minimumOrderQuantity, availabilityStatus: row.availabilityStatus,
    })),
    total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1,
  };
};

export const getSupplierNetworkDashboard = async () => {
  const [totalSuppliers, activeSuppliers, categoryRows, productRows] = await Promise.all([
    Supplier.countDocuments(), Supplier.countDocuments({ status: SUPPLIER_STATUS.ACTIVE }),
    SupplierCategory.countDocuments(), SupplierProduct.aggregate([{ $group: { _id: null, total: { $sum: 1 }, quantity: { $sum: { $ifNull: ['$quantity', 0] } }, averagePrice: { $avg: '$currentSupplierPrice' }, suppliers: { $addToSet: '$supplierId' } } }]),
  ]);
  const summary = productRows[0] || { total: 0, quantity: 0, averagePrice: null, suppliers: [] };
  return { totalSuppliers, activeSuppliers, totalSupplierCategories: categoryRows, totalSupplierProducts: summary.total, totalSupplierProductQuantity: summary.quantity, averageSupplierPrice: summary.averagePrice, suppliersWithProducts: summary.suppliers.length, suppliersWithoutProducts: Math.max(0, totalSuppliers - summary.suppliers.length) };
};

/**
 * Set/update supplier purchase price and append immutable price history.
 * Does not modify Product.price or customer-facing pricing.
 */
export const setSupplierProductPrice = async (supplierId, mappingId, priceInput, actorId, ip) => {
  const supplier = await requireSupplier(supplierId);
  if (supplier.status !== SUPPLIER_STATUS.ACTIVE) {
    throw new AppError('Cannot set supplier price while the supplier is inactive.', 400);
  }

  const nextPrice = normalizeSupplierPrice(priceInput);
  const supportsTransactions = getTransactionSupport();
  let session = null;

  try {
    if (supportsTransactions) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    const mapping = await requireMapping(supplierId, mappingId, { session });
    if (mapping.availabilityStatus !== SUPPLIER_PRODUCT_STATUS.ACTIVE) {
      throw new AppError('Cannot set supplier price while the product mapping is inactive.', 400);
    }

    const previousPrice = mapping.currentSupplierPrice == null
      ? null
      : Number(mapping.currentSupplierPrice);

    if (pricesEqual(previousPrice, nextPrice)) {
      throw new AppError(`Supplier price is already ${formatCurrency(nextPrice)}.`, 400);
    }

    // Optimistic concurrency: only update if current price still matches what we read.
    const priceFilter = previousPrice == null
      ? {
        $or: [
          { currentSupplierPrice: null },
          { currentSupplierPrice: { $exists: false } },
        ],
      }
      : { currentSupplierPrice: previousPrice };

    const historyPayload = {
      supplierProductId: mapping._id,
      supplierId: mapping.supplierId,
      productId: mapping.productId?._id || mapping.productId,
      price: nextPrice,
      previousPrice,
      changedBy: actorId || null,
      changedAt: new Date(),
    };

    let historyDoc = null;
    if (session) {
      const created = await SupplierProductPriceHistory.create([historyPayload], { session });
      historyDoc = created[0];
    } else {
      historyDoc = await SupplierProductPriceHistory.create(historyPayload);
    }

    let updateQuery = SupplierProduct.findOneAndUpdate(
      { _id: mapping._id, supplierId, ...priceFilter },
      {
        $set: {
          currentSupplierPrice: nextPrice,
          updatedBy: actorId || null,
        },
      },
      { new: true }
    );
    if (session) updateQuery = updateQuery.session(session);
    const updated = await updateQuery;

    if (!updated) {
      if (!session && historyDoc?._id) {
        await SupplierProductPriceHistory.deleteOne({ _id: historyDoc._id });
      }
      throw new AppError('Supplier price was updated by another request. Please refresh and try again.', 409);
    }

    await writeAudit({
      actorId,
      ip,
      action: 'UPDATE_SUPPLIER_PRODUCT_PRICE',
      entityId: mapping._id,
      details: previousPrice == null
        ? `Set supplier purchase price for mapping ${mapping._id} to ${formatCurrency(nextPrice)}`
        : `Changed supplier purchase price for mapping ${mapping._id} from ${formatCurrency(previousPrice)} to ${formatCurrency(nextPrice)}`,
      session,
    });

    if (session) {
      await session.commitTransaction();
      session.endSession();
      session = null;
    }

    const populated = await populateProduct(SupplierProduct.findById(updated._id));
    return serializeMapping(populated);
  } catch (err) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch {
        // ignore abort errors
      }
      session.endSession();
    }
    throw err;
  }
};

export const listSupplierProductPriceHistory = async (
  supplierId,
  mappingId,
  { page = 1, limit = 20 } = {}
) => {
  await requireSupplier(supplierId);
  await requireMapping(supplierId, mappingId);

  const filter = { supplierProductId: mappingId, supplierId };
  const skip = (Number(page) - 1) * Number(limit);
  const [rows, total] = await Promise.all([
    SupplierProductPriceHistory.find(filter)
      .sort({ changedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    SupplierProductPriceHistory.countDocuments(filter),
  ]);

  return {
    history: rows.map(serializePriceHistory),
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)) || 1,
  };
};

const isRankableSupplierPrice = (value) => {
  if (value == null) return false;
  const price = Number(value);
  return Number.isFinite(price) && price > 0;
};

const compareSupplierRows = (a, b) => {
  const aPriced = isRankableSupplierPrice(a.currentSupplierPrice);
  const bPriced = isRankableSupplierPrice(b.currentSupplierPrice);
  if (aPriced && bPriced && !pricesEqual(a.currentSupplierPrice, b.currentSupplierPrice)) {
    return a.currentSupplierPrice - b.currentSupplierPrice;
  }
  if (aPriced !== bPriced) return aPriced ? -1 : 1;
  return String(a.supplierName || '').localeCompare(String(b.supplierName || ''), 'en', { sensitivity: 'base' });
};

/**
 * Read-only procurement decision support. Does not persist a selected supplier.
 */
export const compareSuppliersForProduct = async (productId) => {
  assertValidId(productId, 'product');
  const product = await Product.findById(productId).select('name');
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const mappings = await SupplierProduct.find({ productId })
    .populate({
      path: 'supplierId',
      select: 'supplierName companyName status isDeleted',
    })
    .lean();

  const activeRows = [];
  for (const mapping of mappings) {
    const supplier = mapping.supplierId;
    if (!supplier || supplier.isDeleted) continue;
    if (supplier.status !== SUPPLIER_STATUS.ACTIVE) continue;
    if (mapping.availabilityStatus !== SUPPLIER_PRODUCT_STATUS.ACTIVE) continue;

    const currentSupplierPrice = isRankableSupplierPrice(mapping.currentSupplierPrice)
      ? Math.round(Number(mapping.currentSupplierPrice) * 100) / 100
      : null;

    activeRows.push({
      supplierId: supplier._id,
      supplierName: supplier.supplierName,
      companyName: supplier.companyName,
      mappingId: mapping._id,
      minimumOrderQuantity: mapping.minimumOrderQuantity,
      currentSupplierPrice,
      availabilityStatus: mapping.availabilityStatus,
      isLowestPrice: false,
    });
  }

  const pricedRows = activeRows.filter((row) => isRankableSupplierPrice(row.currentSupplierPrice));
  const lowestPrice = pricedRows.length
    ? Math.min(...pricedRows.map((row) => row.currentSupplierPrice))
    : null;

  const suppliers = activeRows
    .map((row) => ({
      ...row,
      isLowestPrice: lowestPrice != null && pricesEqual(row.currentSupplierPrice, lowestPrice),
    }))
    .sort(compareSupplierRows);

  let emptyReason = null;
  if (mappings.length === 0) emptyReason = 'NO_MAPPINGS';
  else if (activeRows.length === 0) emptyReason = 'NO_ACTIVE_SUPPLIERS';
  else if (pricedRows.length === 0) emptyReason = 'NO_PRICES';

  return {
    product: {
      _id: product._id,
      name: product.name,
    },
    suppliers,
    lowestPrice,
    emptyReason,
  };
};
