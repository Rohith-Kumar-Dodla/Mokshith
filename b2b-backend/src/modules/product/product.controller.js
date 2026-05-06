import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './product.service.js';
import { successResponse } from '../../utils/responseHandler.js';
import { uploadFile } from '../../services/fileUpload.service.js';

export const createProduct = asyncHandler(async (req, res) => {
  console.log('--- PRODUCT CREATE DEBUG ---');
  console.log('BODY:', req.body);
  console.log('FILE:', req.file);

  const data = { ...req.body };
  
  // 🔥 Normalize types from FormData (multer stringifies everything)
  if (data.price) data.price = Number(data.price);
  if (data.stock) data.stock = Number(data.stock);
  if (data.moq) data.moq = Number(data.moq);
  
  // Handle Boolean normalization
  if (data.isActive === 'true') data.isActive = true;
  if (data.isActive === 'false') data.isActive = false;

  if (req.file) {
    console.log('Processing uploaded file:', req.file.originalname);
    const uploadResult = await uploadFile(req.file);
    console.log('Upload Service Result:', uploadResult);
    data.image = uploadResult.url;
    data.imageUrl = uploadResult.url;
  }

  console.log('FINAL DATABASE PAYLOAD:', data);

  const product = await service.createProduct(data);
  successResponse(res, product, 'Product created');
});

export const getProducts = asyncHandler(async (req, res) => {
  const products = await service.getProducts(req.query);
  successResponse(res, products);
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await service.getProductById(req.params.id);
  successResponse(res, product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  console.log('--- PRODUCT UPDATE DEBUG ---');
  console.log('BODY:', req.body);
  console.log('FILE:', req.file);

  const data = { ...req.body };

  // 🔥 Normalize types from FormData (multer stringifies everything)
  if (data.price) data.price = Number(data.price);
  if (data.stock) data.stock = Number(data.stock);
  if (data.moq) data.moq = Number(data.moq);
  
  // Handle Boolean normalization
  if (data.isActive === 'true') data.isActive = true;
  if (data.isActive === 'false') data.isActive = false;

  // 🔥 CRITICAL FIX: Handle Image Upload
  if (req.file) {
    console.log('Processing uploaded file:', req.file.originalname);
    const uploadResult = await uploadFile(req.file);
    console.log('Upload Service Result:', uploadResult);
    
    // Store the URL in both fields to be safe
    data.image = uploadResult.url;
    data.imageUrl = uploadResult.url;
  } else {
    // If no new file, remove image from update object to avoid overwriting existing data with undefined
    delete data.image;
    delete data.imageUrl;
  }

  console.log('FINAL DATABASE PAYLOAD:', data);

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