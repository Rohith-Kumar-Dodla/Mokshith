import * as adminRepo from './admin.repository.js';
import NotFoundError from '../../errors/NotFoundError.js';
import { USER_STATUS } from '../../constants/userStatus.js';
import { ROLES } from '../../constants/roles.js';
import User from '../user/user.model.js';
import Order from '../order/order.model.js';
import { hashPassword } from '../../utils/hashPassword.js';

export const getAllUsers = async (role) => {
  const query = { isDeleted: { $ne: true } };
  if (role) query.role = role;
  return User.find(query).sort({ createdAt: -1 });
};

export const createB2BCustomer = async (data) => {
  const hashedPassword = await hashPassword(data.password);
  const user = await User.create({
    ...data,
    password: hashedPassword,
    role: ROLES.B2B_CUSTOMER,
    status: USER_STATUS.ACTIVE,
    availableCredit: data.creditLimit || 50000,
    isVerified: true
  });
  return user;
};

export const createDeliveryPartner = async (data) => {
  const hashedPassword = await hashPassword(data.password);
  const user = await User.create({
    ...data,
    password: hashedPassword,
    role: ROLES.DELIVERY_PARTNER,
    status: USER_STATUS.ACTIVE,
    isVerified: true
  });
  return user;
};

const mapPendingUser = (user) => ({
  id: user._id,
  name: user.name || 'Unknown',
  email: user.email || 'N/A',
  mobile: user.mobile || 'N/A',
  role: user.role || 'N/A',
  status: user.status,
  createdAt: user.createdAt || new Date(),
});

export const getPendingUsers = async () => {
  const users = await User.find({
    status: USER_STATUS.PENDING,
    role: { $ne: ROLES.SUPER_ADMIN },
    isDeleted: { $ne: true },
  }).sort({ createdAt: -1 });

  return users.map((user) => ({
    ...mapPendingUser(user),
    type: 'REGISTRATION',
    title: `${user.name || 'Unknown'} (${user.role || 'User'})`,
    addresses: user.addresses || [],
    creditLimit: user.creditLimit || 0,
    availableCredit: user.availableCredit || 0,
  }));
};

export const getPendingAdmins = async () => {
  const users = await User.find({
    status: USER_STATUS.PENDING,
    role: ROLES.ADMIN,
    isDeleted: { $ne: true },
  }).sort({ createdAt: -1 });

  return users.map(mapPendingUser);
};

export const getAdminApprovals = async () => {
  const users = await User.find({
    role: ROLES.ADMIN,
    isDeleted: { $ne: true },
  }).sort({ createdAt: -1 });

  return users.map(mapPendingUser);
};

export const changeUserStatus = async (userId, status) => {
  const user = await adminRepo.updateUserStatus(userId, status);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
};

export const getStats = async () => {
  const totalUsers = await User.countDocuments({ isDeleted: { $ne: true } });
  const totalOrders = await Order.countDocuments();
  const totalAdmins = await User.countDocuments({ role: ROLES.ADMIN, isDeleted: { $ne: true } });
  const totalVendors = await User.countDocuments({ role: ROLES.B2B_CUSTOMER, isDeleted: { $ne: true } });
  const totalDeliveryPartners = await User.countDocuments({ role: ROLES.DELIVERY_PARTNER, isDeleted: { $ne: true } });
  const pendingApprovals = await User.countDocuments({
    status: USER_STATUS.PENDING,
    role: { $ne: ROLES.SUPER_ADMIN },
    isDeleted: { $ne: true },
  });

  return {
    totalUsers,
    totalAdmins,
    totalOrders,
    totalVendors,
    totalDeliveryPartners,
    pendingApprovals,
    // revenue intentionally omitted for Admins; financials are Super Admin-only
  };
};

export const updateUserCredit = async (userId, creditLimit) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Calculate the difference to adjust available credit
  const diff = creditLimit - user.creditLimit;
  user.creditLimit = creditLimit;
  user.availableCredit = (user.availableCredit || 0) + diff;

  await user.save();

  return user;
};