import mongoose from 'mongoose';

const companyDocumentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, index: true },
  type: {
    type: String,
    enum: ['GST_CERTIFICATE', 'PAN', 'COMPANY_REGISTRATION', 'BUSINESS_LICENSE', 'TRADE_LICENSE', 'AGREEMENT', 'INSURANCE', 'BANK_DOCUMENT', 'COMPLIANCE_DOCUMENT', 'OTHER'],
    required: true,
    index: true,
  },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  documentNumber: { type: String, trim: true, maxlength: 100, default: '' },
  issuedDate: Date,
  expiryDate: { type: Date, index: true },
  fileUrl: { type: String, required: true, select: false },
  fileKey: { type: String, default: null, select: false },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true, min: 1 },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes: { type: String, trim: true, maxlength: 500, default: '' },
  isArchived: { type: Boolean, default: false, index: true },
}, { timestamps: true });

companyDocumentSchema.index({ isArchived: 1, createdAt: -1 });
export default mongoose.model('CompanyDocument', companyDocumentSchema);
