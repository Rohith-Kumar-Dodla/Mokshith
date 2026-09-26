import mongoose from 'mongoose';

const supplierAllocationSchema = new mongoose.Schema({
  customerOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  supplierProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierProduct', required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitSupplierPriceSnapshot: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['ACTIVE', 'CANCELLED'], default: 'ACTIVE', index: true },
  supplierRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierOrder', default: null, index: true },
  idempotencyKey: { type: String, required: true, unique: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

supplierAllocationSchema.index({ customerOrderId: 1, productId: 1, status: 1 });
supplierAllocationSchema.index({ customerOrderId: 1, supplierId: 1, supplierRequestId: 1 });

export default mongoose.model('SupplierAllocation', supplierAllocationSchema);
