import mongoose from 'mongoose';
import { ROLES } from '../../constants/roles.js';
import { USER_STATUS } from '../../constants/userStatus.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.B2B_CUSTOMER,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },

    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.PENDING,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    refreshToken: {
      type: String,
      select: false,
    },

    // 2FA / MFA fields
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },

    twoFactorSecret: {
      type: String,
      select: false
    },

    twoFactorBackupCodes: [{
      type: String,
      select: false
    }],

    twoFactorMethod: {
      type: String,
      enum: ['totp', 'sms', 'email'],
      default: 'totp'
    },

    // Security tracking
    lastPasswordChange: {
      type: Date,
      default: Date.now
    },

    passwordHistory: [{
      hash: String,
      changedAt: Date
    }],

    loginAttempts: {
      type: Number,
      default: 0
    },

    lockUntil: {
      type: Date
    },

    securityQuestions: [{
      question: String,
      answer: String // Hashed
    }],

    addresses: [
      {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        addressLine: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
      },
    ],

    creditLimit: {
      type: Number,
      default: 50000,
      min: 0,
    },

    availableCredit: {
      type: Number,
      default: 50000,
      min: 0,
    },

    profileImage: String,
    profileImagePublicId: String,
    phone: String,
    address: String,
    companyName: String,

    // B2B Customer specific fields
    gstNumber: String,
    businessName: String,
    businessAddress: String,
    ownerName: String,

    // Delivery Partner specific fields
    vehicleType: {
      type: String,
      enum: ['TWO_WHEELER', 'THREE_WHEELER', 'FOUR_WHEELER', 'HEAVY_VEHICLE'],
    },
    vehicleNumber: String,
    licenseNumber: String,

    // Single active session enforcement
    activeSessionId: {
      type: String,
      default: null,
      index: true,
    },
    lastLoginAt: {
      type: Date,
    },
    lastLoginDevice: {
      type: String,
    },
    lastLoginIp: {
      type: String,
    },

    activeSessions: [
      {
        deviceId: String,
        deviceName: String,
        browser: String,
        os: String,
        lastActive: { type: Date, default: Date.now },
        ip: String,
        location: String
      }
    ],
  },
  { timestamps: true }
);

// 🔥 Soft delete filter
userSchema.pre(/^find/, function () {
  this.find({ isDeleted: { $ne: true } });
});

export default mongoose.model('User', userSchema);