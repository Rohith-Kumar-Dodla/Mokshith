import mongoose from 'mongoose';
import { DELIVERY_OFFER_STATUS } from '../../constants/deliveryOfferStatus.js';

const locationSnapshotSchema = new mongoose.Schema(
  {
    latitude: Number,
    longitude: Number,
    label: String,
  },
  { _id: false }
);

const deliveryOfferSchema = new mongoose.Schema(
  {
    logisticsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Logistics',
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    deliveryPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    attemptNumber: { type: Number, required: true, min: 1 },
    version: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: Object.values(DELIVERY_OFFER_STATUS),
      default: DELIVERY_OFFER_STATUS.OFFERED,
      index: true,
    },
    deliveryAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', immutable: true },
    distance: { type: Number, required: true, min: 0 },
    distanceUnit: { type: String, enum: ['KM'], default: 'KM', immutable: true },
    origin: { type: locationSnapshotSchema, required: true, immutable: true },
    destination: { type: locationSnapshotSchema, required: true, immutable: true },
    pickupWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', default: null, immutable: true },
    pickupWarehouseName: { type: String, default: '', immutable: true },
    pickupAddress: { type: String, default: '', immutable: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    expiresAt: { type: Date, required: true, index: true },
    respondedAt: Date,
    acceptedAt: Date,
    rejectedAt: Date,
    rejectionReason: { type: String, trim: true, maxlength: 500, default: null },
    rejectionCode: { type: String, trim: true, default: null },
    idempotencyKey: { type: String, unique: true, sparse: true, index: true },
    lastActionRequestId: { type: String, default: null },
  },
  { timestamps: true }
);

deliveryOfferSchema.index({ logisticsId: 1, version: 1 }, { unique: true });
deliveryOfferSchema.index({ deliveryPartnerId: 1, status: 1, expiresAt: 1 });

export default mongoose.model('DeliveryOffer', deliveryOfferSchema);
