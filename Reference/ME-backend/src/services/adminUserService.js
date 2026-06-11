import Vendor from '../models/Vendor.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import HttpStatus from '../constants/httpStatus.js';

/**
 * Get all vendors for admin (with filters and pagination)
 * @param {object} filters - Filter options
 * @returns {object} Vendors and pagination info
 */
export const getAllVendorsForAdmin = async (filters = {}) => {
  const {
    search,
    status,
    businessName,
    email,
    page = 1,
    limit = 10,
  } = filters;

  // Build query
  const query = {};

  // Search by name, business name, or email
  if (search) {
    query.$or = [
      { ownerName: { $regex: search, $options: 'i' } },
      { businessName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by business name
  if (businessName) {
    query.businessName = { $regex: businessName, $options: 'i' };
  }

  // Filter by email
  if (email) {
    query.email = { $regex: email, $options: 'i' };
  }

  // Pagination
  const skip = (page - 1) * limit;
  const totalRecords = await Vendor.countDocuments(query);
  const totalPages = Math.ceil(totalRecords / limit);

  const vendors = await Vendor.find(query)
    .populate('userId', 'name email phone role status isVerified lastLogin')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    vendors,
    pagination: {
      totalRecords,
      currentPage: parseInt(page),
      totalPages,
      currentLimit: parseInt(limit),
    },
  };
};

/**
 * Get all delivery partners for admin (with filters and pagination)
 * @param {object} filters - Filter options
 * @returns {object} Delivery partners and pagination info
 */
export const getAllDeliveryPartnersForAdmin = async (filters = {}) => {
  const {
    search,
    status,
    fullName,
    email,
    page = 1,
    limit = 10,
  } = filters;

  // Build query
  const query = {};

  // Search by name or email
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by full name
  if (fullName) {
    query.fullName = { $regex: fullName, $options: 'i' };
  }

  // Filter by email
  if (email) {
    query.email = { $regex: email, $options: 'i' };
  }

  // Pagination
  const skip = (page - 1) * limit;
  const totalRecords = await DeliveryPartner.countDocuments(query);
  const totalPages = Math.ceil(totalRecords / limit);

  const deliveryPartners = await DeliveryPartner.find(query)
    .populate('userId', 'name email phone role status isVerified lastLogin')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    deliveryPartners,
    pagination: {
      totalRecords,
      currentPage: parseInt(page),
      totalPages,
      currentLimit: parseInt(limit),
    },
  };
};

/**
 * Get pending vendors for admin approval
 * @param {object} filters - Filter options
 * @returns {object} Pending vendors and pagination info
 */
export const getPendingVendors = async (filters = {}) => {
  const { page = 1, limit = 10 } = filters;

  const query = { status: 'pending' };

  const skip = (page - 1) * limit;
  const totalRecords = await Vendor.countDocuments(query);
  const totalPages = Math.ceil(totalRecords / limit);

  const vendors = await Vendor.find(query)
    .populate('userId', 'name email phone role status isVerified lastLogin')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    vendors,
    pagination: {
      totalRecords,
      currentPage: parseInt(page),
      totalPages,
      currentLimit: parseInt(limit),
    },
  };
};

/**
 * Get pending delivery partners for admin approval
 * @param {object} filters - Filter options
 * @returns {object} Pending delivery partners and pagination info
 */
export const getPendingDeliveryPartners = async (filters = {}) => {
  const { page = 1, limit = 10 } = filters;

  const query = { status: 'pending' };

  const skip = (page - 1) * limit;
  const totalRecords = await DeliveryPartner.countDocuments(query);
  const totalPages = Math.ceil(totalRecords / limit);

  const deliveryPartners = await DeliveryPartner.find(query)
    .populate('userId', 'name email phone role status isVerified lastLogin')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    deliveryPartners,
    pagination: {
      totalRecords,
      currentPage: parseInt(page),
      totalPages,
      currentLimit: parseInt(limit),
    },
  };
};

/**
 * Approve vendor
 * @param {string} vendorId - Vendor ID
 * @returns {object} Updated vendor profile
 */
export const approveVendor = async (vendorId) => {
  const vendor = await Vendor.findById(vendorId);

  if (!vendor) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Vendor not found');
  }

  if (vendor.status !== 'pending') {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Only pending vendors can be approved');
  }

  vendor.status = 'active';
  await vendor.save();

  // Also update user status
  const user = await User.findById(vendor.userId);
  if (user) {
    user.status = 'active';
    user.isVerified = true;
    await user.save();
  }

  return vendor;
};

/**
 * Reject vendor
 * @param {string} vendorId - Vendor ID
 * @returns {object} Updated vendor profile
 */
export const rejectVendor = async (vendorId) => {
  const vendor = await Vendor.findById(vendorId);

  if (!vendor) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Vendor not found');
  }

  if (vendor.status !== 'pending') {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Only pending vendors can be rejected');
  }

  vendor.status = 'rejected';
  await vendor.save();

  // Also update user status
  const user = await User.findById(vendor.userId);
  if (user) {
    user.status = 'rejected';
    await user.save();
  }

  return vendor;
};

/**
 * Suspend vendor
 * @param {string} vendorId - Vendor ID
 * @returns {object} Updated vendor profile
 */
export const suspendVendor = async (vendorId) => {
  const vendor = await Vendor.findById(vendorId);

  if (!vendor) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Vendor not found');
  }

  if (vendor.status !== 'active') {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Only active vendors can be suspended');
  }

  vendor.status = 'suspended';
  await vendor.save();

  // Also update user status
  const user = await User.findById(vendor.userId);
  if (user) {
    user.status = 'suspended';
    await user.save();
  }

  return vendor;
};

/**
 * Approve delivery partner
 * @param {string} deliveryPartnerId - Delivery partner ID
 * @returns {object} Updated delivery partner profile
 */
export const approveDeliveryPartner = async (deliveryPartnerId) => {
  const deliveryPartner = await DeliveryPartner.findById(deliveryPartnerId);

  if (!deliveryPartner) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Delivery partner not found');
  }

  if (deliveryPartner.status !== 'pending') {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Only pending delivery partners can be approved');
  }

  deliveryPartner.status = 'active';
  await deliveryPartner.save();

  // Also update user status
  const user = await User.findById(deliveryPartner.userId);
  if (user) {
    user.status = 'active';
    user.isVerified = true;
    await user.save();
  }

  return deliveryPartner;
};

/**
 * Reject delivery partner
 * @param {string} deliveryPartnerId - Delivery partner ID
 * @returns {object} Updated delivery partner profile
 */
export const rejectDeliveryPartner = async (deliveryPartnerId) => {
  const deliveryPartner = await DeliveryPartner.findById(deliveryPartnerId);

  if (!deliveryPartner) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Delivery partner not found');
  }

  if (deliveryPartner.status !== 'pending') {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Only pending delivery partners can be rejected');
  }

  deliveryPartner.status = 'rejected';
  await deliveryPartner.save();

  // Also update user status
  const user = await User.findById(deliveryPartner.userId);
  if (user) {
    user.status = 'rejected';
    await user.save();
  }

  return deliveryPartner;
};

/**
 * Suspend delivery partner
 * @param {string} deliveryPartnerId - Delivery partner ID
 * @returns {object} Updated delivery partner profile
 */
export const suspendDeliveryPartner = async (deliveryPartnerId) => {
  const deliveryPartner = await DeliveryPartner.findById(deliveryPartnerId);

  if (!deliveryPartner) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Delivery partner not found');
  }

  if (deliveryPartner.status !== 'active') {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Only active delivery partners can be suspended');
  }

  deliveryPartner.status = 'suspended';
  await deliveryPartner.save();

  // Also update user status
  const user = await User.findById(deliveryPartner.userId);
  if (user) {
    user.status = 'suspended';
    await user.save();
  }

  return deliveryPartner;
};

/**
 * Get user statistics for admin/superadmin
 * @returns {object} User statistics
 */
export const getUserStatistics = async () => {
  const totalVendors = await Vendor.countDocuments();
  const totalDeliveryPartners = await DeliveryPartner.countDocuments();
  const pendingVendors = await Vendor.countDocuments({ status: 'pending' });
  const pendingDeliveryPartners = await DeliveryPartner.countDocuments({ status: 'pending' });
  const activeVendors = await Vendor.countDocuments({ status: 'active' });
  const activeDeliveryPartners = await DeliveryPartner.countDocuments({ status: 'active' });
  const suspendedVendors = await Vendor.countDocuments({ status: 'suspended' });
  const suspendedDeliveryPartners = await DeliveryPartner.countDocuments({ status: 'suspended' });
  const rejectedVendors = await Vendor.countDocuments({ status: 'rejected' });
  const rejectedDeliveryPartners = await DeliveryPartner.countDocuments({ status: 'rejected' });

  return {
    vendors: {
      total: totalVendors,
      pending: pendingVendors,
      active: activeVendors,
      suspended: suspendedVendors,
      rejected: rejectedVendors,
    },
    deliveryPartners: {
      total: totalDeliveryPartners,
      pending: pendingDeliveryPartners,
      active: activeDeliveryPartners,
      suspended: suspendedDeliveryPartners,
      rejected: rejectedDeliveryPartners,
    },
  };
};

export default {
  getAllVendorsForAdmin,
  getAllDeliveryPartnersForAdmin,
  getPendingVendors,
  getPendingDeliveryPartners,
  approveVendor,
  rejectVendor,
  suspendVendor,
  approveDeliveryPartner,
  rejectDeliveryPartner,
  suspendDeliveryPartner,
  getUserStatistics,
};
