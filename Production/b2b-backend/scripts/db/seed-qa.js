#!/usr/bin/env node
/**
 * QA/UAT deterministic seeding script.
 * - Inserts Super Admin, Admin, sample Vendors, Delivery Partners, Customers
 * - Inserts sample Companies, Categories, Products, Inventory entries
 * - Idempotent: uses upsert (findOneAndUpdate with $setOnInsert)
 *
 * Safety:
 * - Will abort when APP_DATABASE_NAME === 'mokshith-production'
 */
import connectDB from '../../src/config/db.js';
import mongoose from 'mongoose';
import { getAppDatabaseName } from '../../src/config/environmentResolver.js';
import User from '../../src/modules/user/user.model.js';
import Company from '../../src/modules/company/company.model.js';
import Category from '../../src/modules/category/category.model.js';
import Product from '../../src/modules/product/product.model.js';
import Inventory from '../../src/modules/inventory/inventory.model.js';
import Warehouse from '../../src/modules/warehouse/warehouse.model.js';
import Order from '../../src/modules/order/order.model.js';
import Payment from '../../src/modules/payment/payment.model.js';
import Invoice from '../../src/modules/invoice/invoice.model.js';
import Logistics from '../../src/modules/logistics/logistics.model.js';
import Notification from '../../src/modules/notification/notification.model.js';
import Wishlist from '../../src/modules/wishlist/wishlist.model.js';
import Cart from '../../src/modules/cart/cart.model.js';
import Settings from '../../src/modules/settings/settings.model.js';
import { ROLE_PERMISSIONS, PERMISSIONS } from '../../src/constants/permissions.js';
import { updateSetting } from '../../src/modules/settings/settings.service.js';
import { hashPassword } from '../../src/utils/hashPassword.js';
import { logger } from '../../src/config/logger.js';

const now = new Date();

async function upsertUser({ email, mobile, name, role, password }) {
  const hashed = await hashPassword(password);
  const update = {
    $setOnInsert: {
      name,
      email,
      mobile,
      password: hashed,
      role,
      status: 'ACTIVE',
      lastPasswordChange: now,
      createdAt: now,
    },
  };
  const opts = { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true };
  return User.findOneAndUpdate({ $or: [{ email }, { mobile }] }, update, opts);
}

async function upsertCompany({ name, domain }) {
  // Company schema requires email; derive an email from name if not provided
  const email = `${String(name).toLowerCase().replace(/\s+/g, '')}@${(domain || 'example.com')}`;
  return Company.findOneAndUpdate(
    { name },
    { $setOnInsert: { name, email, phone: null, address: null, createdAt: now } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
}

async function upsertCategory({ name, slug }) {
  return Category.findOneAndUpdate(
    { slug },
    { $setOnInsert: { name, slug, createdAt: now } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
}

async function upsertProduct({ sku, name, categoryId, price = 100 }) {
  return Product.findOneAndUpdate(
    { name, categoryId },
    { $setOnInsert: { name, price, categoryId, createdAt: now } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
}

async function upsertInventory({ productId, warehouseId = null, quantity = 100 }) {
  return Inventory.findOneAndUpdate(
    { productId, warehouseId },
    { $setOnInsert: { productId, warehouseId, stock: quantity, createdAt: now } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
}

async function upsertWarehouse({ name = 'Default Warehouse', location = {} } = {}) {
  return Warehouse.findOneAndUpdate(
    { name },
    { $setOnInsert: { name, location, createdAt: now } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
}

async function upsertOrder({ userId, items, address, paymentMethod = 'COD', status = 'PENDING' }) {
  const totalAmount = items.reduce((s, it) => s + (it.price * it.quantity), 0);
  const update = {
    $setOnInsert: {
      userId,
      items,
      totalAmount,
      paymentMethod,
      address,
      status,
      createdAt: now,
    },
  };
  return Order.findOneAndUpdate(
    { userId, totalAmount, 'items.0.productId': items[0].productId, status },
    update,
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
}

async function upsertPayment({ orderId, userId, amount, status = 'INITIATED', method = 'ONLINE', metadata = {} }) {
  return Payment.findOneAndUpdate(
    { orderId, amount, paymentMethod: method },
    { $setOnInsert: { orderId, userId, amount, status, paymentMethod: method, metadata, createdAt: now } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
}

async function upsertInvoice({ orderId, amount, issuedTo }) {
  // Compute tax and totals for invoice
  const gstPercent = 18;
  const taxAmount = Math.round((amount * gstPercent) / 100);
  const totalAmount = amount + taxAmount;
  const invoiceNumber = `INV-${String(orderId).slice(-6)}-${Date.now()}`;
  return Invoice.findOneAndUpdate(
    { orderId },
    { $setOnInsert: { orderId, userId: issuedTo, amount, taxAmount, totalAmount, invoiceNumber, createdAt: now } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
}

async function upsertLogistics({ orderId, assignedTo = null, status = 'ASSIGNED' }) {
  // Deterministic tracking number derived from orderId to avoid duplicate null unique-index errors.
  const trackingNumber = `QA-TRK-${String(orderId).slice(-6).toUpperCase()}`;
  return Logistics.findOneAndUpdate(
    { orderId },
    { $setOnInsert: { orderId, deliveryPartnerId: assignedTo, status, address: 'Auto-seeded address', trackingNumber, createdAt: now } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
}

async function upsertNotificationTemplate(key, title, message, type = 'SYSTEM') {
  // Store templates in Settings as a simple approach
  const val = { key, title, message, type };
  return Settings.findOneAndUpdate({ key: `notification_template:${key}` }, { $setOnInsert: { key: `notification_template:${key}`, value: val } }, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true });
}

async function main() {
  try {
    await connectDB();
    const active = getAppDatabaseName();
    logger.info(`Seeding DB: ${active}`);
    if (active === 'mokshith-production') {
      logger.error('Refusing to seed production database. Aborting.');
      process.exit(1);
    }

    // Users
    await upsertUser({
      email: 'superadmin@example.com',
      mobile: '9000000001',
      name: 'Seed Super Admin',
      role: 'SUPER_ADMIN',
      password: 'SuperAdmin@123',
    });

    await upsertUser({
      email: 'admin@example.com',
      mobile: '9000000002',
      name: 'Seed Admin',
      role: 'ADMIN',
      password: 'Admin@123',
    });

    await upsertUser({
      email: 'vendor@example.com',
      mobile: '9000000003',
      name: 'Seed Vendor',
      role: 'VENDOR',
      password: 'Vendor@123',
    });

    await upsertUser({
      email: 'delivery@example.com',
      mobile: '9000000004',
      name: 'Seed Delivery',
      role: 'DELIVERY_PARTNER',
      password: 'Delivery@123',
    });

    await upsertUser({
      email: 'customer@example.com',
      mobile: '9000000005',
      name: 'Seed Customer',
      role: 'B2B_CUSTOMER',
      password: 'Customer@123',
    });

    // Company
    const company = await upsertCompany({ name: 'Seed Company', domain: 'example.com' });

    // Categories (5)
    const categories = [];
    for (let i = 1; i <= 5; i++) {
      const c = await upsertCategory({ name: `Category ${i}`, slug: `category-${i}` });
      categories.push(c);
    }

    // Products (2-3 per category)
    const products = [];
    // Ensure a default warehouse exists
    const warehouse = await upsertWarehouse({ name: 'Seed Warehouse', location: { city: 'SeedCity' } });
    for (const c of categories) {
      for (let p = 1; p <= 3; p++) {
        const prod = await upsertProduct({ name: `${c.name} Product ${p}`, categoryId: c._id, price: 100 + p * 10 });
        products.push(prod);
        await upsertInventory({ productId: prod._id, warehouseId: warehouse._id, quantity: 100 + p * 50 });
      }
    }

    // Platform settings and feature flags
    await updateSetting('siteName', 'Mokshith QA');
    await updateSetting('allowRegistration', true);
    await updateSetting('featureFlags', { payments: true, recommendations: true, reviews: true });

    // Roles & Permissions: NOT part of runtime ALLOWED_KEYS, store directly in Settings collection for QA visibility
    await Settings.findOneAndUpdate(
      { key: 'rbac_permissions' },
      { $setOnInsert: { key: 'rbac_permissions', value: PERMISSIONS, description: 'QA: role->permission map', createdAt: now } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
    await Settings.findOneAndUpdate(
      { key: 'rbac_role_permissions' },
      { $setOnInsert: { key: 'rbac_role_permissions', value: ROLE_PERMISSIONS, description: 'QA: role permissions mapping', createdAt: now } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    // Tax config & shipping config (not part of runtime ALLOWED_KEYS), store directly
    await Settings.findOneAndUpdate(
      { key: 'taxConfig' },
      { $setOnInsert: { key: 'taxConfig', value: { gstPercent: 18, cessPercent: 0 }, description: 'QA tax config', createdAt: now } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
    await Settings.findOneAndUpdate(
      { key: 'shippingConfig' },
      { $setOnInsert: { key: 'shippingConfig', value: { baseFee: 50, perKg: 10, freeAbove: 2000 }, description: 'QA shipping config', createdAt: now } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    // Notification templates
    await upsertNotificationTemplate('order_created', 'Order Created', 'Your order {{orderId}} has been created', 'ORDER');
    await upsertNotificationTemplate('payment_success', 'Payment Successful', 'Payment for order {{orderId}} was successful', 'PAYMENT');

    // Seed additional users (total as requested)
    // Ensure we have: 1 Super Admin, 1 Admin, 2 Vendors, 2 Delivery Partners, 3 Customers
    const seededUsers = {};
    seededUsers.superadmin = await upsertUser({ email: 'superadmin@example.com', mobile: '9000000001', name: 'Seed Super Admin', role: 'SUPER_ADMIN', password: 'SuperAdmin@123' });
    seededUsers.admin = await upsertUser({ email: 'admin@example.com', mobile: '9000000002', name: 'Seed Admin', role: 'ADMIN', password: 'Admin@123' });
    seededUsers.vendor1 = await upsertUser({ email: 'vendor1@example.com', mobile: '9000000101', name: 'Vendor One', role: 'VENDOR', password: 'Vendor@123' });
    seededUsers.vendor2 = await upsertUser({ email: 'vendor2@example.com', mobile: '9000000102', name: 'Vendor Two', role: 'VENDOR', password: 'Vendor@123' });
    seededUsers.delivery1 = await upsertUser({ email: 'delivery1@example.com', mobile: '9000000201', name: 'Delivery One', role: 'DELIVERY_PARTNER', password: 'Delivery@123' });
    seededUsers.delivery2 = await upsertUser({ email: 'delivery2@example.com', mobile: '9000000202', name: 'Delivery Two', role: 'DELIVERY_PARTNER', password: 'Delivery@123' });
    seededUsers.customer1 = await upsertUser({ email: 'customer1@example.com', mobile: '9000000301', name: 'Customer One', role: 'B2B_CUSTOMER', password: 'Customer@123' });
    seededUsers.customer2 = await upsertUser({ email: 'customer2@example.com', mobile: '9000000302', name: 'Customer Two', role: 'B2B_CUSTOMER', password: 'Customer@123' });
    seededUsers.customer3 = await upsertUser({ email: 'customer3@example.com', mobile: '9000000303', name: 'Customer Three', role: 'B2B_CUSTOMER', password: 'Customer@123' });

    // Seed companies
    const companyA = await upsertCompany({ name: 'Seed Company A', domain: 'a.example.com' });
    const companyB = await upsertCompany({ name: 'Seed Company B', domain: 'b.example.com' });

    // Create sample carts/wishlists for customers
    await Wishlist.findOneAndUpdate({ userId: seededUsers.customer1._id }, { $setOnInsert: { userId: seededUsers.customer1._id, items: [] } }, { upsert: true, returnDocument: 'after' });
    await Cart.findOneAndUpdate({ userId: seededUsers.customer1._id }, { $setOnInsert: { userId: seededUsers.customer1._id, items: [] } }, { upsert: true, returnDocument: 'after' });

    // Seed representative orders & payments (various statuses)
    // Use products[0], products[1], etc.
    const o1 = await upsertOrder({
      userId: seededUsers.customer1._id,
      items: [{ productId: products[0]._id, name: products[0].name, price: products[0].price, quantity: 1 }],
      address: { name: 'Customer One', phone: seededUsers.customer1.mobile, addressLine: 'Street 1', city: 'City', state: 'State', pincode: '500001' },
      paymentMethod: 'COD',
      status: 'PENDING',
    });
    await upsertPayment({ orderId: o1._id, userId: seededUsers.customer1._id, amount: o1.totalAmount, status: 'INITIATED', method: 'COD' });

    const o2 = await upsertOrder({
      userId: seededUsers.customer2._id,
      items: [{ productId: products[1]._id, name: products[1].name, price: products[1].price, quantity: 2 }],
      address: { name: 'Customer Two', phone: seededUsers.customer2.mobile, addressLine: 'Street 2', city: 'City', state: 'State', pincode: '500002' },
      paymentMethod: 'RAZORPAY',
      status: 'CONFIRMED',
    });
    await upsertPayment({ orderId: o2._id, userId: seededUsers.customer2._id, amount: o2.totalAmount, status: 'SUCCESS', method: 'ONLINE', metadata: { razorpayPaymentId: 'rzp_success_1' } });
    await upsertInvoice({ orderId: o2._id, amount: o2.totalAmount, issuedTo: seededUsers.customer2._id });
    await upsertLogistics({ orderId: o2._id, assignedTo: seededUsers.delivery1._id, status: 'ASSIGNED' });

    const o3 = await upsertOrder({
      userId: seededUsers.customer3._id,
      items: [{ productId: products[2]._id, name: products[2].name, price: products[2].price, quantity: 1 }],
      address: { name: 'Customer Three', phone: seededUsers.customer3.mobile, addressLine: 'Street 3', city: 'City', state: 'State', pincode: '500003' },
      paymentMethod: 'RAZORPAY',
      status: 'SHIPPED',
    });
    await upsertPayment({ orderId: o3._id, userId: seededUsers.customer3._id, amount: o3.totalAmount, status: 'FAILED', method: 'ONLINE', metadata: { razorpayPaymentId: 'rzp_failed_1' } });
    await upsertLogistics({ orderId: o3._id, assignedTo: seededUsers.delivery2._id, status: 'IN_TRANSIT' });

    const o4 = await upsertOrder({
      userId: seededUsers.customer1._id,
      items: [{ productId: products[3]._id, name: products[3].name, price: products[3].price, quantity: 4 }],
      address: { name: 'Customer One', phone: seededUsers.customer1.mobile, addressLine: 'Street 1', city: 'City', state: 'State', pincode: '500001' },
      paymentMethod: 'ONLINE',
      status: 'DELIVERED',
    });
    await upsertPayment({ orderId: o4._id, userId: seededUsers.customer1._id, amount: o4.totalAmount, status: 'SUCCESS', method: 'ONLINE', metadata: { razorpayPaymentId: 'rzp_success_2' } });
    await upsertInvoice({ orderId: o4._id, amount: o4.totalAmount, issuedTo: seededUsers.customer1._id });

    const o5 = await upsertOrder({
      userId: seededUsers.customer2._id,
      items: [{ productId: products[4]._id, name: products[4].name, price: products[4].price, quantity: 1 }],
      address: { name: 'Customer Two', phone: seededUsers.customer2.mobile, addressLine: 'Street 2', city: 'City', state: 'State', pincode: '500002' },
      paymentMethod: 'COD',
      status: 'CANCELLED',
    });
    await upsertPayment({ orderId: o5._id, userId: seededUsers.customer2._id, amount: o5.totalAmount, status: 'INITIATED', method: 'COD' });

    logger.info('QA seed completed successfully.');
    process.exit(0);

    logger.info('QA seed completed successfully.');
    process.exit(0);
  } catch (err) {
    logger.error('QA seed failed:', err);
    process.exit(2);
  }
}

main();

