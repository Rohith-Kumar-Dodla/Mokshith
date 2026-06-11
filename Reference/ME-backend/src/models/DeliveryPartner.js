import mongoose from 'mongoose';

const deliveryPartnerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    vehicleType: {
      type: String,
      required: [true, 'Vehicle type is required'],
      enum: ['bike', 'scooter', 'car', 'van', 'truck'],
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      trim: true,
      uppercase: true,
      match: [
        /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/,
        'Please provide a valid vehicle number (e.g., MH12AB1234)',
      ],
    },
    drivingLicense: {
      type: String,
      required: [true, 'Driving license number is required'],
      trim: true,
      uppercase: true,
      match: [
        /^[A-Z]{2}[0-9]{13}$/,
        'Please provide a valid driving license number',
      ],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'India',
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      match: [/^[0-9]{6}$/, 'Please provide a valid 6-digit pincode'],
    },
    profileImage: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'inactive', 'suspended', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
deliveryPartnerSchema.index({ userId: 1 });
deliveryPartnerSchema.index({ status: 1 });
deliveryPartnerSchema.index({ fullName: 1 });
deliveryPartnerSchema.index({ email: 1 });

const DeliveryPartner = mongoose.model('DeliveryPartner', deliveryPartnerSchema);

export default DeliveryPartner;
