import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import HttpStatus from '../constants/httpStatus.js';
import * as vendorService from '../services/vendorService.js';

/**
 * Create vendor profile
 * POST /api/v1/vendors/profile
 */
export const createProfile = asyncHandler(async (req, res) => {
  const result = await vendorService.createVendorProfile(req.user.userId, req.body);

  res.status(HttpStatus.CREATED).json(
    new ApiResponse(
      HttpStatus.CREATED,
      result,
      'Vendor profile created successfully'
    )
  );
});

/**
 * Get vendor profile (own profile)
 * GET /api/v1/vendors/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const vendor = await vendorService.getVendorProfile(req.user.userId);

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      vendor,
      'Vendor profile retrieved successfully'
    )
  );
});

/**
 * Update vendor profile (own profile)
 * PUT /api/v1/vendors/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const vendor = await vendorService.updateVendorProfile(req.user.userId, req.body);

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      vendor,
      'Vendor profile updated successfully'
    )
  );
});

/**
 * Get vendor by ID
 * GET /api/v1/vendors/:id
 */
export const getVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendor = await vendorService.getVendorById(id);

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      vendor,
      'Vendor retrieved successfully'
    )
  );
});

/**
 * Get all vendors (with search, filter, pagination)
 * GET /api/v1/vendors
 */
export const getAllVendors = asyncHandler(async (req, res) => {
  const {
    search,
    status,
    businessName,
    email,
    page = 1,
    limit = 10,
  } = req.query;

  const result = await vendorService.getAllVendors({
    search,
    status,
    businessName,
    email,
    page,
    limit,
  });

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      result,
      'Vendors retrieved successfully'
    )
  );
});

export default {
  createProfile,
  getProfile,
  updateProfile,
  getVendor,
  getAllVendors,
};
