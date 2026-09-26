import * as repo from './invoice.repository.js';
import { generateInvoiceNumber, createInvoicePDF } from './invoice.generator.js';
import AppError from '../../errors/AppError.js';
import Order from '../order/order.model.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateInvoice = async (orderId, force = false) => {
  console.log(`[InvoiceService] 🚀 Generating invoice for Order: ${orderId}`);
  const order = await Order.findById(orderId).populate('userId');
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // 🔥 Prevent duplicate invoice record, but allow re-generating file
  let invoice = await repo.findByOrderId(order._id);
  
  if (invoice && invoice.fileUrl && !force) {
    // Check if file exists on disk
    const relativePath = invoice.fileUrl.startsWith('/') ? invoice.fileUrl.substring(1) : invoice.fileUrl;
    const filePath = path.resolve(process.cwd(), 'src', relativePath);
    if (fs.existsSync(filePath)) {
      console.log(`[InvoiceService] ✅ Existing invoice file found: ${filePath}`);
      return invoice;
    }
    console.log(`[InvoiceService] 🔄 File missing for invoice ${invoice.invoiceNumber}, re-generating...`);
  }

  // Invoices are historical documents: use the order snapshot, never current product/user data.
  const gstRate = 18;
  const itemDetails = (order.items || []).map((item) => {
    const price = Number(item.price || 0);
    const quantity = Number(item.quantity || 0);
    const basePrice = price / (1 + gstRate / 100);
    return {
      name: item.name || 'Product',
      price,
      quantity,
      basePrice,
      gstRate,
      taxPerUnit: price - basePrice,
      finalPrice: Number(item.finalPrice ?? price),
      discountAmount: Number(item.discountAmount || 0),
      specialDiscountAmount: Number(item.specialDiscountAmount || 0),
      bulkDiscountAmount: Number(item.bulkDiscountAmount || 0),
    };
  });
  const totalBaseAmount = Number(order.subtotal ?? itemDetails.reduce((sum, item) => sum + item.basePrice * item.quantity, 0));
  const totalTaxAmount = Number(order.taxAmount ?? (Number(order.totalAmount || 0) - totalBaseAmount));

  if (!invoice) {
    const invoiceNumber = generateInvoiceNumber();
    const invoiceData = {
      orderId: order._id,
      userId: order.userId?._id || order.userId || null,
      amount: Math.round((totalBaseAmount || 0) * 100) / 100,
      gst: gstRate,
      taxAmount: Math.round((totalTaxAmount || 0) * 100) / 100,
      totalAmount: order.totalAmount || 0,
      invoiceNumber,
    };
    
    console.log(`[InvoiceService] 📄 Creating invoice record: ${invoiceNumber}`);
    invoice = await repo.createInvoice(invoiceData);
  }

  // Generate PDF synchronously (wait for it)
  try {
    console.log(`[InvoiceService] 🎨 Starting PDF generation for ${invoice.invoiceNumber}`);
    const pdfPath = await createInvoicePDF(invoice, { ...order.toObject(), itemDetails }, order.userId);
    invoice.fileUrl = `/uploads/invoices/invoice-${invoice.invoiceNumber}.pdf`;
    await invoice.save();
    console.log(`[InvoiceService] ✨ Invoice ${invoice.invoiceNumber} saved successfully`);
  } catch (err) {
    console.error('[InvoiceService] ❌ PDF Generation failed:', err);
    throw new AppError(`Failed to generate invoice PDF: ${err.message}`, 500);
  }

  return invoice;
};

export const getInvoiceByOrderId = async (orderId) => {
  return repo.findByOrderId(orderId);
};

export const getInvoicesForUser = async (userId) => {
  return repo.findByUserId(userId);
};
