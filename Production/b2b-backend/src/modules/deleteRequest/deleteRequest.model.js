import mongoose from 'mongoose';

const deleteRequestSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  requesterRole: { type: String, required: true },
  entityType: { type: String, enum: ['PRODUCT', 'CATEGORY', 'WAREHOUSE', 'USER'], required: true, index: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  entityDisplay: { type: String, required: true, trim: true },
  entityVersion: { type: Date, default: null },
  reason: { type: String, trim: true, maxlength: 500, default: '' },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'FAILED', 'STALE'], default: 'PENDING', index: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  rejectionReason: { type: String, trim: true, maxlength: 500, default: '' },
  executionResult: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });

deleteRequestSchema.index(
  { entityType: 1, entityId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'PENDING' } }
);

export default mongoose.model('DeleteRequest', deleteRequestSchema);
