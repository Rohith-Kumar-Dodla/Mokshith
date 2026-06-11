import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ME-${year}${month}-${random}`;
};

export const createInvoicePDF = async (invoice, order, user) => {
  return new Promise((resolve, reject) => {
    try {
      console.log(`[InvoiceGenerator] 🛠️ Creating PDF for Invoice: ${invoice.invoiceNumber}`);
      
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        info: {
          Title: `Invoice ${invoice.invoiceNumber}`,
          Author: 'Mokshith Enterprises',
        }
      });

      const filename = `invoice-${invoice.invoiceNumber}.pdf`;
      const uploadDir = path.resolve(process.cwd(), 'src/uploads/invoices');
      
      console.log(`[InvoiceGenerator] 📂 Target Directory: ${uploadDir}`);
      
      // Ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        console.log(`[InvoiceGenerator] 📁 Creating missing directory: ${uploadDir}`);
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);
      const stream = fs.createWriteStream(filePath);
      
      stream.on('error', (err) => {
        console.error(`[InvoiceGenerator] ❌ Stream error: ${err.message}`);
        reject(new Error(`Failed to write PDF to disk: ${err.message}`));
      });

      doc.pipe(stream);

      // Header
      try {
        doc
          .fillColor('#444444')
          .fontSize(20)
          .text('MOKSHITH ENTERPRISES', 50, 50)
          .fontSize(10)
          .text('123 B2B Business Hub, Industrial Area', 50, 75)
          .text('Hyderabad, Telangana - 500001', 50, 90)
          .text('GSTIN: 36AAAAA0000A1Z5', 50, 105)
          .moveDown();

        // Invoice Details
        doc
          .fontSize(12)
          .text(`Invoice Number: ${invoice.invoiceNumber}`, 400, 50)
          .text(`Date: ${new Date().toLocaleDateString()}`, 400, 65)
          .text(`Order ID: ${String(order._id || 'N/A')}`, 400, 80)
          .moveDown();

        // Bill To
        const recipientName = user?.name || order.address?.name || order.shippingAddress?.name || 'Business Partner';
        const companyName = user?.companyName || 'Corporate Entity';
        const address = order.shippingAddress?.addressLine1 || order.address?.addressLine || 'Address not provided';

        doc
          .fontSize(12)
          .text('BILL TO:', 50, 150)
          .fontSize(10)
          .text(String(recipientName), 50, 165)
          .text(String(companyName), 50, 180)
          .text(String(address), 50, 195)
          .moveDown();

        // Table Header
        const tableTop = 250;
        doc.font('Helvetica-Bold');
        doc.text('Item', 50, tableTop);
        doc.text('Qty', 220, tableTop);
        doc.text('Base', 280, tableTop);
        doc.text('GST %', 350, tableTop);
        doc.text('GST ₹', 420, tableTop);
        doc.text('Total', 490, tableTop);
        
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
        doc.font('Helvetica');

        // Table Items
        let currentHeight = tableTop + 30;
        const itemsToDisplay = order.itemDetails || order.items || [];
        
        itemsToDisplay.forEach(item => {
          // Safety checks for numeric values
          const qty = Number(item.quantity) || 0;
          const price = Number(item.price) || 0;
          const gstRate = Number(item.gstRate) || 18;
          const basePrice = Number(item.basePrice) || (price / 1.18);
          const taxPerUnit = Number(item.taxPerUnit) || (price - basePrice);
          const name = String(item.name || 'Product');

          doc.text(name.substring(0, 25), 50, currentHeight);
          doc.text(qty.toString(), 220, currentHeight);
          doc.text(`₹${basePrice.toFixed(2)}`, 280, currentHeight);
          doc.text(`${gstRate}%`, 350, currentHeight);
          doc.text(`₹${(taxPerUnit * qty).toFixed(2)}`, 420, currentHeight);
          doc.text(`₹${(price * qty).toFixed(2)}`, 490, currentHeight);
          currentHeight += 20;

          // Page break check
          if (currentHeight > 700) {
            doc.addPage();
            currentHeight = 50;
          }
        });

        // Footer Calculations
        const footerTop = Math.max(currentHeight + 30, 450);
        doc.moveTo(50, footerTop).lineTo(550, footerTop).stroke();
        
        const subtotal = Number(invoice.amount) || 0;
        const taxTotal = Number(invoice.taxAmount) || 0;
        const grandTotal = Number(invoice.totalAmount) || 0;
        const gstLabel = Number(invoice.gst) || 18;

        doc.text('Subtotal:', 350, footerTop + 15);
        doc.text(`₹${subtotal.toLocaleString('en-IN')}`, 450, footerTop + 15);
        
        doc.text(`GST (${gstLabel}%):`, 350, footerTop + 30);
        doc.text(`₹${taxTotal.toLocaleString('en-IN')}`, 450, footerTop + 30);
        
        doc.font('Helvetica-Bold');
        doc.text('Grand Total:', 350, footerTop + 50);
        doc.text(`₹${grandTotal.toLocaleString('en-IN')}`, 450, footerTop + 50);

        doc.fontSize(10).font('Helvetica').text('Thank you for your business!', 50, 750, { align: 'center', width: 500 });

        doc.end();
        stream.on('finish', () => {
          console.log(`[InvoiceGenerator] ✅ PDF created successfully: ${filePath}`);
          resolve(filePath);
        });
      } catch (docError) {
        console.error(`[InvoiceGenerator] ❌ Document generation error: ${docError.message}`);
        doc.end();
        reject(new Error(`PDF Content Generation failed: ${docError.message}`));
      }
    } catch (err) {
      console.error(`[InvoiceGenerator] ❌ Fatal error: ${err.message}`);
      reject(new Error(`Fatal PDF Error: ${err.message}`));
    }
  });
};
