import mongoose from 'mongoose';
import { SUPPLIER_CATEGORY_STATUS } from '../../constants/supplierCategoryStatus.js';

const supplierCategorySchema = new mongoose.Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(SUPPLIER_CATEGORY_STATUS),
      default: SUPPLIER_CATEGORY_STATUS.ACTIVE,
      index: true,
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

supplierCategorySchema.index({ supplierId: 1, categoryId: 1 }, { unique: true });

export default mongoose.model('SupplierCategory', supplierCategorySchema);
