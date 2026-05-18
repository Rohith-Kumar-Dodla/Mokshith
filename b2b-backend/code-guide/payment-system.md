# Payment System

> **Complete guide to payment processing, Razorpay integration, and transaction handling**

---

## Table of Contents

- [Payment System Overview](#payment-system-overview)
- [Razorpay Integration](#razorpay-integration)
- [Payment Flow](#payment-flow)
- [Webhook Handling](#webhook-handling)
- [Payment Status Management](#payment-status-management)
- [Refund Processing](#refund-processing)
- [Credit System (B2B)](#credit-system-b2b)
- [Payment Security](#payment-security)
- [Idempotency](#idempotency)
- [Payment Reconciliation](#payment-reconciliation)

---

## Payment System Overview

### Architecture

```
Order Created → Payment Initiated → Razorpay Checkout → User Pays
                                                            ↓
                                                    Razorpay Webhook
                                                            ↓
                                        Signature Verification (HMAC-SHA256)
                                                            ↓
                                            Update Payment Status
                                                            ↓
                                            Update Order Status
                                                            ↓
                                        Generate Invoice + Notifications
```

### Payment Models

**Payment Model Fields:**
```javascript
{
  orderId: ObjectId,              // Reference to order
  userId: ObjectId,               // User who paid
  amount: Number,                 // Amount in paise (₹1 = 100 paise)
  currency: String,               // INR
  paymentStatus: String,          // PENDING | SUCCESS | FAILED
  razorpayOrderId: String,        // Razorpay order ID
  razorpayPaymentId: String,      // Razorpay payment ID
  razorpaySignature: String,      // Webhook signature
  paymentMethod: String,          // card | upi | netbanking | wallet
  failureReason: String,          // Error message if failed
  metadata: Object,               // Additional payment info
  createdAt: Date,
  updatedAt: Date
}
```

---

## Razorpay Integration

### Setup

**File:** `src/config/razorpay.js`

```javascript
import Razorpay from 'razorpay';

export const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});
```

**Environment Variables:**
```bash
RAZORPAY_KEY_ID=rzp_test_xxxxx           # Test key
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx     # Test secret

# Production keys (never commit)
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
```

### Payment Gateway Service

**File:** `src/modules/payment/payment.gateway.js`

```javascript
import { razorpayInstance } from '../../config/razorpay.js';
import crypto from 'crypto';

// Create Razorpay order
export const createRazorpayOrder = async (amount, currency = 'INR') => {
  const options = {
    amount: amount * 100, // Convert to paise
    currency,
    receipt: `receipt_${Date.now()}`,
    payment_capture: 1 // Auto-capture payment
  };

  const order = await razorpayInstance.orders.create(options);
  return order;
};

// Verify payment signature
export const verifyPaymentSignature = (
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature
) => {
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return generatedSignature === razorpaySignature;
};

// Fetch payment details
export const fetchPayment = async (paymentId) => {
  return await razorpayInstance.payments.fetch(paymentId);
};

// Create refund
export const createRefund = async (paymentId, amount) => {
  return await razorpayInstance.payments.refund(paymentId, {
    amount: amount * 100 // Convert to paise
  });
};
```

---

## Payment Flow

### Complete Order + Payment Flow

```
1. USER PLACES ORDER
   POST /api/v1/orders
   Body: { items: [...], shippingAddress: {...} }
   ↓
2. ORDER CONTROLLER
   → Create order with status: PENDING
   → Calculate total amount
   → Create payment record (status: PENDING)
   ↓
3. CREATE RAZORPAY ORDER
   → Call razorpayInstance.orders.create()
   → Get Razorpay order ID
   → Store in payment record
   ↓
4. RETURN TO CLIENT
   Response: {
     orderId: "order123",
     amount: 50000,
     razorpayOrderId: "order_Xxxx",
     razorpayKeyId: "rzp_test_xxxx"
   }
   ↓
5. FRONTEND INITIATES RAZORPAY CHECKOUT
   → Load Razorpay Checkout.js
   → Open payment modal with order details
   ↓
6. USER COMPLETES PAYMENT ON RAZORPAY
   → Enters card/UPI/netbanking details
   → Razorpay processes payment
   ↓
7. RAZORPAY SENDS WEBHOOK
   POST /api/v1/payments/webhook
   Headers: { x-razorpay-signature: "..." }
   Body: {
     event: "payment.authorized",
     payload: {
       payment: { id, order_id, amount, status, method }
     }
   }
   ↓
8. BACKEND RECEIVES WEBHOOK
   → payment.webhook.js
   ↓
9. VERIFY WEBHOOK SIGNATURE
   → Extract signature from header
   → Generate HMAC-SHA256 hash
   → Compare signatures
   → If invalid → Return 400
   ↓
10. PROCESS PAYMENT UPDATE
    → Find payment by razorpayOrderId
    → Check idempotency (prevent duplicate processing)
    → Acquire distributed lock: "lock:payment:order123"
    → Update payment status: PENDING → SUCCESS
    → Update razorpayPaymentId, paymentMethod
    → Update order status: PENDING → PAID
    → Release lock
    ↓
11. EMIT DOMAIN EVENTS (Async Jobs)
    → Queue: Generate invoice PDF
    → Queue: Send payment confirmation email
    → Queue: Send notification to vendor
    → Queue: Update analytics
    → Queue: Log audit event
    ↓
12. RETURN 200 OK TO RAZORPAY
    → Acknowledge webhook receipt
    ↓
13. BACKGROUND WORKERS PROCESS JOBS
    → Email sent
    → Invoice generated
    → Vendor notified
    → Analytics updated
```

---

## Webhook Handling

### Webhook Security

**File:** `src/modules/payment/payment.webhook.js`

```javascript
import crypto from 'crypto';
import { AppError } from '../../errors/AppError.js';

export const handleWebhook = async (req, res, next) => {
  try {
    // 1. Extract signature
    const receivedSignature = req.headers['x-razorpay-signature'];

    if (!receivedSignature) {
      throw new AppError('Missing webhook signature', 400);
    }

    // 2. Generate expected signature
    const webhookBody = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(webhookBody)
      .digest('hex');

    // 3. Verify signature
    if (receivedSignature !== expectedSignature) {
      throw new AppError('Invalid webhook signature', 400);
    }

    // 4. Extract event data
    const { event, payload } = req.body;

    // 5. Handle event
    switch (event) {
      case 'payment.authorized':
        await handlePaymentAuthorized(payload.payment.entity);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload.payment.entity);
        break;

      case 'refund.created':
        await handleRefundCreated(payload.refund.entity);
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    // 6. Acknowledge receipt
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
```

### Payment Authorized Handler

```javascript
const handlePaymentAuthorized = async (paymentData) => {
  const { id: razorpayPaymentId, order_id: razorpayOrderId, amount, method } = paymentData;

  // 1. Find payment record
  const payment = await Payment.findOne({ razorpayOrderId });

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  // 2. Check idempotency (prevent duplicate processing)
  if (payment.paymentStatus === 'SUCCESS') {
    console.log('Payment already processed');
    return;
  }

  // 3. Acquire distributed lock
  const lockKey = `lock:payment:${payment.orderId}`;
  const lock = await redisClient.set(lockKey, 'locked', 'EX', 10, 'NX');

  if (!lock) {
    throw new AppError('Payment processing in progress', 409);
  }

  try {
    // 4. Update payment record
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.paymentStatus = 'SUCCESS';
    payment.paymentMethod = method;
    payment.updatedAt = Date.now();
    await payment.save();

    // 5. Update order status
    const order = await Order.findById(payment.orderId);
    order.status = 'PAID';
    order.paidAt = Date.now();
    await order.save();

    // 6. Emit events
    await notificationQueue.add('payment.success', {
      userId: order.userId,
      orderId: order._id,
      amount: payment.amount
    });

    await emailQueue.add('payment.confirmation', {
      userId: order.userId,
      orderId: order._id
    });

  } finally {
    // 7. Release lock
    await redisClient.del(lockKey);
  }
};
```

### Payment Failed Handler

```javascript
const handlePaymentFailed = async (paymentData) => {
  const { order_id: razorpayOrderId, error_code, error_description } = paymentData;

  const payment = await Payment.findOne({ razorpayOrderId });

  if (!payment) return;

  // Update payment status
  payment.paymentStatus = 'FAILED';
  payment.failureReason = `${error_code}: ${error_description}`;
  await payment.save();

  // Notify user
  await notificationQueue.add('payment.failed', {
    userId: payment.userId,
    orderId: payment.orderId,
    reason: payment.failureReason
  });
};
```

---

## Payment Status Management

### Status Flow

```
Order Created → Payment PENDING
                     ↓
           User Pays on Razorpay
                     ↓
              Webhook Received
                     ↓
        ┌─────────────┴──────────────┐
        ↓                            ↓
    SUCCESS                       FAILED
        ↓                            ↓
Order Status: PAID          Order Status: PENDING
        ↓                            ↓
Invoice Generated           Notify User + Retry
```

### Payment Statuses

| Status | Description | Order Impact |
|--------|-------------|--------------|
| `PENDING` | Payment initiated, awaiting completion | Order remains PENDING |
| `SUCCESS` | Payment successful | Order → PAID, proceed to fulfillment |
| `FAILED` | Payment failed | Order remains PENDING, allow retry |
| `REFUNDED` | Payment refunded | Order → REFUNDED/CANCELLED |

---

## Refund Processing

### Refund Flow

```
1. Admin/User initiates refund
   POST /api/v1/payments/:id/refund
   ↓
2. Validate refund eligibility
   - Payment status must be SUCCESS
   - Order not already refunded
   - Refund amount ≤ payment amount
   ↓
3. Create refund record
   {
     paymentId, orderId, userId,
     amount, reason, status: "PENDING"
   }
   ↓
4. Call Razorpay refund API
   razorpayInstance.payments.refund(paymentId, { amount })
   ↓
5. Razorpay processes refund (takes 5-7 business days)
   ↓
6. Razorpay sends webhook: refund.processed
   ↓
7. Update refund status: PENDING → SUCCESS
   ↓
8. Update payment status: SUCCESS → REFUNDED
   ↓
9. Update order status: PAID → REFUNDED
   ↓
10. Notify user + emit events
```

### Refund Implementation

**File:** `src/modules/payment/payment.service.js`

```javascript
export const processRefund = async (paymentId, amount, reason) => {
  // 1. Find payment
  const payment = await Payment.findById(paymentId);

  if (payment.paymentStatus !== 'SUCCESS') {
    throw new PaymentError('Can only refund successful payments', 400);
  }

  // 2. Validate amount
  if (amount > payment.amount) {
    throw new PaymentError('Refund amount exceeds payment amount', 400);
  }

  // 3. Create refund record
  const refund = await Refund.create({
    paymentId: payment._id,
    orderId: payment.orderId,
    userId: payment.userId,
    amount,
    reason,
    status: 'PENDING'
  });

  // 4. Call Razorpay API
  const razorpayRefund = await razorpayInstance.payments.refund(
    payment.razorpayPaymentId,
    { amount: amount * 100 }
  );

  // 5. Update refund with Razorpay ID
  refund.razorpayRefundId = razorpayRefund.id;
  await refund.save();

  // 6. Queue notification
  await notificationQueue.add('refund.initiated', {
    userId: payment.userId,
    refundId: refund._id,
    amount
  });

  return refund;
};
```

---

## Credit System (B2B)

### Credit-Based Payments

**Use Case:** B2B customers can buy on credit (net 30/60 days)

**Credit Model:**
```javascript
{
  userId: ObjectId,
  companyId: ObjectId,
  creditLimit: Number,         // Maximum credit allowed (₹)
  availableCredit: Number,     // Remaining credit
  usedCredit: Number,          // Current outstanding
  creditTerms: String,         // "NET_30" | "NET_60"
  status: String,              // ACTIVE | SUSPENDED | OVERDUE
  dueDate: Date,
  lastPaymentDate: Date
}
```

### Credit Payment Flow

```
1. B2B customer places order
   ↓
2. Check credit availability
   IF usedCredit + orderAmount <= creditLimit
   ↓
3. Deduct from available credit
   availableCredit -= orderAmount
   usedCredit += orderAmount
   ↓
4. Create payment record (type: CREDIT)
   paymentStatus: SUCCESS
   ↓
5. Create credit transaction
   {
     userId, orderId,
     type: "DEBIT",
     amount: orderAmount,
     dueDate: Date.now() + 30 days
   }
   ↓
6. Order proceeds to fulfillment
   ↓
7. Schedule credit reminder jobs
   - Reminder 7 days before due
   - Reminder on due date
   - Overdue notification after due date
```

### Credit Repayment

```
1. Customer makes payment
   POST /api/v1/credit/repay
   Body: { amount, paymentMethod }
   ↓
2. Process payment via Razorpay
   ↓
3. Update credit record
   usedCredit -= amount
   availableCredit += amount
   lastPaymentDate = Date.now()
   ↓
4. Clear overdue status if fully paid
```

---

## Payment Security

### 1. **Signature Verification**

**Every webhook is verified:**
```javascript
const signature = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(webhookBody)
  .digest('hex');

if (signature !== receivedSignature) {
  throw new Error('Invalid signature');
}
```

### 2. **HTTPS Enforcement**

Production webhooks must use HTTPS:
```javascript
if (process.env.NODE_ENV === 'production' && req.protocol !== 'https') {
  throw new Error('HTTPS required');
}
```

### 3. **Amount Validation**

**Server-side amount calculation:**
```javascript
// Never trust client-sent amount
const calculatedAmount = order.items.reduce((sum, item) => {
  return sum + (item.price * item.quantity);
}, 0);

if (paymentAmount !== calculatedAmount) {
  throw new Error('Amount mismatch');
}
```

### 4. **Rate Limiting**

**Payment endpoints have strict limits:**
```javascript
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Max 10 payment attempts per 15 minutes
  message: 'Too many payment attempts'
});
```

### 5. **PCI Compliance**

**We NEVER store:**
- Card numbers
- CVV
- Expiry dates

Razorpay handles all sensitive data.

---

## Idempotency

### Problem

Webhooks can be sent multiple times (network retries). We must prevent duplicate processing.

### Solution

**File:** `src/middlewares/idempotency.middleware.js`

```javascript
export const idempotencyMiddleware = async (req, res, next) => {
  const idempotencyKey = req.headers['x-idempotency-key'] || req.body.razorpayOrderId;

  if (!idempotencyKey) {
    return next();
  }

  // Check if request already processed
  const cached = await redisClient.get(`idempotency:${idempotencyKey}`);

  if (cached) {
    // Return cached response
    return res.status(200).json(JSON.parse(cached));
  }

  // Process request
  const originalSend = res.json;
  res.json = function (data) {
    // Cache response for 24 hours
    redisClient.setex(`idempotency:${idempotencyKey}`, 86400, JSON.stringify(data));
    originalSend.call(this, data);
  };

  next();
};
```

**Usage:**
```javascript
router.post(
  '/webhook',
  idempotencyMiddleware,
  paymentController.handleWebhook
);
```

---

## Payment Reconciliation

### Daily Reconciliation Job

**File:** `src/jobs/paymentReconcile.job.js`

```javascript
import cron from 'node-cron';

// Run daily at 2:00 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Running payment reconciliation job...');

  // 1. Fetch payments from last 24 hours
  const payments = await Payment.find({
    createdAt: { $gte: Date.now() - 86400000 },
    paymentStatus: { $in: ['PENDING', 'SUCCESS'] }
  });

  // 2. For each payment, verify with Razorpay
  for (const payment of payments) {
    try {
      const razorpayPayment = await razorpayInstance.payments.fetch(
        payment.razorpayPaymentId
      );

      // 3. Compare status
      const razorpayStatus = razorpayPayment.status === 'captured' ? 'SUCCESS' : 'FAILED';

      if (payment.paymentStatus !== razorpayStatus) {
        console.log(`Mismatch detected: ${payment._id}`);

        // 4. Update local record
        payment.paymentStatus = razorpayStatus;
        await payment.save();

        // 5. Alert ops team
        await notificationQueue.add('payment.mismatch', {
          paymentId: payment._id,
          localStatus: payment.paymentStatus,
          razorpayStatus
        });
      }
    } catch (error) {
      console.error(`Error reconciling payment ${payment._id}:`, error);
    }
  }

  console.log('Payment reconciliation complete');
});
```

### Reconciliation Reports

**Generate daily report:**
```javascript
const report = {
  date: Date.now(),
  totalPayments: payments.length,
  successfulPayments: payments.filter(p => p.paymentStatus === 'SUCCESS').length,
  failedPayments: payments.filter(p => p.paymentStatus === 'FAILED').length,
  mismatches: mismatches.length,
  totalAmount: payments.reduce((sum, p) => sum + p.amount, 0)
};

// Save to database or send email
await emailQueue.add('payment.report', report);
```

---

## Testing Payments

### Razorpay Test Mode

**Test Card Numbers:**
```
Success: 4111 1111 1111 1111
Failure: 4242 4242 4242 4242

CVV: Any 3 digits
Expiry: Any future date
```

**Test UPI IDs:**
```
success@razorpay
failure@razorpay
```

### Mock Webhook for Testing

```javascript
// tests/integration/payment.test.js
const mockWebhook = async (orderId, status = 'authorized') => {
  const payload = {
    event: `payment.${status}`,
    payload: {
      payment: {
        entity: {
          id: 'pay_test123',
          order_id: orderId,
          amount: 50000,
          status: status === 'authorized' ? 'captured' : 'failed'
        }
      }
    }
  };

  const signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  return request(app)
    .post('/api/v1/payments/webhook')
    .set('x-razorpay-signature', signature)
    .send(payload);
};
```

---

**Document Version:** 1.0  
**Last Updated:** May 2026  
**Maintained By:** Engineering Team
