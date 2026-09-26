import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    location: {
      address: { type: String, trim: true },
      city: { type: String, trim: true, index: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      pincode: { type: String, trim: true, index: true },
      coordinates: {
        latitude: { type: Number, min: -90, max: 90 },
        longitude: { type: Number, min: -180, max: 180 },
      },
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDeliveryOrigin: { type: Boolean, default: false, index: true },

    capacity: {
      type: Number,
      required: true,
      default: 1000,
      min: 0,
    },

    currentLoad: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Warehouse', warehouseSchema);
