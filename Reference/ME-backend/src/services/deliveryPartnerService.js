import DeliveryPartner from '../models/DeliveryPartner.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import HttpStatus from '../constants/httpStatus.js';

/**
 * Create delivery partner profile
 * @param {string} userId - User ID
 * @param {object} profileData - Delivery partner profile data
 * @returns {object} Created delivery partner profile
 */
export const createDeliveryPartnerProfile = async (userId, profileData) => {
  // Check if user exists and is a delivery partner
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'User not found');
  }

  if (user.role !== 'delivery') {
    throw new ApiError(HttpStatus.FORBIDDEN, 'Only delivery partners can create delivery partner profiles');
  }

  // Check if delivery partner profile already exists
  const existingProfile = await DeliveryPartner.findOne({ userId });
  if (existingProfile) {
    throw new ApiError(HttpStatus.CONFLICT, 'Delivery partner profile already exists');
  }

  // Create delivery partner profile
  const deliveryPartner = await DeliveryPartner.create({
    userId,
    ...profileData,
    status: 'pending',
  });

  return deliveryPartner;
};

/**
 * Get delivery partner profile by user ID
 * @param {string} userId - User ID
 * @returns {object} Delivery partner profile
 */
export const getDeliveryPartnerProfile = async (userId) => {
  const deliveryPartner = await DeliveryPartner.findOne({ userId }).populate('userId', 'name email phone role status');

  if (!deliveryPartner) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Delivery partner profile not found');
  }

  return deliveryPartner;
};

/**
 * Update delivery partner profile
 * @param {string} userId - User ID
 * @param {object} updateData - Data to update
 * @returns {object} Updated delivery partner profile
 */
export const updateDeliveryPartnerProfile = async (userId, updateData) => {
  const deliveryPartner = await DeliveryPartner.findOne({ userId });

  if (!deliveryPartner) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Delivery partner profile not found');
  }

  // Prevent updating userId and status through profile update
  const { userId: _, status: __, ...allowedUpdates } = updateData;

  Object.assign(deliveryPartner, allowedUpdates);
  await deliveryPartner.save();

  return deliveryPartner;
};

/**
 * Get delivery partner by ID
 * @param {string} deliveryPartnerId - Delivery partner ID
 * @returns {object} Delivery partner profile
 */
export const getDeliveryPartnerById = async (deliveryPartnerId) => {
  const deliveryPartner = await DeliveryPartner.findById(deliveryPartnerId).populate('userId', 'name email phone role status');

  if (!deliveryPartner) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Delivery partner not found');
  }

  return deliveryPartner;
};

/**
 * Get all delivery partners with search, filter, and pagination
 * @param {object} filters - Filter options
 * @returns {object} Delivery partners and pagination info
 */
export const getAllDeliveryPartners = async (filters = {}) => {
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
    .populate('userId', 'name email phone role status')
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
 * Update delivery partner status (approve/reject/suspend)
 * @param {string} deliveryPartnerId - Delivery partner ID
 * @param {string} status - New status
 * @returns {object} Updated delivery partner profile
 */
export const updateDeliveryPartnerStatus = async (deliveryPartnerId, status) => {
  const deliveryPartner = await DeliveryPartner.findById(deliveryPartnerId);

  if (!deliveryPartner) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Delivery partner not found');
  }

  // Validate status transition
  const validStatuses = ['pending', 'active', 'inactive', 'suspended', 'rejected'];
  if (!validStatuses.includes(status)) {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Invalid status');
  }

  deliveryPartner.status = status;
  await deliveryPartner.save();

  // Also update user status
  const user = await User.findById(deliveryPartner.userId);
  if (user) {
    user.status = status;
    await user.save();
  }

  return deliveryPartner;
};

export default {
  createDeliveryPartnerProfile,
  getDeliveryPartnerProfile,
  updateDeliveryPartnerProfile,
  getDeliveryPartnerById,
  getAllDeliveryPartners,
  updateDeliveryPartnerStatus,
};
