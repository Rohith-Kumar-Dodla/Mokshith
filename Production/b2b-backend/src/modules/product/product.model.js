import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      // Seeded "vendors" are users with role=VENDOR. Store ownership as the User id.
      ref: 'User',
      required: false,
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: false,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    unit: {
      type: String,
      default: 'unit',
    },

    minOrderQty: {
      type: Number,
      default: 1,
      min: 1,
    },

    weight: {
      type: Number,
      default: 0,
    },

    moq: {
      type: Number,
      default: 1,
      min: 1,
    },

    gst: {
      type: Number,
      default: 18, // 18% standard GST
    },

    image: {
      type: String,
      required: false,
    },

    imageUrl: {
      type: String,
      required: false,
    },

    imagePublicId: {
      type: String,
      required: false,
    },

    bulkPricing: [
      {
        minQuantity: Number,
        price: Number,
      },
    ],

    variants: [
      {
        name: String,
        value: String,
        additionalPrice: {
          type: Number,
          default: 0,
        },
        stock: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);