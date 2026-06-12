import mongoose from 'mongoose';
import { DELIVERY_STATUS } from '../../constants/deliveryStatus.js';

const logisticsSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },

    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },

    deliveryPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    status: {
      type: String,
      enum: Object.values(DELIVERY_STATUS),
      default: DELIVERY_STATUS.ASSIGNED,
    },

    address: {
      type: String,
      required: true,
    },
    customerName: String,
    phone: String,
    etaMinutes: {
      type: Number,
      default: 0,
    },
    currentLocation: {
      lat: Number,
      lng: Number,
    },

    trackingNumber: {
      type: String,
      unique: true,
    },

    estimatedDelivery: Date,

    deliveredAt: Date,
    completedAt: Date,
    deliveryNotes: String,
    deliveryProofImage: String,
  },
  { timestamps: true }
);

export default mongoose.model('Logistics', logisticsSchema);