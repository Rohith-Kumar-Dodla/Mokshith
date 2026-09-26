import * as adminRepo from './admin.repository.js';
import NotFoundError from '../../errors/NotFoundError.js';
import { USER_STATUS } from '../../constants/userStatus.js';
import { ROLES } from '../../constants/roles.js';
import User from '../user/user.model.js';
import Order from '../order/order.model.js';
import Logistics from '../logistics/logistics.model.js';
import Inventory from '../inventory/inventory.model.js';
import { DELIVERY_STATUS } from '../../constants/deliveryStatus.js';
import { hashPassword } from '../../utils/hashPassword.js';

export const getAllUsers = async (role) => {
  const query = { isDeleted: { $ne: true } };
  if (role) {
    const normalized = String(role).toUpperCase();
    // Vendor portal users may be stored as VENDOR (registration) or legacy B2B_CUSTOMER
    if (normalized === ROLES.VENDOR || normalized === ROLES.B2B_CUSTOMER) {
      query.role = { $in: [ROLES.VENDOR, ROLES.B2B_CUSTOMER] };
    } else {
      query.role = normalized;
    }
  }
  return User.find(query).sort({ createdAt: -1 }).lean();
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
  const activeDeliveryStatuses = [
    DELIVERY_STATUS.ASSIGNED,
    DELIVERY_STATUS.ACCEPTED,
    DELIVERY_STATUS.PICKED,
    DELIVERY_STATUS.OUT_FOR_DELIVERY,
  ];

  const [
    totalUsers,
    totalOrders,
    totalAdmins,
    totalVendors,
    totalDeliveryPartners,
    pendingApprovals,
    pendingOrders,
    codOrders,
    paidOrders,
    unassignedDeliveries,
    activeDeliveries,
    deliveryRejections,
    lowStock,
  ] = await Promise.all([
    User.countDocuments({ isDeleted: { $ne: true } }),
    Order.countDocuments(),
    User.countDocuments({ role: ROLES.ADMIN, isDeleted: { $ne: true } }),
    User.countDocuments({
      role: { $in: [ROLES.VENDOR, ROLES.B2B_CUSTOMER] },
      isDeleted: { $ne: true },
    }),
    User.countDocuments({ role: ROLES.DELIVERY_PARTNER, isDeleted: { $ne: true } }),
    User.countDocuments({
      status: USER_STATUS.PENDING,
      role: { $ne: ROLES.SUPER_ADMIN },
      isDeleted: { $ne: true },
    }),
    Order.countDocuments({ status: { $in: ['CREATED', 'PENDING', 'PENDING_PAYMENT'] } }),
    Order.countDocuments({ paymentMethod: 'COD' }),
    Order.countDocuments({ paymentStatus: 'PAID' }),
    Logistics.countDocuments({
      status: { $in: [DELIVERY_STATUS.PENDING, DELIVERY_STATUS.REJECTED] },
      $or: [{ deliveryPartnerId: { $exists: false } }, { deliveryPartnerId: null }],
    }),
    Logistics.countDocuments({ status: { $in: activeDeliveryStatuses } }),
    Logistics.countDocuments({ status: DELIVERY_STATUS.REJECTED }),
    Inventory.countDocuments({ $expr: { $lte: ['$stock', '$reorderLevel'] } }),
  ]);

  return {
    totalUsers,
    totalAdmins,
    totalOrders,
    totalVendors,
    totalDeliveryPartners,
    pendingApprovals,
    pendingOrders,
    codOrders,
    paidOrders,
    unassignedDeliveries,
    activeDeliveries,
    deliveryRejections,
    lowStock,
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
