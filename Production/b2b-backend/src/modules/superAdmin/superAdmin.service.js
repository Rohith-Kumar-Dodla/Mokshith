import * as repo from './superAdmin.repository.js';
import AppError from '../../errors/AppError.js';
import User from '../user/user.model.js';
import { ROLES } from '../../constants/roles.js';
import { USER_STATUS } from '../../constants/userStatus.js';
import { hashPassword } from '../../utils/hashPassword.js';
import { fetchSetting, updateSetting, getAllSettings } from '../settings/settings.service.js';
import Category from '../category/category.model.js';
import Audit from '../audit/audit.model.js';
import Order from '../order/order.model.js';
import { createCreditAccount } from '../credit/credit.service.js';

export const getAllUsers = async () => {
  return repo.getAllUsers();
};

export const getAdmins = async () => {
  return User.find({ role: ROLES.ADMIN });
};

export const createAdmin = async (data, creatorId, ip) => {
  const { name, email, password, mobile } = data;

  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    throw new AppError('User with this email already exists', 400);
  }

  const existingMobile = await User.findOne({ mobile });
  if (existingMobile) {
    throw new AppError('User with this mobile number already exists', 400);
  }

  const hashedPassword = await hashPassword(password);
  
  const admin = await User.create({
    name,
    email,
    mobile,
    password: hashedPassword,
    role: ROLES.ADMIN,
    status: USER_STATUS.ACTIVE,
    isVerified: true
  });

  // Log action
  await Audit.create({
    userId: creatorId,
    action: 'CREATE_ADMIN',
    entity: 'USER',
    entityId: admin._id,
    details: `Created admin: ${email}`,
    ip,
    severity: 'INFO'
  });

  // Create credit account for admin as well (optional, but consistent)
  try {
    await createCreditAccount(admin._id, 50000);
  } catch (err) {
    console.error('Failed to create credit account for admin:', err.message);
  }

  return admin;
};

export const deleteAdmin = async (id, deleterId, ip) => {
  const user = await User.findById(id);
  if (!user || user.role !== ROLES.ADMIN) {
    throw new AppError('Admin not found', 404);
  }
  
  // 🔥 Use soft delete for consistency
  await User.findByIdAndUpdate(id, { isDeleted: true });
  
  // Log action
  await Audit.create({
    userId: deleterId,
    action: 'DELETE_ADMIN',
    entity: 'USER',
    entityId: id,
    details: `Deleted admin: ${user.email}`,
    ip,
    severity: 'WARNING'
  });

  return { message: 'Admin deleted successfully' };
};

export const updateAdmin = async (id, data, updaterId, ip) => {
  const user = await User.findById(id);
  if (!user || user.role !== ROLES.ADMIN) {
    throw new AppError('Admin not found', 404);
  }

  if (data.password) {
    data.password = await hashPassword(data.password);
  } else {
    delete data.password;
  }

  const updatedAdmin = await User.findByIdAndUpdate(id, data, { new: true });

  // Log action
  await Audit.create({
    userId: updaterId,
    action: 'UPDATE_ADMIN',
    entity: 'USER',
    entityId: id,
    details: `Updated admin: ${user.email}`,
    ip,
    severity: 'INFO'
  });

  return updatedAdmin;
};

export const changeUserRole = async (userId, role) => {
  if (!userId || !role) {
    throw new AppError('UserId and role required', 400);
  }

  const user = await repo.updateUserRole(userId, role);

  if (!user) throw new AppError('User not found', 404);

  return user;
};

export const getSystemStats = async () => {
  return repo.getSystemStats();
};

export const getMetrics = async () => {
  const totalUsers = await User.countDocuments({ isDeleted: { $ne: true } });
  const activeVendors = await User.countDocuments({
    role: { $in: [ROLES.VENDOR, ROLES.B2B_CUSTOMER] },
    status: USER_STATUS.ACTIVE,
    isDeleted: { $ne: true },
  });
  
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  
  const ordersToday = await Order.countDocuments({
    createdAt: { $gte: startOfToday }
  });
  
  const revenueResult = await Order.aggregate([
    { $match: { createdAt: { $gte: startOfToday }, paymentStatus: 'PAID' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);
  const revenueToday = revenueResult[0]?.total || 0;
  
  const pendingApprovals = await User.countDocuments({
    status: USER_STATUS.PENDING,
    isDeleted: { $ne: true }
  });

  return {
    totalUsers,
    activeVendors,
    ordersToday,
    revenueToday,
    pendingApprovals
  };
};

export const getAuditLogs = async (filters = {}) => {
  const query = {};
  
  if (filters.action) query.action = filters.action;
  if (filters.severity) query.severity = filters.severity;
  if (filters.userId) query.userId = filters.userId;
  
  return Audit.find(query)
    .sort({ createdAt: -1 })
    .limit(filters.limit || 100)
    .populate('userId', 'name email');
};

export const exportAuditLogs = async (filters = {}) => {
  const logs = await getAuditLogs({ ...filters, limit: 5000 });
  
  // Create CSV content
  const header = 'Timestamp,User,Email,Role,Action,Entity,Details,IP,Severity\n';
  const rows = logs.map(log => {
    return [
      log.createdAt.toISOString(),
      log.userId?.name || 'System',
      log.userId?.email || 'N/A',
      log.role || 'N/A',
      log.action,
      log.entity,
      `"${(log.details || '').replace(/"/g, '""')}"`,
      log.ip || 'N/A',
      log.severity
    ].join(',');
  }).join('\n');
  
  return header + rows;
};

export const getConfig = async () => {
  const settings = await getAllSettings();
  // Transform array to object for frontend convenience
  return settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});
};

export const updateConfig = async (config, userId, ip) => {
  for (const [key, value] of Object.entries(config)) {
    await updateSetting(key, value);
    
    // Log the change
    await Audit.create({
      userId,
      action: 'UPDATE_CONFIG',
      entity: 'SYSTEM_SETTINGS',
      details: `Updated ${key} to ${JSON.stringify(value)}`,
      data: { key, value },
      ip,
      severity: 'WARNING'
    });
  }
  return getConfig();
};

export const getCategories = async () => {
  return Category.find();
};

export const createCategory = async (data) => {
  return Category.create(data);
};

export const deleteCategory = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new AppError('Category not found', 404);
  }
  await Category.findByIdAndDelete(id);
  return { message: 'Category deleted successfully' };
};

export const updateCategory = async (id, data) => {
  const category = await Category.findByIdAndUpdate(id, data, { new: true });
  if (!category) throw new AppError('Category not found', 404);
  return category;
};