import Vendor from '../models/Vendor.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import HttpStatus from '../constants/httpStatus.js';

/**
 * Create vendor profile
 * @param {string} userId - User ID
 * @param {object} profileData - Vendor profile data
 * @returns {object} Created vendor profile
 */
export const createVendorProfile = async (userId, profileData) => {
  // Check if user exists and is a vendor
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'User not found');
  }

  if (user.role !== 'vendor') {
    throw new ApiError(HttpStatus.FORBIDDEN, 'Only vendors can create vendor profiles');
  }

  // Check if vendor profile already exists
  const existingProfile = await Vendor.findOne({ userId });
  if (existingProfile) {
    throw new ApiError(HttpStatus.CONFLICT, 'Vendor profile already exists');
  }

  // Create vendor profile
  const vendor = await Vendor.create({
    userId,
    ...profileData,
    status: 'pending',
  });

  return vendor;
};

/**
 * Get vendor profile by user ID
 * @param {string} userId - User ID
 * @returns {object} Vendor profile
 */
export const getVendorProfile = async (userId) => {
  const vendor = await Vendor.findOne({ userId }).populate('userId', 'name email phone role status');

  if (!vendor) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Vendor profile not found');
  }

  return vendor;
};

/**
 * Update vendor profile
 * @param {string} userId - User ID
 * @param {object} updateData - Data to update
 * @returns {object} Updated vendor profile
 */
export const updateVendorProfile = async (userId, updateData) => {
  const vendor = await Vendor.findOne({ userId });

  if (!vendor) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Vendor profile not found');
  }

  // Prevent updating userId and status through profile update
  const { userId: _, status: __, ...allowedUpdates } = updateData;

  Object.assign(vendor, allowedUpdates);
  await vendor.save();

  return vendor;
};

/**
 * Get vendor by ID
 * @param {string} vendorId - Vendor ID
 * @returns {object} Vendor profile
 */
export const getVendorById = async (vendorId) => {
  const vendor = await Vendor.findById(vendorId).populate('userId', 'name email phone role status');

  if (!vendor) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Vendor not found');
  }

  return vendor;
};

/**
 * Get all vendors with search, filter, and pagination
 * @param {object} filters - Filter options
 * @returns {object} Vendors and pagination info
 */
export const getAllVendors = async (filters = {}) => {
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
    .populate('userId', 'name email phone role status')
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
 * Update vendor status (approve/reject/suspend)
 * @param {string} vendorId - Vendor ID
 * @param {string} status - New status
 * @returns {object} Updated vendor profile
 */
export const updateVendorStatus = async (vendorId, status) => {
  const vendor = await Vendor.findById(vendorId);

  if (!vendor) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Vendor not found');
  }

  // Validate status transition
  const validStatuses = ['pending', 'active', 'inactive', 'suspended', 'rejected'];
  if (!validStatuses.includes(status)) {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid status');
  }

  vendor.status = status;
  await vendor.save();

  // Also update user status
  const user = await User.findById(vendor.userId);
  if (user) {
    user.status = status;
    await user.save();
  }

  return vendor;
};

export default {
  createVendorProfile,
  getVendorProfile,
  updateVendorProfile,
  getVendorById,
  getAllVendors,
  updateVendorStatus,
};
