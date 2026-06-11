import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import HttpStatus from '../constants/httpStatus.js';
import * as adminUserService from '../services/adminUserService.js';

/**
 * Get all vendors for admin
 * GET /api/v1/admin/users/vendors
 */
export const getVendors = asyncHandler(async (req, res) => {
  const {
    search,
    status,
    businessName,
    email,
    page = 1,
    limit = 10,
  } = req.query;

  const result = await adminUserService.getAllVendorsForAdmin({
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

/**
 * Get all delivery partners for admin
 * GET /api/v1/admin/users/delivery-partners
 */
export const getDeliveryPartners = asyncHandler(async (req, res) => {
  const {
    search,
    status,
    fullName,
    email,
    page = 1,
    limit = 10,
  } = req.query;

  const result = await adminUserService.getAllDeliveryPartnersForAdmin({
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

/**
 * Get pending vendors for admin approval
 * GET /api/v1/admin/users/pending-vendors
 */
export const getPendingVendors = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const result = await adminUserService.getPendingVendors({
    page,
    limit,
  });

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      result,
      'Pending vendors retrieved successfully'
    )
  );
});

/**
 * Get pending delivery partners for admin approval
 * GET /api/v1/admin/users/pending-deliveries
 */
export const getPendingDeliveryPartners = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const result = await adminUserService.getPendingDeliveryPartners({
    page,
    limit,
  });

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      result,
      'Pending delivery partners retrieved successfully'
    )
  );
});

/**
 * Approve vendor
 * PUT /api/v1/admin/users/vendors/:id/approve
 */
export const approveVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendor = await adminUserService.approveVendor(id);

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      vendor,
      'Vendor approved successfully'
    )
  );
});

/**
 * Reject vendor
 * PUT /api/v1/admin/users/vendors/:id/reject
 */
export const rejectVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendor = await adminUserService.rejectVendor(id);

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      vendor,
      'Vendor rejected successfully'
    )
  );
});

/**
 * Suspend vendor
 * PUT /api/v1/admin/users/vendors/:id/suspend
 */
export const suspendVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendor = await adminUserService.suspendVendor(id);

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      vendor,
      'Vendor suspended successfully'
    )
  );
});

/**
 * Approve delivery partner
 * PUT /api/v1/admin/users/delivery/:id/approve
 */
export const approveDeliveryPartner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deliveryPartner = await adminUserService.approveDeliveryPartner(id);

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      deliveryPartner,
      'Delivery partner approved successfully'
    )
  );
});

/**
 * Reject delivery partner
 * PUT /api/v1/admin/users/delivery/:id/reject
 */
export const rejectDeliveryPartner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deliveryPartner = await adminUserService.rejectDeliveryPartner(id);

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      deliveryPartner,
      'Delivery partner rejected successfully'
    )
  );
});

/**
 * Suspend delivery partner
 * PUT /api/v1/admin/users/delivery/:id/suspend
 */
export const suspendDeliveryPartner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deliveryPartner = await adminUserService.suspendDeliveryPartner(id);

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      deliveryPartner,
      'Delivery partner suspended successfully'
    )
  );
});

/**
 * Get user statistics
 * GET /api/v1/admin/users/statistics
 */
export const getStatistics = asyncHandler(async (req, res) => {
  const statistics = await adminUserService.getUserStatistics();

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      statistics,
      'User statistics retrieved successfully'
    )
  );
});

export default {
  getVendors,
  getDeliveryPartners,
  getPendingVendors,
  getPendingDeliveryPartners,
  approveVendor,
  rejectVendor,
  suspendVendor,
  approveDeliveryPartner,
  rejectDeliveryPartner,
  suspendDeliveryPartner,
  getStatistics,
};
