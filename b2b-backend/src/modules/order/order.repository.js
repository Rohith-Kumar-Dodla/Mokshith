import Order from './order.model.js';

export const createOrder = async (data, options = {}) => {
  const [order] = await Order.create([data], options);
  return order;
};

export const findOrders = (filter) =>
  Order.find(filter)
    .populate('userId', 'name email mobile')
    .select('-__v') // Exclude version key
    .sort({ createdAt: -1 })
    .lean(); // 🔥 Performance: Convert to plain objects

export const findById = (id) => Order.findById(id);