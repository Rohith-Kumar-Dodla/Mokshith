import mongoose from 'mongoose';

export const RETURN_STATUS = Object.freeze({
  REQUESTED: 'REQUESTED', APPROVED: 'APPROVED', PICKUP_ASSIGNED: 'PICKUP_ASSIGNED', PICKED_UP: 'PICKED_UP',
  RECEIVED: 'RECEIVED', INSPECTING: 'INSPECTING', RESOLUTION_PENDING: 'RESOLUTION_PENDING',
  REFUND_PENDING: 'REFUND_PENDING', REFUNDED: 'REFUNDED', REPLACEMENT_PENDING: 'REPLACEMENT_PENDING',
  REPLACEMENT_CREATED: 'REPLACEMENT_CREATED', REPLACEMENT_SHIPPED: 'REPLACEMENT_SHIPPED',
  REPLACEMENT_DELIVERED: 'REPLACEMENT_DELIVERED', REJECTED: 'REJECTED', CANCELLED: 'CANCELLED', FAILED: 'FAILED',
});

export const RETURN_REASONS = Object.freeze(['DAMAGED', 'WRONG_PRODUCT', 'MISSING_ITEMS', 'DEFECTIVE', 'EXPIRED', 'QUALITY_ISSUE', 'DIFFERENT_PRODUCT', 'OTHER']);
export const RETURN_RESOLUTIONS = Object.freeze(['REFUND', 'REPLACEMENT']);

const itemSchema = new mongoose.Schema({
  orderItemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  orderedQuantity: { type: Number, required: true },
  requestedQuantity: { type: Number, required: true, min: 1 },
  approvedQuantity: { type: Number, default: 0, min: 0 },
  receivedQuantity: { type: Number, default: 0, min: 0 },
  acceptedQuantity: { type: Number, default: 0, min: 0 },
  rejectedQuantity: { type: Number, default: 0, min: 0 },
  replacementQuantity: { type: Number, default: 0, min: 0 },
  unitRefundAmount: { type: Number, required: true, min: 0 },
  condition: { type: String, enum: ['UNINSPECTED', 'SELLABLE', 'DAMAGED', 'DEFECTIVE', 'REJECTED'], default: 'UNINSPECTED' },
  inspectionNotes: { type: String, default: '', maxlength: 1000 },
}, { _id: true });

const historySchema = new mongoose.Schema({
  status: { type: String, enum: Object.values(RETURN_STATUS), required: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorRole: String,
  note: { type: String, default: '', maxlength: 1000 },
  at: { type: Date, default: Date.now },
}, { _id: false });

const returnRequestSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: Object.values(RETURN_STATUS), default: RETURN_STATUS.REQUESTED, index: true },
  reason: { type: String, enum: RETURN_REASONS, required: true },
  reasonDetails: { type: String, trim: true, maxlength: 1000, default: '' },
  requestedResolution: { type: String, enum: RETURN_RESOLUTIONS, required: true },
  finalResolution: { type: String, enum: [...RETURN_RESOLUTIONS, null], default: null },
  items: { type: [itemSchema], validate: value => Array.isArray(value) && value.length > 0 },
  pickupLogisticsId: { type: mongoose.Schema.Types.ObjectId, ref: 'Logistics', default: null },
  refundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Refund', default: null },
  refundAmount: { type: Number, default: 0 },
  replacementOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  inventoryRestored: { type: Boolean, default: false },
  inspectedAt: Date,
  inspectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: Date,
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  history: [historySchema],
  idempotencyKey: { type: String, required: true },
}, { timestamps: true });

returnRequestSchema.index({ customerId: 1, createdAt: -1 });
returnRequestSchema.index({ status: 1, createdAt: -1 });
returnRequestSchema.index({ orderId: 1, idempotencyKey: 1 }, { unique: true });

export default mongoose.model('ReturnRequest', returnRequestSchema);
