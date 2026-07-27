import AppError from '../../errors/AppError.js';
import * as repo from './user.repository.js';
import { hashPassword } from '../../utils/hashPassword.js';
import User from './user.model.js';
import { syncLegacyAddressFromVendorAddress } from '../../utils/vendorAddress.utils.js';

export const changePassword = async (userId, newPassword) => {
  const user = await repo.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const hashedPassword = await hashPassword(newPassword);
  
  // Directly update through repository to avoid filter restrictions in updateProfile
  await repo.updateUserById(userId, { password: hashedPassword });
};

export const getActiveSessions = async (userId) => {
  const user = await repo.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  return user.activeSessions || [];
};

export const logoutFromAllDevices = async (userId) => {
  const user = await repo.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  // Clear refresh token and all active sessions
  await repo.updateUserById(userId, { 
    refreshToken: null,
    activeSessions: [] 
  });
};

// Allowed update fields (security)
const ALLOWED_PROFILE_FIELDS = [
  'name',
  'email',
  'mobile',
  'profileImage',
  'profileImagePublicId',
  'phone',
  'address',
  'companyName',
  'gstNumber',
  'businessName',
  'businessAddress',
  'ownerName',
  'vendorAddress',
  'upiId',
  'qrImage',
  'qrImagePublicId',
  'vehicleType',
  'vehicleNumber',
  'licenseNumber',
];

export const getProfile = async (userId) => {
  const user = await repo.findById(userId);

  if (!user) throw new AppError('User not found', 404);

  return user;
};

export const updateProfile = async (userId, data) => {
  const filteredData = {};

  // 🔥 Prevent updating restricted fields
  for (const key of ALLOWED_PROFILE_FIELDS) {
    if (data[key] !== undefined) {
      filteredData[key] = data[key];
    }
  }

  if (filteredData.gstNumber) {
    const normalizedGst = filteredData.gstNumber.trim().toUpperCase();
    const existingGst = await User.findOne({
      gstNumber: normalizedGst,
      _id: { $ne: userId },
      isDeleted: { $ne: true },
    });
    if (existingGst) {
      throw new AppError('GST number already registered', 400);
    }
    filteredData.gstNumber = normalizedGst;
  }

  if (filteredData.vendorAddress) {
    const legacyAddress = syncLegacyAddressFromVendorAddress(filteredData.vendorAddress);
    filteredData.businessAddress = legacyAddress;
    filteredData.address = legacyAddress;
  }

  const user = await repo.updateUserById(userId, filteredData);

  if (!user) throw new AppError('User not found', 404);

  return user;
};

// ADMIN
export const getAllUsers = async (query) => {
  const { page = 1, limit = 10, search } = query;

  const skip = (page - 1) * limit;

  let filter = {};

  if (search) {
    // Sanitize search input to prevent ReDoS / regex injection
    const sanitized = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: sanitized, $options: 'i' } },
      { email: { $regex: sanitized, $options: 'i' } },
      { mobile: { $regex: sanitized, $options: 'i' } },
    ];
  }

  const users = await repo.findAll(filter, {
    skip,
    limit: Number(limit),
    sort: { createdAt: -1 },
  });

  const total = await repo.countUsers(filter);

  return {
    users,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
  };
};

export const getUserById = async (id) => {
  const user = await repo.findById(id);

  if (!user) throw new AppError('User not found', 404);

  return user;
};

export const deleteUser = async (id) => {
  const user = await repo.updateUserById(id, {
    isDeleted: true,
  });

  if (!user) throw new AppError('User not found', 404);

  return user;
};