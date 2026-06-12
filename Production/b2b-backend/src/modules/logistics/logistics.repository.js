import Logistics from './logistics.model.js';

export const createShipment = (data) =>
  Logistics.create(data);

export const findByOrder = (orderId) =>
  Logistics.findOne({ orderId });

export const updateShipment = (id, data) =>
  Logistics.findByIdAndUpdate(id, data, { new: true });

export const findById = (id) =>
  Logistics.findById(id).populate('orderId warehouseId deliveryPartnerId');

export const findAll = (filter = {}) =>
  Logistics.find(filter).populate('orderId warehouseId deliveryPartnerId');

export const findAllActive = () =>
  Logistics.find({ status: { $nin: ['DELIVERED', 'COMPLETED', 'CANCELLED', 'FAILED'] } })
    .populate('orderId warehouseId deliveryPartnerId');

export const findAllDelivered = () =>
  Logistics.find({ status: { $in: ['DELIVERED', 'COMPLETED'] } })
    .populate('orderId warehouseId deliveryPartnerId');

export const findByPartner = (partnerId, statuses) =>
  Logistics.find({
    deliveryPartnerId: partnerId,
    status: { $in: statuses }
  }).populate('orderId warehouseId deliveryPartnerId');

export const countByStatus = (filter = {}) =>
  Logistics.aggregate([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

export const countByPartner = (partnerId) =>
  Logistics.countDocuments({ deliveryPartnerId: partnerId, status: 'DELIVERED' });