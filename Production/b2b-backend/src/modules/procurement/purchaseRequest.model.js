import mongoose from 'mongoose';
import { PURCHASE_REQUEST_STATUS } from '../../constants/purchaseRequestStatus.js';

const purchaseRequestReceiptSchema = new mongoose.Schema(
  {
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const purchaseRequestItemSchema = new mongoose.Schema(
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
    supplierProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupplierProduct',
      required: true,
    },
    demandQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    purchaseQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    supplierPriceSnapshot: {
      type: Number,
      required: true,
      min: 0,
    },
    supplierMOQSnapshot: {
      type: Number,
      required: true,
      min: 1,
    },
    estimatedSubtotal: {
      type: Number,
      default: 0,
    },
    confirmedQuantity: {
      type: Number,
      default: null,
      min: 0,
    },
    receivedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    receipts: {
      type: [purchaseRequestReceiptSchema],
      default: [],
    },
  },
  { _id: false }
);

const purchaseRequestSchema = new mongoose.Schema(
  {
    purchaseRequestNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true,
    },
    supplierNameSnapshot: {
      type: String,
      trim: true,
      default: '',
    },
    demandDate: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(PURCHASE_REQUEST_STATUS),
      default: PURCHASE_REQUEST_STATUS.DRAFT,
      index: true,
    },
    items: {
      type: [purchaseRequestItemSchema],
      default: [],
    },
    totalEstimatedCost: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    expectedDeliveryDate: {
      type: String,
      trim: true,
      default: '',
    },
    supplierResponseNotes: {
      type: String,
      trim: true,
      default: '',
    },
    requestedAt: {
      type: Date,
      default: null,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    fulfilledAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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
  },
  { timestamps: true }
);

purchaseRequestSchema.index({ supplierId: 1, status: 1, demandDate: 1 });
purchaseRequestSchema.index({ createdAt: -1 });

export default mongoose.model('PurchaseRequest', purchaseRequestSchema);
