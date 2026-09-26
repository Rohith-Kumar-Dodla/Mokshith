import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    message: { type: String, trim: true, default: '' },
    code: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      required: true,
      index: true,
    },

    discountType: {
      type: String,
      enum: ['PERCENTAGE', 'FLAT'],
      required: true,
    },

    promotionKind: {
      type: String,
      enum: ['SPECIAL', 'BULK'],
      default: 'SPECIAL',
      index: true,
    },

    discountApplication: {
      type: String,
      enum: ['ORDER_FLAT', 'PER_UNIT'],
      default: 'ORDER_FLAT',
    },

    minimumQuantity: {
      type: Number,
      min: 1,
      default: 1,
    },

    value: {
      type: Number,
      required: true,
      min: 0,
    },

    maxDiscount: {
      type: Number,
      default: null, // 🔥 for percentage cap
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product', index: true }],
    status: {
      type: String,
      enum: ['DRAFT', 'SCHEDULED', 'ACTIVE', 'EXPIRED', 'PAUSED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Promotion', promotionSchema);
