import * as repo from './superAdmin.repository.js';
import AppError from '../../errors/AppError.js';
import User from '../user/user.model.js';
import { ROLES } from '../../constants/roles.js';
import { USER_STATUS } from '../../constants/userStatus.js';
import { hashPassword } from '../../utils/hashPassword.js';
import { fetchSetting, updateSetting, getAllSettings } from '../settings/settings.service.js';
import {
  getPlatformSettings,
  updatePlatformSettings,
} from '../platformSettings/platformSettings.service.js';
import Category from '../category/category.model.js';
import Audit from '../audit/audit.model.js';
import Order from '../order/order.model.js';
import { createCreditAccount } from '../credit/credit.service.js';
import { validatePassword } from '../../utils/passwordPolicy.js';
import { sendNotification } from '../notification/notification.service.js';
import { sendEmail } from '../../services/email.service.js';

export const getAllUsers = async () => {
  return repo.getAllUsers();
};

export const getAdmins = async (query = {}) => {
  return listStaffByRole(ROLES.ADMIN, query);
};

const listStaffByRole = async (role, { page = 1, limit = 10, search = '', status = 'all' } = {}) => {
  const filter = { role, isDeleted: { $ne: true } };

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (search) {
    const sanitized = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: sanitized, $options: 'i' } },
      { email: { $regex: sanitized, $options: 'i' } },
      { mobile: { $regex: sanitized, $options: 'i' } },
      { employeeId: { $regex: sanitized, $options: 'i' } },
      { serviceArea: { $regex: sanitized, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  return {
    users,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)) || 1,
  };
};

const ensureUniqueUserFields = async ({ email, mobile, excludeUserId = null }) => {
  const baseQuery = excludeUserId ? { _id: { $ne: excludeUserId } } : {};

  const existingEmail = await User.findOne({ email, ...baseQuery, isDeleted: { $ne: true } });
  if (existingEmail) {
    throw new AppError('User with this email already exists', 400);
  }

  const existingMobile = await User.findOne({ mobile, ...baseQuery, isDeleted: { $ne: true } });
  if (existingMobile) {
    throw new AppError('User with this mobile number already exists', 400);
  }
};

const sendStaffWelcome = async (user, roleLabel) => {
  try {
    await sendNotification({
      userId: user._id,
      title: 'Welcome to Mokshith Enterprises',
      message: `Your ${roleLabel} account has been created. You can sign in using your registered email.`,
      type: 'ACCOUNT',
    });
  } catch (err) {
    console.error('Failed to queue welcome notification:', err.message);
  }

  try {
    await sendEmail({
      to: user.email,
      subject: `Welcome — ${roleLabel} account created`,
      message: `Hello ${user.name},\n\nYour ${roleLabel} account has been created. Please sign in with your registered credentials.`,
    });
  } catch (err) {
    console.error('Failed to send welcome email:', err.message);
  }
};

export const createAdmin = async (data, creatorId, ip) => {
  const { name, email, password, mobile, employeeId, status = USER_STATUS.ACTIVE } = data;

  await ensureUniqueUserFields({ email, mobile });
  validatePassword(password, { name, email, mobile });

  const hashedPassword = await hashPassword(password);

  const admin = await User.create({
    name,
    email,
    mobile,
    phone: mobile,
    password: hashedPassword,
    role: ROLES.ADMIN,
    status,
    employeeId: employeeId || undefined,
    isVerified: true,
    lastPasswordChange: new Date(),
    passwordHistory: [{ hash: hashedPassword, changedAt: new Date() }],
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

  await sendStaffWelcome(admin, 'Admin');

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
    validatePassword(data.password, {
      name: data.name || user.name,
      email: data.email || user.email,
      mobile: data.mobile || user.mobile,
    });
    data.password = await hashPassword(data.password);
  } else {
    delete data.password;
  }

  if (data.email || data.mobile) {
    await ensureUniqueUserFields({
      email: data.email || user.email,
      mobile: data.mobile || user.mobile,
      excludeUserId: id,
    });
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

export const getDeliveryAgents = async (query = {}) => {
  return listStaffByRole(ROLES.DELIVERY_PARTNER, query);
};

export const createDeliveryAgent = async (data, creatorId, ip) => {
  const {
    name,
    email,
    password,
    mobile,
    vehicleType,
    vehicleNumber,
    serviceArea,
    status = USER_STATUS.ACTIVE,
  } = data;

  await ensureUniqueUserFields({ email, mobile });
  validatePassword(password, { name, email, mobile });

  const hashedPassword = await hashPassword(password);

  const agent = await User.create({
    name,
    email,
    mobile,
    phone: mobile,
    password: hashedPassword,
    role: ROLES.DELIVERY_PARTNER,
    status,
    vehicleType,
    vehicleNumber,
    serviceArea,
    isVerified: true,
    lastPasswordChange: new Date(),
    passwordHistory: [{ hash: hashedPassword, changedAt: new Date() }],
  });

  await Audit.create({
    userId: creatorId,
    action: 'CREATE_DELIVERY_AGENT',
    entity: 'USER',
    entityId: agent._id,
    details: `Created delivery agent: ${email}`,
    ip,
    severity: 'INFO',
  });

  await sendStaffWelcome(agent, 'Delivery Agent');

  return agent;
};

export const updateDeliveryAgent = async (id, data, updaterId, ip) => {
  const user = await User.findById(id);
  if (!user || user.role !== ROLES.DELIVERY_PARTNER) {
    throw new AppError('Delivery agent not found', 404);
  }

  if (data.password) {
    validatePassword(data.password, {
      name: data.name || user.name,
      email: data.email || user.email,
      mobile: data.mobile || user.mobile,
    });
    data.password = await hashPassword(data.password);
  } else {
    delete data.password;
  }

  if (data.email || data.mobile) {
    await ensureUniqueUserFields({
      email: data.email || user.email,
      mobile: data.mobile || user.mobile,
      excludeUserId: id,
    });
  }

  const updatedAgent = await User.findByIdAndUpdate(id, data, { new: true });

  await Audit.create({
    userId: updaterId,
    action: 'UPDATE_DELIVERY_AGENT',
    entity: 'USER',
    entityId: id,
    details: `Updated delivery agent: ${user.email}`,
    ip,
    severity: 'INFO',
  });

  return updatedAgent;
};

export const deleteDeliveryAgent = async (id, deleterId, ip) => {
  const user = await User.findById(id);
  if (!user || user.role !== ROLES.DELIVERY_PARTNER) {
    throw new AppError('Delivery agent not found', 404);
  }

  await User.findByIdAndUpdate(id, { isDeleted: true });

  await Audit.create({
    userId: deleterId,
    action: 'DELETE_DELIVERY_AGENT',
    entity: 'USER',
    entityId: id,
    details: `Deleted delivery agent: ${user.email}`,
    ip,
    severity: 'WARNING',
  });

  return { message: 'Delivery agent deleted successfully' };
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
    role: ROLES.VENDOR, 
    status: USER_STATUS.ACTIVE,
    isDeleted: { $ne: true }
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
  const platform = await getPlatformSettings();
  const config = settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});

  return {
    ...config,
    maintenanceMode: platform.maintenanceMode,
    maintenanceMessage: platform.maintenanceMessage,
    supportPhone: platform.supportPhone,
    supportEmail: platform.supportEmail,
    platformUpdatedAt: platform.updatedAt,
    platformUpdatedBy: platform.updatedBy,
  };
};

export const updateConfig = async (config, userId, ip) => {
  const platformUpdates = {};

  if (typeof config.maintenanceMode === 'boolean') {
    platformUpdates.maintenanceMode = config.maintenanceMode;
  }
  if (typeof config.maintenanceMessage === 'string') {
    platformUpdates.maintenanceMessage = config.maintenanceMessage;
  }
  if (typeof config.supportPhone === 'string') {
    platformUpdates.supportPhone = config.supportPhone;
  }
  if (typeof config.supportEmail === 'string') {
    platformUpdates.supportEmail = config.supportEmail;
  }

  if (Object.keys(platformUpdates).length > 0) {
    await updatePlatformSettings(platformUpdates, userId);
    await Audit.create({
      userId,
      action: 'UPDATE_PLATFORM_SETTINGS',
      entity: 'PLATFORM_SETTINGS',
      details: `Updated platform settings: ${JSON.stringify(platformUpdates)}`,
      data: platformUpdates,
      ip,
      severity: 'WARNING',
    });
  }

  for (const [key, value] of Object.entries(config)) {
    if (
      key === 'maintenanceMode' ||
      key === 'maintenanceMessage' ||
      key === 'supportPhone' ||
      key === 'supportEmail'
    ) {
      continue;
    }

    await updateSetting(key, value);
    
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