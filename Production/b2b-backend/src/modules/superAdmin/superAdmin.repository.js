import User from '../user/user.model.js';
import Company from '../company/company.model.js';
import Order from '../order/order.model.js';
import Product from '../product/product.model.js';
import { ROLES } from '../../constants/roles.js';
import { USER_STATUS } from '../../constants/userStatus.js';

export const getAllUsers = () => User.find();

export const updateUserRole = (userId, role) =>
  User.findByIdAndUpdate(userId, { role }, { new: true });

export const getSystemStats = async () => {
  const [
    users,
    companies,
    orders,
    admins,
    vendors,
    deliveryPartners,
    products,
    pendingApprovals,
    revenueResult,
  ] = await Promise.all([
    User.countDocuments({ isDeleted: { $ne: true } }),
    Company.countDocuments(),
    Order.countDocuments(),
    User.countDocuments({ role: ROLES.ADMIN, isDeleted: { $ne: true } }),
    User.countDocuments({
      role: { $in: [ROLES.VENDOR, ROLES.B2B_CUSTOMER] },
      isDeleted: { $ne: true },
    }),
    User.countDocuments({ role: ROLES.DELIVERY_PARTNER, isDeleted: { $ne: true } }),
    Product.countDocuments(),
    User.countDocuments({
      status: USER_STATUS.PENDING,
      role: ROLES.ADMIN,
      isDeleted: { $ne: true },
    }),
    Order.aggregate([
      { $match: { paymentStatus: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
  ]);

  return {
    users,
    companies,
    orders,
    admins,
    vendors,
    deliveryPartners,
    products,
    pendingApprovals,
    revenue: revenueResult[0]?.total || 0,
  };
};