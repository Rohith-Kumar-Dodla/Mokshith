import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import HttpStatus from '../constants/httpStatus.js';
import * as deliveryPartnerService from '../services/deliveryPartnerService.js';

/**
 * Create delivery partner profile
 * POST /api/v1/delivery-partners/profile
 */
export const createProfile = asyncHandler(async (req, res) => {
  const result = await deliveryPartnerService.createDeliveryPartnerProfile(req.user.userId, req.body);

  res.status(HttpStatus.CREATED).json(
    new ApiResponse(
      HttpStatus.CREATED,
      result,
      'Delivery partner profile created successfully'
    )
  );
});

/**
 * Get delivery partner profile (own profile)
 * GET /api/v1/delivery-partners/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const deliveryPartner = await deliveryPartnerService.getDeliveryPartnerProfile(req.user.userId);

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      deliveryPartner,
      'Delivery partner profile retrieved successfully'
    )
  );
});

/**
 * Update delivery partner profile (own profile)
 * PUT /api/v1/delivery-partners/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const deliveryPartner = await deliveryPartnerService.updateDeliveryPartnerProfile(req.user.userId, req.body);

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      deliveryPartner,
      'Delivery partner profile updated successfully'
    )
  );
});

/**
 * Get delivery partner by ID
 * GET /api/v1/delivery-partners/:id
 */
export const getDeliveryPartner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deliveryPartner = await deliveryPartnerService.getDeliveryPartnerById(id);

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      deliveryPartner,
      'Delivery partner retrieved successfully'
    )
  );
});

/**
 * Get all delivery partners (with search, filter, pagination)
 * GET /api/v1/delivery-partners
 */
export const getAllDeliveryPartners = asyncHandler(async (req, res) => {
  const {
    search,
    status,
    fullName,
    email,
    page = 1,
    limit = 10,
  } = req.query;

  const result = await deliveryPartnerService.getAllDeliveryPartners({
    search,
    status,
    fullName,
    email,
    page,
    limit,
  });

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      result,
      'Delivery partners retrieved successfully'
    )
  );
});

export default {
  createProfile,
  getProfile,
  updateProfile,
  getDeliveryPartner,
  getAllDeliveryPartners,
};
