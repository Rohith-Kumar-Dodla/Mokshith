import Logistics from './logistics.model.js';

export const createShipment = (data) =>
  Logistics.create(data);

export const findByOrder = (orderId) =>
  Logistics.findOne({ orderId });

export const updateShipment = (id, data) =>
  Logistics.findByIdAndUpdate(id, data, { new: true });

export const findById = (id) =>
  Logistics.findById(id)
    .populate({
      path: 'orderId',
      populate: {
        path: 'userId',
        select: 'name email mobile businessName upiId qrImage',
      },
    })
    .populate('warehouseId')
    .populate('deliveryPartnerId', 'name email mobile');

export const findAll = (filter = {}) =>
  Logistics.find(filter)
    .populate({
      path: 'orderId',
      populate: {
        path: 'userId',
        select: 'name email mobile businessName upiId qrImage',
      },
    })
    .populate('warehouseId')
    .populate('deliveryPartnerId', 'name email mobile');

export const findAllActive = () =>
  Logistics.find({ status: { $nin: ['DELIVERED', 'COMPLETED', 'CANCELLED', 'FAILED'] } })
    .populate({
      path: 'orderId',
      populate: {
        path: 'userId',
        select: 'name email mobile businessName upiId qrImage',
      },
    })
    .populate('warehouseId')
    .populate('deliveryPartnerId', 'name email mobile');

export const findAllDelivered = () =>
  Logistics.find({ status: { $in: ['DELIVERED', 'COMPLETED'] } })
    .populate({
      path: 'orderId',
      populate: {
        path: 'userId',
        select: 'name email mobile businessName upiId qrImage',
      },
    })
    .populate('warehouseId')
    .populate('deliveryPartnerId', 'name email mobile');

export const findByPartner = (partnerId, statuses) =>
  Logistics.find({
    deliveryPartnerId: partnerId,
    status: { $in: statuses }
  })
    .populate({
      path: 'orderId',
      populate: {
        path: 'userId',
        select: 'name email mobile businessName upiId qrImage',
      },
    })
    .populate('warehouseId')
    .populate('deliveryPartnerId', 'name email mobile');

export const countByStatus = (filter = {}) =>
  Logistics.aggregate([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

export const countByPartner = (partnerId) =>
  Logistics.countDocuments({ deliveryPartnerId: partnerId, status: 'DELIVERED' });