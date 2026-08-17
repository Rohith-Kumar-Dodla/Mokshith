import mongoose from 'mongoose';

const supplierProductPriceHistorySchema = new mongoose.Schema(
  {
    supplierProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupplierProduct',
      required: true,
      index: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0.01,
    },
    previousPrice: {
      type: Number,
      default: null,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    changedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

supplierProductPriceHistorySchema.index({ supplierProductId: 1, changedAt: -1 });

export default mongoose.model('SupplierProductPriceHistory', supplierProductPriceHistorySchema);
