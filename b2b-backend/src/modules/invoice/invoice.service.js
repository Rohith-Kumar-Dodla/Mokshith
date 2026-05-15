import * as repo from './invoice.repository.js';
import { generateInvoiceNumber, createInvoicePDF } from './invoice.generator.js';
import AppError from '../../errors/AppError.js';
import Order from '../order/order.model.js';
import User from '../user/user.model.js';
import Product from '../product/product.model.js';

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

  // Calculate GST per item safely
  let totalBaseAmount = 0;
  let totalTaxAmount = 0;

  const itemDetails = await Promise.all((order.items || []).map(async (item) => {
    try {
      const product = await Product.findById(item.productId);
      const gstRate = product?.gst || 18;
      const price = item.price || 0;
      const quantity = item.quantity || 0;
      
      const basePrice = price / (1 + gstRate / 100);
      const taxPerUnit = price - basePrice;
      
      totalBaseAmount += basePrice * quantity;
      totalTaxAmount += taxPerUnit * quantity;

      return {
        name: item.name || 'Unknown Product',
        price: price,
        quantity: quantity,
        basePrice,
        gstRate,
        taxPerUnit
      };
    } catch (err) {
      console.error(`[InvoiceService] Error processing item:`, err);
      return {
        name: item.name || 'Product',
        price: item.price || 0,
        quantity: item.quantity || 0,
        basePrice: (item.price || 0) / 1.18,
        gstRate: 18,
        taxPerUnit: (item.price || 0) - ((item.price || 0) / 1.18)
      };
    }
  }));

  if (!invoice) {
    const invoiceNumber = generateInvoiceNumber();
    const invoiceData = {
      orderId: order._id,
      userId: order.userId?._id || order.userId || null,
      amount: Math.round((totalBaseAmount || 0) * 100) / 100,
      gst: 18, // average
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