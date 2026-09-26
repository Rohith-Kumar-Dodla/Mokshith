import Logistics from './logistics.model.js';
import { DELIVERY_STATUS } from '../../constants/deliveryStatus.js';

export const createShipment = (data) =>
  Logistics.create(data);

export const findByOrder = (orderId) =>
  Logistics.findOne({ orderId });

export const updateShipment = (id, data) =>
  Logistics.findByIdAndUpdate(id, data, { new: true });

/**
 * Conditional atomic update for race-safe transitions (ownership + status).
 */
export const updateShipmentIf = (filter, data) =>
  Logistics.findOneAndUpdate(filter, data, { new: true });

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
    .populate('deliveryPartnerId', 'name email mobile')
    .populate('lastRejectedPartnerId', 'name email mobile')
    .populate('currentOfferId');

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
    .populate('deliveryPartnerId', 'name email mobile')
    .populate('currentOfferId');

export const findAllActive = () =>
  Logistics.find({
    status: {
      $nin: [
        DELIVERY_STATUS.DELIVERED,
        DELIVERY_STATUS.COMPLETED,
        DELIVERY_STATUS.CANCELLED,
        DELIVERY_STATUS.FAILED,
      ],
    },
  })
    .populate({
      path: 'orderId',
      populate: {
        path: 'userId',
        select: 'name email mobile businessName upiId qrImage',
      },
    })
    .populate('warehouseId')
    .populate('deliveryPartnerId', 'name email mobile')
    .populate('lastRejectedPartnerId', 'name email mobile')
    .populate('currentOfferId');

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
    .populate('deliveryPartnerId', 'name email mobile')
    .populate('currentOfferId');

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
    .populate('deliveryPartnerId', 'name email mobile')
    .populate('currentOfferId');

const historyPopulate = (query) => query
  .populate({
    path: 'orderId',
    populate: {
      path: 'userId',
      select: 'name email mobile businessName upiId qrImage',
    },
  })
  .populate('warehouseId')
  .populate('deliveryPartnerId', 'name email mobile')
  .populate('lastRejectedPartnerId', 'name email mobile')
  .populate('currentOfferId');

export const findHistoryPage = async (filter, { skip = 0, limit = 50 } = {}) => {
  const [items, total] = await Promise.all([
    historyPopulate(Logistics.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit)),
    Logistics.countDocuments(filter),
  ]);
  return { items, total };
};

export const countByStatus = (filter = {}) =>
  Logistics.aggregate([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

export const countByPartner = (partnerId) =>
  Logistics.countDocuments({ deliveryPartnerId: partnerId, status: 'DELIVERED' });
