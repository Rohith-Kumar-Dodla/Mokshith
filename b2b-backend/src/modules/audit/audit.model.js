import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
      ref: 'User'
    },
    userEmail: String,
    role: String,
    action: {
      type: String,
      required: true,
    },
    entity: {
      type: String,
      required: true,
    },
    entityId: mongoose.Schema.Types.ObjectId,
    details: String,
    data: {
      type: Object,
      default: {},
    },
    ip: String,
    severity: {
      type: String,
      enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'],
      default: 'INFO'
    }
  },
  { timestamps: true }
);

export default mongoose.model('Audit', auditSchema);