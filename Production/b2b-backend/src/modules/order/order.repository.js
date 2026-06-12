import Order from './order.model.js';

export const createOrder = async (data, options = {}) => {
  const [order] = await Order.create([data], options);
  return order;
};

export const findOrders = (filter) =>
  Order.find(filter)
    .populate('userId', 'name email mobile')
    .populate('items.productId', 'name price images category')
    .populate({
      path: 'shipmentId',
      populate: { path: 'deliveryPartnerId', select: 'name email mobile' },
    })
    .select('-__v') // Exclude version key
    .sort({ createdAt: -1 })
    .lean(); // 🔥 Performance: Convert to plain objects

export const findById = (id) => 
  Order.findById(id)
    .populate('userId', 'name email mobile role')
    .populate('items.productId', 'name price images category stock')
    .populate({
      path: 'shipmentId',
      populate: { path: 'deliveryPartnerId', select: 'name email mobile' },
    })
    .lean();