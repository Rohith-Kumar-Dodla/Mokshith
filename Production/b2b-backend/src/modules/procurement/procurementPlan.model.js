import mongoose from 'mongoose';
import { PROCUREMENT_PLAN_STATUS } from '../../constants/procurementPlanStatus.js';

const procurementPlanItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productNameSnapshot: {
      type: String,
      trim: true,
      default: '',
    },
    requiredQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    supplierProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupplierProduct',
      default: null,
    },
    supplierNameSnapshot: {
      type: String,
      trim: true,
      default: '',
    },
    plannedQuantity: {
      type: Number,
      default: null,
    },
    supplierPriceSnapshot: {
      type: Number,
      default: null,
    },
    supplierMoqSnapshot: {
      type: Number,
      default: null,
    },
    estimatedCost: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const procurementPlanSchema = new mongoose.Schema(
  {
    procurementDate: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(PROCUREMENT_PLAN_STATUS),
      default: PROCUREMENT_PLAN_STATUS.DRAFT,
      index: true,
    },
    items: {
      type: [procurementPlanItemSchema],
      default: [],
    },
    totalEstimatedCost: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

procurementPlanSchema.index(
  { procurementDate: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['DRAFT', 'CONFIRMED'] } },
  }
);

export default mongoose.model('ProcurementPlan', procurementPlanSchema);
