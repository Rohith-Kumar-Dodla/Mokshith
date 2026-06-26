import mongoose from 'mongoose';
import User from '../../src/modules/user/user.model.js';
import Category from '../../src/modules/category/category.model.js';
import Product from '../../src/modules/product/product.model.js';
import Warehouse from '../../src/modules/warehouse/warehouse.model.js';
import Inventory from '../../src/modules/inventory/inventory.model.js';
import Order from '../../src/modules/order/order.model.js';
import Payment from '../../src/modules/payment/payment.model.js';
import Vendor from '../../src/modules/vendor/vendor.model.js';
import Company from '../../src/modules/company/company.model.js';
import RefreshToken from '../../src/models/RefreshToken.model.js';
import { hashPassword } from '../../src/utils/hashPassword.js';
import { generateAccessToken, generateRefreshToken } from '../../src/modules/auth/auth.token.js';
import { generateCsrfToken } from '../../src/middlewares/csrf.middleware.js';
import { generateTestUser, generateTestProduct, generateTestOrder } from './testUtils.js';
import { ROLES } from '../../src/constants/roles.js';
import { USER_STATUS } from '../../src/constants/userStatus.js';
import { ORDER_STATUS } from '../../src/constants/orderStatus.js';
import { PAYMENT_STATUS } from '../../src/constants/paymentStatus.js';

export const DEFAULT_PASSWORD = 'Test@1234';

let mobileCounter = 0;
const nextMobile = () => `98765${String(++mobileCounter).padStart(5, '0')}`;

/**
 * Session-aligned user + JWT (matches auth.middleware activeSessionId checks).
 */
export async function seedActiveUser(overrides = {}) {
  const sessionId = overrides.sessionId || `test-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const hashedPassword = await hashPassword(overrides.password || DEFAULT_PASSWORD);
  const userData = generateTestUser({
    email: overrides.email || `user-${Date.now()}@test.com`,
    mobile: overrides.mobile || nextMobile(),
    ...overrides.user,
  });
  delete userData.password;

  const user = await User.create({
    ...userData,
    password: hashedPassword,
    role: overrides.role || ROLES.B2B_CUSTOMER,
    status: overrides.status || USER_STATUS.ACTIVE,
    activeSessionId: sessionId,
  });

  const accessToken = generateAccessToken(user);
  const csrfToken = generateCsrfToken();

  return {
    user,
    accessToken,
    csrfToken,
    password: overrides.password || DEFAULT_PASSWORD,
    sessionId,
  };
}

export async function seedAdminUser(overrides = {}) {
  return seedActiveUser({
    role: ROLES.ADMIN,
    email: overrides.email || `admin-${Date.now()}@test.com`,
    ...overrides,
  });
}

export async function seedSuperAdminUser(overrides = {}) {
  return seedActiveUser({
    role: ROLES.SUPER_ADMIN,
    email: overrides.email || `superadmin-${Date.now()}@test.com`,
    ...overrides,
  });
}

export async function seedVendorUser(overrides = {}) {
  const session = await seedActiveUser({
    role: ROLES.VENDOR,
    email: overrides.email || `vendor-${Date.now()}@test.com`,
    ...overrides,
  });

  const company = await Company.create({
    name: overrides.companyName || 'Test Vendor Co',
    email: session.user.email,
    phone: session.user.mobile,
    isActive: true,
  });

  const vendor = await Vendor.create({
    name: overrides.vendorName || 'Test Vendor',
    companyId: company._id,
    userId: session.user._id,
    isActive: true,
  });

  return { ...session, company, vendor };
}

export async function seedDeliveryPartner(overrides = {}) {
  return seedActiveUser({
    role: ROLES.DELIVERY_PARTNER,
    email: overrides.email || `delivery-${Date.now()}@test.com`,
    ...overrides,
  });
}

export async function seedRefreshToken(userId, overrides = {}) {
  const tokenValue = overrides.token || `${generateRefreshToken({ _id: userId })}.${Date.now().toString(16)}`;
  const doc = await RefreshToken.create({
    userId,
    token: tokenValue,
    family: overrides.family || `family-${Date.now()}`,
    expiresAt: overrides.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ipAddress: overrides.ipAddress || '127.0.0.1',
    deviceInfo: overrides.deviceInfo || { browser: 'Chrome', os: 'Windows' },
  });
  return { token: tokenValue, doc };
}

export async function seedCategory(overrides = {}) {
  const slug = overrides.slug || `category-${Date.now()}`;
  return Category.create({
    name: overrides.name || 'Test Category',
    slug,
    isActive: true,
    ...overrides,
  });
}

export async function seedProduct(categoryId, overrides = {}) {
  return Product.create({
    ...generateTestProduct({ categoryId, ...overrides }),
    isActive: overrides.isActive ?? true,
  });
}

export async function seedWarehouse(overrides = {}) {
  return Warehouse.create({
    name: overrides.name || 'Main Warehouse',
    capacity: overrides.capacity || 10000,
    location: overrides.location || 'Test City',
    isActive: true,
    ...overrides,
  });
}

export async function seedInventory({ productId, warehouseId, stock = 100, reservedStock = 0 }) {
  return Inventory.create({
    productId,
    warehouseId,
    stock,
    reservedStock,
    soldStock: 0,
  });
}

/**
 * Catalog bundle: customer + category + product + warehouse + inventory.
 */
export async function seedCustomerCatalogFixture(overrides = {}) {
  const session = await seedActiveUser({
    email: overrides.email || 'catalog-user@test.com',
    mobile: overrides.mobile || '9876512345',
    ...overrides.user,
  });
  const category = await seedCategory({ slug: overrides.slug || `catalog-${Date.now()}` });
  const product = await seedProduct(category._id, {
    name: 'Catalog Product',
    moq: 10,
    minOrderQty: 10,
    stock: 100,
    price: 1000,
    ...overrides.product,
  });
  const warehouse = await seedWarehouse(overrides.warehouse);
  await seedInventory({ productId: product._id, warehouseId: warehouse._id, stock: overrides.stock ?? 100 });

  return { ...session, category, product, warehouse };
}

/** Resolve populated or raw category id from API response. */
export function resolveCategoryId(categoryId) {
  if (!categoryId) return categoryId;
  return categoryId._id?.toString?.() ?? categoryId.toString();
}

const DEFAULT_SHIPPING_ADDRESS = {
  name: 'John Doe',
  phone: '9876543210',
  addressLine: '123 Test Street',
  city: 'Test City',
  state: 'Test State',
  pincode: '123456',
};

/**
 * Role sessions: admin, customer, vendor (session-aligned JWT + CSRF).
 */
export async function seedRoleSessions(overrides = {}) {
  const admin = await seedAdminUser({
    email: 'admin@test.com',
    mobile: '9876543210',
    password: 'Admin@1234',
    ...overrides.admin,
  });
  const customer = await seedActiveUser({
    email: 'customer@test.com',
    mobile: '9876543211',
    password: 'Admin@1234',
    ...overrides.customer,
  });
  const vendor = await seedVendorUser({
    email: 'vendor@test.com',
    mobile: '9876543212',
    password: 'Admin@1234',
    ...overrides.vendor,
  });
  return { admin, customer, vendor };
}

/**
 * B2B catalog: category + two products + warehouse + inventory rows.
 */
export async function seedB2BCatalogFixture(overrides = {}) {
  const category = await seedCategory({
    name: 'Test Category',
    slug: overrides.slug || `catalog-${Date.now()}`,
    ...overrides.category,
  });
  const warehouse = await seedWarehouse(overrides.warehouse);

  const product1 = await seedProduct(category._id, {
    name: 'Test Product 1',
    price: 1000,
    stock: 100,
    moq: 10,
    minOrderQty: 10,
    ...overrides.product1,
  });
  const product2 = await seedProduct(category._id, {
    name: 'Test Product 2',
    price: 2000,
    stock: 50,
    moq: 5,
    minOrderQty: 5,
    ...overrides.product2,
  });

  await seedInventory({
    productId: product1._id,
    warehouseId: warehouse._id,
    stock: overrides.stock1 ?? 100,
  });
  await seedInventory({
    productId: product2._id,
    warehouseId: warehouse._id,
    stock: overrides.stock2 ?? 50,
  });

  return { category, warehouse, product1, product2, products: [product1, product2] };
}

/**
 * Customer + full catalog for cart/checkout/order flows.
 */
export async function seedCheckoutFixture(overrides = {}) {
  const customer = await seedActiveUser({
    email: overrides.email || 'checkout-user@test.com',
    mobile: overrides.mobile || '9876543213',
    ...overrides.user,
  });
  const catalog = await seedB2BCatalogFixture(overrides.catalog);
  return {
    ...customer,
    ...catalog,
    validShippingAddress: { ...DEFAULT_SHIPPING_ADDRESS, ...overrides.shippingAddress },
  };
}

/**
 * Admin + catalog for inventory management tests.
 */
export async function seedInventoryAdminFixture(overrides = {}) {
  const admin = await seedAdminUser({
    email: 'admin@test.com',
    mobile: '9876543210',
    password: 'Admin@1234',
  });
  const catalog = await seedB2BCatalogFixture(overrides.catalog);
  return { ...admin, ...catalog };
}

export async function seedConfirmedOrder(userId, catalog, overrides = {}) {
  return Order.create({
    userId,
    items: [
      {
        productId: catalog.product1._id,
        name: catalog.product1.name,
        price: catalog.product1.price,
        quantity: 10,
      },
    ],
    totalAmount: computeExpectedOrderTotal(catalog.product1.price, 10),
    paymentMethod: 'COD',
    address: DEFAULT_SHIPPING_ADDRESS,
    shippingAddress: DEFAULT_SHIPPING_ADDRESS,
    status: ORDER_STATUS.CONFIRMED,
    paymentStatus: PAYMENT_STATUS.PENDING,
    ...overrides,
  });
}

export { DEFAULT_SHIPPING_ADDRESS };

export async function seedPendingOrder(userId, overrides = {}) {
  return Order.create({
    ...generateTestOrder({ userId, ...overrides }),
    userId,
    status: ORDER_STATUS.CREATED,
    paymentStatus: PAYMENT_STATUS.PENDING,
    ...overrides,
  });
}

export async function seedPaidOrder(userId, overrides = {}) {
  return Order.create({
    ...generateTestOrder({ userId, totalAmount: 5000, ...overrides }),
    userId,
    paymentStatus: PAYMENT_STATUS.PAID,
    status: ORDER_STATUS.CONFIRMED,
    paymentMethod: 'ONLINE',
    ...overrides,
  });
}

export async function seedPaymentRecord({ orderId, userId, overrides = {} }) {
  return Payment.create({
    orderId,
    userId,
    amount: overrides.amount ?? 5000,
    status: overrides.status ?? 'SUCCESS',
    paymentMethod: overrides.paymentMethod ?? 'ONLINE',
    razorpayPaymentId: overrides.razorpayPaymentId ?? `pay_${Date.now()}`,
    transactionId: overrides.transactionId ?? `txn_${Date.now()}`,
    ...overrides,
  });
}

/**
 * Paid order + payment for refund integration tests.
 */
export async function seedPaidOrderWithPayment(overrides = {}) {
  const session = await seedActiveUser(overrides.user);
  const order = await seedPaidOrder(session.user._id, overrides.order);
  const payment = await seedPaymentRecord({
    orderId: order._id,
    userId: session.user._id,
    amount: order.totalAmount,
    ...overrides.payment,
  });
  return { ...session, order, payment };
}

/**
 * Compute expected order total matching order.service.js (bulk discount + 18% GST).
 */
export function computeExpectedOrderTotal(unitPrice, quantity) {
  let discountPercent = 0;
  if (quantity >= 20) discountPercent = 20;
  else if (quantity >= 15) discountPercent = 15;
  else if (quantity >= 10) discountPercent = 10;
  else if (quantity >= 5) discountPercent = 5;

  const subtotal = unitPrice * quantity;
  const afterDiscount = subtotal - subtotal * (discountPercent / 100);
  return Math.round(afterDiscount * 1.18);
}

/** Multi-line order total matching order.service.js pricing. */
export function computeExpectedOrderTotalForItems(items) {
  let subtotal = 0;
  for (const { unitPrice, quantity } of items) {
    let discountPercent = 0;
    if (quantity >= 20) discountPercent = 20;
    else if (quantity >= 15) discountPercent = 15;
    else if (quantity >= 10) discountPercent = 10;
    else if (quantity >= 5) discountPercent = 5;
    const line = unitPrice * quantity;
    subtotal += line - line * (discountPercent / 100);
  }
  return Math.round(subtotal * 1.18);
}

export default {
  DEFAULT_PASSWORD,
  seedActiveUser,
  seedAdminUser,
  seedSuperAdminUser,
  seedVendorUser,
  seedDeliveryPartner,
  seedRefreshToken,
  seedCategory,
  seedProduct,
  seedWarehouse,
  seedInventory,
  seedCustomerCatalogFixture,
  seedRoleSessions,
  seedB2BCatalogFixture,
  seedCheckoutFixture,
  seedInventoryAdminFixture,
  seedConfirmedOrder,
  resolveCategoryId,
  DEFAULT_SHIPPING_ADDRESS,
  seedPendingOrder,
  seedPaidOrder,
  seedPaymentRecord,
  seedPaidOrderWithPayment,
  computeExpectedOrderTotal,
  computeExpectedOrderTotalForItems,
};
