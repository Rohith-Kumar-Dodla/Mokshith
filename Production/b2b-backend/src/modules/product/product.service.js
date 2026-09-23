import * as repo from './product.repository.js';
import AppError from '../../errors/AppError.js';
import { buildProductFilter } from './product.utils.js';
import { parsePaginationParams, buildPaginationMeta } from '../../utils/pagination.js';
import { transformProductsArray } from '../../utils/cdn.js';
import { CATALOG_SCOPE } from '../../constants/catalogScope.js';
import { assertCustomerCatalogProduct } from './productCatalog.utils.js';
import { validateBulkPricingTiers } from '../../utils/bulkPricing.utils.js';

function serializeProduct(product) {
  if (!product) {
    return product;
  }

  const plain = product?.toObject ? product.toObject() : product;
  return transformProductsArray([plain])[0];
}

// 🔥 Simple In-Memory Cache
const productCache = {
  data: null,
  lastFetched: null,
  ttl: 300000 // 5 minutes
};

// 🔥 EVENTS
import { onProductCreated } from './product.events.js';
import {
  ensureProductInventory,
  syncProductStockFromInventory,
  setDefaultWarehouseStock,
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
  await syncProductStockFromInventory(product._id);

  try {
    onProductCreated(product);
  } catch (err) {
    console.error('Product event error:', err.message);
  }

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
  const transformedProducts = transformProductsArray(products);

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

  return serializeProduct(product);
};

export const updateProduct = async (id, data) => {
  const product = await repo.findById(id);

  if (!product) throw new AppError('Product not found', 404);

  const requestedStock = data.stock;
  const productData = { ...data };
  delete productData.stock;

  if (productData.bulkPricing !== undefined) {
    const effectivePrice = productData.price ?? product.price;
    applyBulkPricingValidation(productData, effectivePrice);
  }

  const updatedProduct = await repo.updateProduct(id, productData);

  if (!updatedProduct) throw new AppError('Product not found', 404);

  if (requestedStock !== undefined) {
    await setDefaultWarehouseStock(id, Number(requestedStock));
  } else {
    await ensureProductInventory(updatedProduct);
  }

  await syncProductStockFromInventory(id);

  productCache.data = null;

  const refreshedProduct = await repo.findById(id);
  return serializeProduct(refreshedProduct);
};

export const deleteProduct = async (id) => {
  const product = await repo.findById(id);

  if (!product) throw new AppError('Product not found', 404);

  await repo.deleteProduct(id);

  productCache.data = null;

  return { message: 'Product deleted successfully' };
};

export const updateStock = async (id, stock) => {
  if (stock < 0) {
    throw new AppError('Stock cannot be negative', 400);
  }

  const product = await repo.findById(id);
  if (!product) throw new AppError('Product not found', 404);

  await setDefaultWarehouseStock(id, Number(stock));
  const updatedProduct = await repo.findById(id);
  productCache.data = null;

  return serializeProduct(updatedProduct);
};

export const updateStatus = async (id, isActive) => {
  const product = await repo.updateProduct(id, { isActive });

  if (!product) throw new AppError('Product not found', 404);

  return product;
};
