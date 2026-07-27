import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      default: 'platform',
      unique: true,
      immutable: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default:
        'Website is currently under maintenance.\nPlease try again later.',
      trim: true,
      maxlength: 1000,
    },
    supportPhone: {
      type: String,
      default: '',
      trim: true,
      maxlength: 30,
    },
    supportEmail: {
      type: String,
      default: '',
      trim: true,
      maxlength: 120,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model('PlatformSettings', platformSettingsSchema);
