import mongoose from 'mongoose';
import { SUPPLIER_ORDER_STATUS } from '../../constants/supplierOrderStatus.js';

const supplierOrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productNameSnapshot: { type: String, required: true, trim: true },
  supplierProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierProduct', required: true },
  supplierSkuSnapshot: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 1 },
  unitSupplierPrice: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
}, { _id: true });

const supplierOrderSchema = new mongoose.Schema({
  supplierOrderNumber: { type: String, required: true, unique: true, index: true },
  customerOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedAt: { type: Date, default: Date.now },
  recommendedSupplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null },
  recommendationPrice: { type: Number, default: null },
  selectedSupplierPrice: { type: Number, default: null },
  status: { type: String, enum: Object.values(SUPPLIER_ORDER_STATUS), default: SUPPLIER_ORDER_STATUS.ASSIGNED, index: true },
  rejectionReason: { type: String, trim: true, default: '' },
  items: { type: [supplierOrderItemSchema], required: true, min: 1 },
  totalSupplierCost: { type: Number, required: true, min: 0 },
  whatsappStatus: { type: String, enum: ['NONE', 'MESSAGE_GENERATED', 'WHATSAPP_OPENED'], default: 'NONE' },
  whatsappMessage: { type: String, default: '' },
  whatsappGeneratedAt: { type: Date, default: null },
  whatsappOpenedAt: { type: Date, default: null },
  acknowledgedAt: { type: Date, default: null },
  collectedAt: { type: Date, default: null },
  receivedAtWarehouseAt: { type: Date, default: null },
}, { timestamps: true });

supplierOrderSchema.index({ customerOrderId: 1, supplierId: 1, createdAt: -1 });

export default mongoose.model('SupplierOrder', supplierOrderSchema);
