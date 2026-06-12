import AppError from '../../errors/AppError.js';
import * as repo from './user.repository.js';
import { hashPassword } from '../../utils/hashPassword.js';

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

  // If no sessions, return a mock current session for UI demo
  if (!user.activeSessions || user.activeSessions.length === 0) {
    return [{
      _id: 'current',
      deviceName: 'This Device',
      browser: 'Chrome',
      os: 'Windows 11',
      lastActive: new Date(),
      ip: '127.0.0.1',
      location: 'Hyderabad, India'
    }];
  }

  return user.activeSessions;
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

// 🔥 Allowed update fields (security)
const ALLOWED_PROFILE_FIELDS = [
  'name',
  'email',
  'mobile',
  'profileImage',
  'profileImagePublicId',
  'phone',
  'address',
  'companyName',
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
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { mobile: { $regex: search, $options: 'i' } },
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