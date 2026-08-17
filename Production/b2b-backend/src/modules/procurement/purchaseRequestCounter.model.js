import mongoose from 'mongoose';

const purchaseRequestCounterSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: false }
);

export default mongoose.model('PurchaseRequestCounter', purchaseRequestCounterSchema);
