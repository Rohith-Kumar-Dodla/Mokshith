import mongoose from 'mongoose';
import { PAYMENT_PROOF_STATUS } from '../../constants/paymentProofStatus.js';

const paymentProofSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['BANK_TRANSFER'],
      default: 'BANK_TRANSFER',
      required: true,
    },
    utrNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    screenshot: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_PROOF_STATUS),
      default: PAYMENT_PROOF_STATUS.PENDING,
      required: true,
      index: true,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

paymentProofSchema.index({ orderId: 1, status: 1 });
paymentProofSchema.index({ status: 1, createdAt: -1 });
paymentProofSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('PaymentProof', paymentProofSchema);
