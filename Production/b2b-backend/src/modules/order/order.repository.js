import Order from './order.model.js';

export const createOrder = async (data, options = {}) => {
  const [order] = await Order.create([data], options);
  return order;
};

export const findOrders = (filter, options = {}) => {
  let query = Order.find(filter)
    .populate('userId', 'name email mobile companyName businessName')
    .populate('items.productId', 'name price images category')
    .populate({
      path: 'shipmentId',
      populate: { path: 'deliveryPartnerId', select: 'name email mobile' },
    })
    .select('-__v')
    .sort(options.sort || { createdAt: -1 });

  if (options.skip) query = query.skip(options.skip);
  if (options.limit) query = query.limit(options.limit);

  return query.lean();
};

export const countOrders = (filter) => Order.countDocuments(filter);

export const findById = (id) => 
  Order.findById(id)
    .populate('userId', 'name email mobile role')
    .populate('items.productId', 'name price images category stock')
    .populate({
      path: 'shipmentId',
      populate: { path: 'deliveryPartnerId', select: 'name email mobile' },
    })
    .lean();