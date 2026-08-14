import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './product.service.js';
import { successResponse } from '../../utils/responseHandler.js';
import { replaceStoredImage, applyUploadedImage } from '../../utils/imageUpload.utils.js';
import { logger } from '../../config/logger.js';
import AppError from '../../errors/AppError.js';

/**
 * Middleware to load product and attach to req.product
 * Used for ownership checks in permission middleware
 */
export const loadProduct = asyncHandler(async (req, res, next) => {
  const product = await service.getProductById(req.params.id);
  
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  
  req.product = product;
  next();
});

function parseBulkPricingField(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function normalizeProductBody(body = {}) {
  const data = { ...body };

  if (data.price !== undefined && data.price !== '') data.price = Number(data.price);
  if (data.stock !== undefined && data.stock !== '') data.stock = Number(data.stock);
  if (data.moq !== undefined && data.moq !== '') data.moq = Number(data.moq);
  if (data.isActive === 'true') data.isActive = true;
  if (data.isActive === 'false') data.isActive = false;

  if ('bulkPricing' in data) {
    data.bulkPricing = parseBulkPricingField(data.bulkPricing);
  }

  return data;
}

export const createProduct = asyncHandler(async (req, res) => {
  logger.debug('Product creation request', { hasFile: !!req.file, bodyKeys: Object.keys(req.body) });

  let data = normalizeProductBody(req.body);

  if (req.file) {
    data = await applyUploadedImage(data, req.file, 'mokshith/products');
  }

  const product = await service.createProduct(data);
  successResponse(res, product, 'Product created');
});

export const getProducts = asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  const products = await service.getProducts(req.query);
  successResponse(res, products);
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await service.getProductById(req.params.id);
  successResponse(res, product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  logger.debug('Product update request', { id: req.params.id, hasFile: !!req.file });

  const existingProduct = req.product || (await service.getProductById(req.params.id));
  const data = await replaceStoredImage(
    existingProduct,
    normalizeProductBody(req.body),
    req.file,
    'mokshith/products'
  );

  const product = await service.updateProduct(req.params.id, data);
  successResponse(res, product, 'Product updated successfully');
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await service.deleteProduct(req.params.id);
  successResponse(res, null, 'Product deleted successfully');
});

export const updateStock = asyncHandler(async (req, res) => {
  const { stock } = req.body;
  const product = await service.updateStock(req.params.id, stock);
  successResponse(res, product, 'Stock updated successfully');
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const product = await service.updateStatus(req.params.id, isActive);
  successResponse(res, product, 'Product status updated successfully');
});
