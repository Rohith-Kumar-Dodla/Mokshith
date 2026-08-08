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
  Logistics.findById(id).populate('orderId warehouseId deliveryPartnerId lastRejectedPartnerId');

export const findAll = (filter = {}) =>
  Logistics.find(filter).populate('orderId warehouseId deliveryPartnerId');

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
  }).populate('orderId warehouseId deliveryPartnerId lastRejectedPartnerId');

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