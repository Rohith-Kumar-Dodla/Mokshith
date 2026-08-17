import mongoose from 'mongoose';
import { SUPPLIER_STATUS } from '../../constants/supplierStatus.js';
import { ROLES } from '../../constants/roles.js';

const supplierSchema = new mongoose.Schema(
  {
    supplierName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    contactPerson: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: undefined,
    },
    businessAddress: {
      type: String,
      trim: true,
      default: '',
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: undefined,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(SUPPLIER_STATUS),
      default: SUPPLIER_STATUS.PENDING,
      index: true,
    },
    role: {
      type: String,
      enum: [ROLES.SUPPLIER],
      default: ROLES.SUPPLIER,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

supplierSchema.index({ email: 1 }, { unique: true, sparse: true });
supplierSchema.index({ gstNumber: 1 }, { unique: true, sparse: true });

supplierSchema.pre(/^find/, function () {
  this.find({ isDeleted: { $ne: true } });
});

export default mongoose.model('Supplier', supplierSchema);
