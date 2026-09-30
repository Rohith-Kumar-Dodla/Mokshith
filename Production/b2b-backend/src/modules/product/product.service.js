import * as repo from './product.repository.js';
import AppError from '../../errors/AppError.js';
import { buildProductFilter } from './product.utils.js';
import { parsePaginationParams, buildPaginationMeta } from '../../utils/pagination.js';
import { transformProductsArray } from '../../utils/cdn.js';
import { CATALOG_SCOPE } from '../../constants/catalogScope.js';
import { assertCustomerCatalogProduct } from './productCatalog.utils.js';
import { validateBulkPricingTiers } from '../../utils/bulkPricing.utils.js';
import Promotion from '../promotion/promotion.model.js';
import { publishSuperAdminEvent } from '../notification/businessNotification.service.js';
import { logAction } from '../audit/audit.service.js';

function serializeProduct(product) {
  if (!product) {
    return product;
  }

  const plain = product?.toObject ? product.toObject() : product;
  return transformProductsArray([plain])[0];
}

async function attachActivePromotions(products) {
  const rows = Array.isArray(products) ? products : [products];
  if (!rows.length) return products;
  const ids = rows.map((item) => item._id);
  const now = new Date();
  const promotions = await Promotion.find({
    isActive: true,
    productIds: { $in: ids },
    $or: [{ startAt: null }, { startAt: { $lte: now } }],
    $and: [{ $or: [{ endAt: null }, { endAt: { $gt: now } }] }, { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }],
  }).select('name message code discountType value maxDiscount promotionKind discountApplication minimumQuantity productIds status startAt endAt expiresAt').lean();
  const byProduct = new Map();
  for (const promotion of promotions) {
    for (const id of promotion.productIds || []) {
      const key = String(id);
      if (!byProduct.has(key)) byProduct.set(key, []);
      byProduct.get(key).push(promotion);
    }
  }
  return rows.map((item) => ({ ...(item?.toObject ? item.toObject() : item), activePromotions: byProduct.get(String(item._id)) || [] }))
    .map((item) => ({ ...item, activePromotions: item.activePromotions.filter((promotion) => effectivePromotionStatus(promotion) === 'ACTIVE') }));
}

function effectivePromotionStatus(promotion, now = new Date()) {
  if (promotion.status === 'PAUSED' || promotion.status === 'DRAFT' || promotion.isActive === false) return 'PAUSED';
  if ((promotion.endAt && new Date(promotion.endAt) <= now) || (promotion.expiresAt && new Date(promotion.expiresAt) <= now)) return 'EXPIRED';
  if (promotion.startAt && new Date(promotion.startAt) > now) return 'SCHEDULED';
  return 'ACTIVE';
}

// 🔥 Simple In-Memory Cache
const productCache = {
  data: null,
  lastFetched: null,
  // Stock is order-sensitive; default catalog reads must not expose stale availability.
  ttl: 0
};

// 🔥 EVENTS
import { onProductCreated } from './product.events.js';
import {
  ensureProductInventory,
  syncProductStockToInventory,
} from '../inventory/inventory.service.js';

function applyBulkPricingValidation(data, basePriceOverride) {
  if (data.bulkPricing === undefined) {
    return data;
  }

  const basePrice = basePriceOverride ?? data.price;
  try {
    data.bulkPricing = validateBulkPricingTiers(data.bulkPricing, basePrice);
  } catch (err) {
    throw new AppError(err.message, 400);
  }
  return data;
}

export const createProduct = async (data) => {
  if (data.price <= 0) {
    throw new AppError('Price must be greater than 0', 400);
  }

  applyBulkPricingValidation(data);

  const product = await repo.createProduct({
    ...data,
    catalogScope: data.catalogScope || CATALOG_SCOPE.CUSTOMER,
  });

  productCache.data = null;

  await ensureProductInventory(product);

  try {
    onProductCreated(product);
  } catch (err) {
    console.error('Product event error:', err.message);
  }

  await publishSuperAdminEvent('PRODUCT_CREATED', { entityType: 'PRODUCT', entityId: product._id, businessKey: 'created', message: `Product “${product.name}” was created.` });

  return serializeProduct(product);
};

export const getProducts = async (query) => {
  // Parse and enforce pagination limits
  const { page, limit, skip } = parsePaginationParams(query);
  const { categoryId, search } = query;

  // 🔥 Caching for default product list
  const isDefaultQuery =
    page === 1 &&
    limit === 20 &&
    !categoryId &&
    !search &&
    !query._refresh;
  if (isDefaultQuery && productCache.data && (Date.now() - productCache.lastFetched < productCache.ttl)) {
    return productCache.data;
  }

  const filter = buildProductFilter({ categoryId, search });

  // Get total count and products in parallel
  const [products, total] = await Promise.all([
    repo.findProducts(filter, { skip, limit }),
    repo.countProducts(filter)
  ]);

  // Transform product images to CDN URLs
  const transformedProducts = transformProductsArray(await attachActivePromotions(products));

  // Build pagination metadata
  const pagination = buildPaginationMeta(page, limit, total);

  const result = {
    products: transformedProducts,
    pagination
  };

  if (isDefaultQuery) {
    productCache.data = result;
    productCache.lastFetched = Date.now();
  }

  return result;
};

export const getProductById = async (id) => {
  const product = await repo.findById(id);

  if (!product) throw new AppError('Product not found', 404);

  assertCustomerCatalogProduct(product);

  const [withPromotion] = await attachActivePromotions([product]);
  return serializeProduct(withPromotion);
};

export const updateProduct = async (id, data) => {
  const product = await repo.findById(id);

  if (!product) throw new AppError('Product not found', 404);

  if (data.bulkPricing !== undefined) {
    const effectivePrice = data.price ?? product.price;
    applyBulkPricingValidation(data, effectivePrice);
  }

  const updatedProduct = await repo.updateProduct(id, data);

  if (!updatedProduct) throw new AppError('Product not found', 404);

  if (data.stock !== undefined) {
    await syncProductStockToInventory(updatedProduct);
  } else {
    await ensureProductInventory(updatedProduct);
  }

  productCache.data = null;

  await publishSuperAdminEvent('PRODUCT_UPDATED', { entityType: 'PRODUCT', entityId: updatedProduct._id, businessKey: String(updatedProduct.updatedAt?.getTime?.() || Date.now()), message: `Product “${updatedProduct.name}” was updated.` });

  return serializeProduct(updatedProduct);
};

export const deleteProduct = async (id, actor = {}) => {
  const product = await repo.findById(id);

  if (!product) throw new AppError('Product not found', 404);

  if (product.isActive === false) {
    throw new AppError('Product is already deactivated', 409);
  }

  // Products are referenced by orders, inventory, supplier mappings, carts,
  // wishlists, reviews, invoices and procurement records. Preserve those
  // references and remove the product only from active catalog use.
  await repo.updateProduct(id, { isActive: false });
  await logAction({
    userId: actor.userId,
    action: 'PRODUCT_DEACTIVATED',
    entity: 'Product',
    entityId: product._id,
    details: `Deactivated product: ${product.name}`,
    data: { actorRole: actor.role },
  }).catch(() => {});

  productCache.data = null;

  return { message: 'Product deactivated successfully to preserve historical records', archived: true };
};

export const updateStock = async (id, stock) => {
  if (stock < 0) {
    throw new AppError('Stock cannot be negative', 400);
  }

  const product = await repo.updateProduct(id, { stock });

  if (!product) throw new AppError('Product not found', 404);

  await syncProductStockToInventory(product);
  productCache.data = null;

  await publishSuperAdminEvent(stock <= (product.lowStockThreshold || 10) ? 'INVENTORY_LOW_STOCK' : 'PRODUCT_STOCK_CHANGED', { entityType: 'PRODUCT', entityId: product._id, businessKey: `stock:${stock}`, message: `Stock for “${product.name}” changed to ${stock}.` });

  return product;
};

export const updateStatus = async (id, isActive) => {
  const product = await repo.updateProduct(id, { isActive });

  if (!product) throw new AppError('Product not found', 404);

  await publishSuperAdminEvent('PRODUCT_STATUS_CHANGED', { entityType: 'PRODUCT', entityId: product._id, businessKey: `active:${isActive}`, status: isActive ? 'ACTIVE' : 'INACTIVE', message: `Product “${product.name}” was ${isActive ? 'activated' : 'deactivated'}.` });

  return product;
};
