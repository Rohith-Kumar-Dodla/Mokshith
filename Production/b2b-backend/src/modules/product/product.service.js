import * as repo from './product.repository.js';
import AppError from '../../errors/AppError.js';
import { buildProductFilter } from './product.utils.js';
import { parsePaginationParams, buildPaginationMeta } from '../../utils/pagination.js';
import { transformProductsArray } from '../../utils/cdn.js';

// 🔥 Simple In-Memory Cache
const productCache = {
  data: null,
  lastFetched: null,
  ttl: 300000 // 5 minutes
};

// 🔥 EVENTS
import { onProductCreated } from './product.events.js';

export const createProduct = async (data) => {
  if (data.price <= 0) {
    throw new AppError('Price must be greater than 0', 400);
  }

  const product = await repo.createProduct(data);
  
  // 🔥 Invalidate Cache
  productCache.data = null;

  // 🔥 EVENT (non-blocking)
  try {
    onProductCreated(product);
  } catch (err) {
    console.error('Product event error:', err.message);
  }

  return product;
};

export const getProducts = async (query) => {
  // Parse and enforce pagination limits
  const { page, limit, skip } = parsePaginationParams(query);
  const { categoryId, search } = query;

  // 🔥 Caching for default product list
  const isDefaultQuery = page === 1 && limit === 20 && !categoryId && !search;
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

  return product;
};

export const updateProduct = async (id, data) => {
  const product = await repo.findById(id);

  if (!product) throw new AppError('Product not found', 404);

  const updatedProduct = await repo.updateProduct(id, data);

  return updatedProduct;
};

export const deleteProduct = async (id) => {
  const product = await repo.findById(id);

  if (!product) throw new AppError('Product not found', 404);

  await repo.deleteProduct(id);

  return { message: 'Product deleted successfully' };
};

export const updateStock = async (id, stock) => {
  if (stock < 0) {
    throw new AppError('Stock cannot be negative', 400);
  }

  const product = await repo.updateProduct(id, { stock });

  if (!product) throw new AppError('Product not found', 404);

  return product;
};

export const updateStatus = async (id, isActive) => {
  const product = await repo.updateProduct(id, { isActive });

  if (!product) throw new AppError('Product not found', 404);

  return product;
};