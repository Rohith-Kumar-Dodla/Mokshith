import mongoose from 'mongoose';
import { SUPPLIER_PRODUCT_STATUS } from '../../constants/supplierProductStatus.js';

const supplierProductSchema = new mongoose.Schema(
  {
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
    minimumOrderQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    // Supplier purchase / procurement cost only. Does not affect Product.price.
    currentSupplierPrice: {
      type: Number,
      default: null,
      validate: {
        validator(value) {
          if (value == null) return true;
          return typeof value === 'number' && Number.isFinite(value) && value > 0;
        },
        message: 'Supplier price must be greater than 0',
      },
    },
    availabilityStatus: {
      type: String,
      enum: Object.values(SUPPLIER_PRODUCT_STATUS),
      default: SUPPLIER_PRODUCT_STATUS.ACTIVE,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

supplierProductSchema.index({ supplierId: 1, productId: 1 }, { unique: true });

export default mongoose.model('SupplierProduct', supplierProductSchema);
