const now = new Date();
const daysAgo = (d) => new Date(now.getTime() - d * 86400000).toISOString();

export let mockAuditLogs = [
  { _id: 'audit-1', userId: { _id: 'u1', name: 'Rajesh Kumar', email: 'rajesh@mokshith.com' }, userEmail: 'rajesh@mokshith.com', role: 'ADMIN', action: 'USER_CREATED', entity: 'User', entityId: 'u99', details: 'Created new B2B customer account', data: {}, ip: '192.168.1.10', severity: 'INFO', createdAt: daysAgo(1) },
  { _id: 'audit-2', userId: { _id: 'u2', name: 'Priya Sharma', email: 'priya@mokshith.com' }, userEmail: 'priya@mokshith.com', role: 'SUPER_ADMIN', action: 'CONFIG_UPDATED', entity: 'Settings', entityId: 'cfg-1', details: 'Updated platform commission rate', data: { field: 'commission' }, ip: '10.0.0.5', severity: 'WARNING', createdAt: daysAgo(2) },
  { _id: 'audit-3', userId: { _id: 'u3', name: 'System', email: 'system@mokshith.com' }, userEmail: 'system@mokshith.com', role: 'SYSTEM', action: 'LOGIN_FAILED', entity: 'Auth', entityId: 'auth-1', details: 'Multiple failed login attempts detected', data: {}, ip: '45.33.12.8', severity: 'CRITICAL', createdAt: daysAgo(0) },
  { _id: 'audit-4', userId: { _id: 'u1', name: 'Rajesh Kumar', email: 'rajesh@mokshith.com' }, userEmail: 'rajesh@mokshith.com', role: 'ADMIN', action: 'ORDER_UPDATED', entity: 'Order', entityId: 'ord-101', details: 'Order status changed to SHIPPED', data: {}, ip: '192.168.1.10', severity: 'INFO', createdAt: daysAgo(3) },
  { _id: 'audit-5', userId: { _id: 'u4', name: 'Amit Patel', email: 'amit@vendor.com' }, userEmail: 'amit@vendor.com', role: 'VENDOR', action: 'PRODUCT_DELETED', entity: 'Product', entityId: 'prod-55', details: 'Removed discontinued product listing', data: {}, ip: '172.16.0.22', severity: 'WARNING', createdAt: daysAgo(5) },
];

export let mockWarehouses = [
  { _id: 'wh-1', name: 'Bangalore North Hub', location: { address: 'Plot 12, Industrial Area', city: 'Bangalore', state: 'Karnataka', country: 'India', pincode: '560001' }, city: 'Bangalore', state: 'Karnataka', isActive: true, capacity: 50000, currentLoad: 32500, createdAt: daysAgo(30) },
  { _id: 'wh-2', name: 'Hyderabad Central', location: { address: 'Sector 5, HITEC City', city: 'Hyderabad', state: 'Telangana', country: 'India', pincode: '500081' }, city: 'Hyderabad', state: 'Telangana', isActive: true, capacity: 35000, currentLoad: 28000, createdAt: daysAgo(20) },
  { _id: 'wh-3', name: 'Chennai Port Warehouse', location: { address: 'Port Road, Ennore', city: 'Chennai', state: 'Tamil Nadu', country: 'India', pincode: '600057' }, city: 'Chennai', state: 'Tamil Nadu', isActive: true, capacity: 40000, currentLoad: 12000, createdAt: daysAgo(15) },
];

export let mockShipments = [
  { _id: 'ship-001', orderId: 'ord-101', warehouseId: 'wh-1', status: 'OUT_FOR_DELIVERY', trackingNumber: 'TRK-ME-2024-001', trackingId: 'TRK-ME-2024-001', carrierName: 'Mokshith Express', customerName: 'GreenMart Traders', shippingAddress: { street: '42 MG Road', city: 'Bangalore', state: 'Karnataka' }, estimatedDeliveryDate: 'Tomorrow, 4:00 PM', orderDate: daysAgo(3), packedDate: daysAgo(2), shippedDate: daysAgo(1), outForDeliveryDate: daysAgo(0), items: [{ name: 'Sona Masoori Rice 25kg', quantity: 10, price: 1150 }], totalValue: 11500, createdAt: daysAgo(3) },
  { _id: 'ship-002', orderId: 'ord-102', warehouseId: 'wh-2', status: 'SHIPPED', trackingNumber: 'TRK-ME-2024-002', trackingId: 'TRK-ME-2024-002', carrierName: 'Mokshith Express', customerName: 'Spice World Pvt Ltd', shippingAddress: '15 Commercial St, Hyderabad', estimatedDeliveryDate: 'Dec 15, 2024', orderDate: daysAgo(2), packedDate: daysAgo(1), shippedDate: daysAgo(0), items: [{ name: 'Toor Dal Premium 1kg', quantity: 50, price: 145 }], totalValue: 7250, createdAt: daysAgo(2) },
];

export let mockNotifications = [
  { _id: 'notif-1', id: 'notif-1', userId: 'u1', title: 'Order Shipped', message: 'Your order #ORD-101 has been shipped and is on its way.', type: 'ORDER', isRead: false, read: false, createdAt: daysAgo(0) },
  { _id: 'notif-2', id: 'notif-2', userId: 'u1', title: 'Payment Received', message: 'Payment of ₹21,368 received for order #ORD-099.', type: 'PAYMENT', isRead: false, read: false, createdAt: daysAgo(1) },
  { _id: 'notif-3', id: 'notif-3', userId: 'u1', title: 'Credit Limit Updated', message: 'Your credit limit has been increased to ₹1,00,000.', type: 'SYSTEM', isRead: true, read: true, createdAt: daysAgo(3) },
  { _id: 'notif-4', id: 'notif-4', userId: 'u1', title: 'New Promotion Available', message: 'Use code SAVE10 for 10% off on bulk orders.', type: 'SYSTEM', isRead: true, read: true, createdAt: daysAgo(5) },
];

export const mockSearchProducts = [
  { _id: 'prod-1', id: 'prod-1', name: 'Sona Masoori Rice 25kg', description: 'Premium quality rice', price: 1150, stock: 500, categoryId: { name: 'Rice & Grains' }, vendorId: { name: 'Grain Masters' }, imageUrl: '' },
  { _id: 'prod-2', id: 'prod-2', name: 'Toor Dal Premium 1kg', description: 'High protein toor dal', price: 145, stock: 1000, categoryId: { name: 'Pulses' }, vendorId: { name: 'Pulse Traders' }, imageUrl: '' },
  { _id: 'prod-3', id: 'prod-3', name: 'Sunflower Oil 15L', description: 'Refined sunflower oil', price: 1770, stock: 200, categoryId: { name: 'Oils' }, vendorId: { name: 'Oil Distributors' }, imageUrl: '' },
];

export const mockSearchVendors = [
  { _id: 'vendor-1', id: 'vendor-1', name: 'Grain Masters', companyName: 'Grain Masters Pvt Ltd', city: 'Bangalore', productCount: 45, rating: 4.8 },
  { _id: 'vendor-2', id: 'vendor-2', name: 'Pulse Traders', companyName: 'Pulse Traders India', city: 'Hyderabad', productCount: 32, rating: 4.5 },
];

export const mockSearchOrders = [
  { _id: 'ord-101', id: 'ord-101', orderNumber: 'ORD-2024-101', status: 'SHIPPED', totalAmount: 21368, customerName: 'GreenMart Traders', createdAt: daysAgo(3) },
  { _id: 'ord-102', id: 'ord-102', orderNumber: 'ORD-2024-102', status: 'PENDING', totalAmount: 8500, customerName: 'Spice World', createdAt: daysAgo(1) },
];

export let mockPromotions = [
  { _id: 'promo-1', code: 'SAVE10', discountType: 'PERCENTAGE', value: 10, maxDiscount: 500, isActive: true, expiresAt: daysAgo(-30) },
  { _id: 'promo-2', code: 'FLAT500', discountType: 'FLAT', value: 500, maxDiscount: null, isActive: true, expiresAt: daysAgo(-60) },
  { _id: 'promo-3', code: 'BULK20', discountType: 'PERCENTAGE', value: 20, maxDiscount: 2000, isActive: false, expiresAt: daysAgo(10) },
];

export let mockReviews = [
  { _id: 'rev-1', userId: { _id: 'u10', name: 'Suresh Reddy' }, productId: 'prod-1', productName: 'Sona Masoori Rice 25kg', rating: 5, comment: 'Excellent quality rice, consistent supply.', createdAt: daysAgo(2) },
  { _id: 'rev-2', userId: { _id: 'u11', name: 'Lakshmi Devi' }, productId: 'prod-1', productName: 'Sona Masoori Rice 25kg', rating: 4, comment: 'Good product, delivery was on time.', createdAt: daysAgo(5) },
  { _id: 'rev-3', userId: { _id: 'u12', name: 'Mohammed Ali' }, productId: 'prod-2', productName: 'Toor Dal Premium 1kg', rating: 3, comment: 'Average quality, packaging could be better.', createdAt: daysAgo(7) },
  { _id: 'rev-4', userId: { _id: 'u13', name: 'Anita Verma' }, productId: 'prod-3', productName: 'Sunflower Oil 15L', rating: 5, comment: 'Best oil for commercial kitchens.', createdAt: daysAgo(1) },
];

export let mockCreditAccount = {
  _id: 'credit-1', userId: 'vendor-1', creditLimit: 500000, usedCredit: 185000, availableCredit: 315000, status: 'ACTIVE', utilizationPercent: 37,
};

export let mockCreditLedger = [
  { _id: 'cl-1', userId: 'vendor-1', type: 'DEBIT', amount: 25000, description: 'Order #ORD-101 credit usage', createdAt: daysAgo(1) },
  { _id: 'cl-2', userId: 'vendor-1', type: 'CREDIT', amount: 15000, description: 'Partial repayment received', createdAt: daysAgo(3) },
  { _id: 'cl-3', userId: 'vendor-1', type: 'DEBIT', amount: 45000, description: 'Order #ORD-098 credit usage', createdAt: daysAgo(7) },
  { _id: 'cl-4', userId: 'vendor-1', type: 'CREDIT', amount: 50000, description: 'Monthly credit repayment', createdAt: daysAgo(14) },
];

export let mockSupportTickets = [
  { _id: 'ticket-1', userId: { _id: 'u1', name: 'GreenMart Traders', email: 'contact@greenmart.com' }, subject: 'Delivery delay for Order #ORD-101', message: 'My order was supposed to arrive yesterday but has not been delivered yet.', status: 'OPEN', createdAt: daysAgo(0) },
  { _id: 'ticket-2', userId: { _id: 'u2', name: 'Spice World', email: 'help@spiceworld.com' }, subject: 'Invoice discrepancy', message: 'The GST amount on my last invoice does not match the order total.', status: 'IN_PROGRESS', createdAt: daysAgo(2) },
  { _id: 'ticket-3', userId: { _id: 'u3', name: 'Fresh Foods Co', email: 'support@freshfoods.com' }, subject: 'Credit limit increase request', message: 'We need to increase our credit limit to ₹2,00,000 for the festive season.', status: 'RESOLVED', createdAt: daysAgo(5) },
];

export let mockLogisticsQueue = [
  { _id: 'log-1', orderId: { _id: 'ord-201' }, warehouseId: { name: 'Bangalore North Hub' }, status: 'PENDING', address: '42 MG Road, Bangalore', customerName: 'GreenMart Traders', phone: '9876543210', trackingNumber: 'TRK-ME-2024-201', etaMinutes: 45, createdAt: daysAgo(0) },
  { _id: 'log-2', orderId: { _id: 'ord-202' }, warehouseId: { name: 'Hyderabad Central' }, deliveryPartnerId: { name: 'Ravi Kumar' }, status: 'ACCEPTED', address: '15 Commercial St, Hyderabad', customerName: 'Spice World', phone: '9876543211', trackingNumber: 'TRK-ME-2024-202', etaMinutes: 30, createdAt: daysAgo(0) },
  { _id: 'log-3', orderId: { _id: 'ord-203' }, warehouseId: { name: 'Chennai Port' }, deliveryPartnerId: { name: 'Senthil M' }, status: 'OUT_FOR_DELIVERY', address: '88 Anna Salai, Chennai', customerName: 'Fresh Foods', phone: '9876543212', trackingNumber: 'TRK-ME-2024-203', etaMinutes: 15, createdAt: daysAgo(1) },
];

export let mockLogisticsHistory = [
  { _id: 'log-h1', orderId: { _id: 'ord-199' }, status: 'DELIVERED', address: '10 Park St, Kolkata', customerName: 'Metro Stores', deliveredAt: daysAgo(0), createdAt: daysAgo(1) },
  { _id: 'log-h2', orderId: { _id: 'ord-198' }, status: 'DELIVERED', address: '5 FC Road, Pune', customerName: 'Daily Needs', deliveredAt: daysAgo(1), createdAt: daysAgo(2) },
];

export const mockHealthData = {
  status: 'healthy',
  timestamp: now.toISOString(),
  uptime: 864000,
  environment: 'development',
  version: '1.0.0',
  checks: {
    database: { status: 'healthy', responseTime: 12, latencyMs: 12 },
    redis: { status: 'healthy', responseTime: 3, connected: true },
    memory: { status: 'healthy', heapUsage: 45, heapUsed: '128MB', heapTotal: '256MB' },
    queues: { status: 'healthy', enabled: true, totalWorkers: 4 },
    disk: { status: 'healthy', message: 'Disk space adequate' },
  },
};

export const mockMetricsData = {
  timestamp: now.toISOString(),
  uptime: '10d 0h',
  uptimeSeconds: 864000,
  memory: { heapUsed: '128MB', heapTotal: '256MB', rss: '312MB', heapUsagePercent: 45 },
  database: { status: 'connected', connections: 12, cacheHitRate: 94.5 },
  cache: { status: 'connected', cacheHitRate: 94.5 },
  application: { totalRequests: 125000, totalErrors: 42, errorRate: 0.03 },
};

export const mockAlerts = [
  { level: 'warning', type: 'memory', message: 'Heap usage approaching 50% threshold', threshold: '50%' },
];

export const mockBusinessMetrics = {
  totalUsers: 1250,
  activeVendors: 89,
  ordersToday: 156,
  revenueToday: 2450000,
  pendingApprovals: 12,
};
