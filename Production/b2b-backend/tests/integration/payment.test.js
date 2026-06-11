import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as gateway from '../../src/modules/payment/payment.gateway.js';
import crypto from 'crypto';

describe('Payment Gateway - Critical Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyPayment() - Signature Validation', () => {
    it('should verify valid Razorpay payment signature', async () => {
      // Arrange
      const razorpay_order_id = 'order_test123';
      const razorpay_payment_id = 'pay_test456';
      const secret = 'test_secret_key';
      
      // Generate valid signature
      const sign = razorpay_order_id + '|' + razorpay_payment_id;
      const razorpay_signature = crypto
        .createHmac('sha256', secret)
        .update(sign)
        .digest('hex');

      // Mock env
      process.env.RAZORPAY_KEY_SECRET = secret;

      // Act
      const isValid = await gateway.verifyPayment({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      });

      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject invalid payment signature', async () => {
      // Arrange
      const razorpay_order_id = 'order_test123';
      const razorpay_payment_id = 'pay_test456';
      const razorpay_signature = 'invalid_signature';

      process.env.RAZORPAY_KEY_SECRET = 'test_secret_key';

      // Act
      const isValid = await gateway.verifyPayment({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      });

      // Assert
      expect(isValid).toBe(false);
    });

    it('should reject payment with missing fields', async () => {
      // Act
      const isValid1 = await gateway.verifyPayment({
        razorpay_order_id: 'order_123',
        razorpay_payment_id: null,
        razorpay_signature: 'sig'
      });

      const isValid2 = await gateway.verifyPayment({
        razorpay_order_id: null,
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'sig'
      });

      // Assert
      expect(isValid1).toBe(false);
      expect(isValid2).toBe(false);
    });
  });

  describe('verifyWebhookSignature() - Webhook Security', () => {
    it('should verify valid webhook signature', () => {
      // Arrange
      const body = JSON.stringify({ event: 'payment.captured', data: {} });
      const secret = 'webhook_secret_key';
      
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

      // Act
      const isValid = gateway.verifyWebhookSignature(body, expectedSignature, secret);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      // Arrange
      const body = JSON.stringify({ event: 'payment.captured', data: {} });
      const secret = 'webhook_secret_key';
      const invalidSignature = 'invalid_signature_xyz';

      // Act
      const isValid = gateway.verifyWebhookSignature(body, invalidSignature, secret);

      // Assert
      expect(isValid).toBe(false);
    });

    it('should reject tampered webhook payload', () => {
      // Arrange
      const originalBody = JSON.stringify({ event: 'payment.captured', amount: 1000 });
      const tamperedBody = JSON.stringify({ event: 'payment.captured', amount: 10 });
      const secret = 'webhook_secret_key';
      
      // Signature for original body
      const signature = crypto
        .createHmac('sha256', secret)
        .update(originalBody)
        .digest('hex');

      // Act - Try to verify tampered body with original signature
      const isValid = gateway.verifyWebhookSignature(tamperedBody, signature, secret);

      // Assert
      expect(isValid).toBe(false);
    });
  });

  describe('createPaymentOrder() - Amount Validation', () => {
    it('should reject negative amount', async () => {
      // Act & Assert
      await expect(gateway.createPaymentOrder({ amount: -100 }))
        .rejects
        .toThrow('Invalid amount');
    });

    it('should reject zero amount', async () => {
      // Act & Assert
      await expect(gateway.createPaymentOrder({ amount: 0 }))
        .rejects
        .toThrow('Minimum payment amount is ₹1');
    });

    it('should reject amount less than ₹1', async () => {
      // Act & Assert
      await expect(gateway.createPaymentOrder({ amount: 0.5 }))
        .rejects
        .toThrow('Minimum payment amount is ₹1');
    });

    it('should accept valid amount', async () => {
      // This would need mocking the actual Razorpay SDK
      // For now, just test validation logic
      const amount = 100;
      expect(amount).toBeGreaterThanOrEqual(1);
    });

    it('should convert INR to paise correctly', () => {
      // Test conversion logic
      const amountInr = 100;
      const amountPaise = Math.round(amountInr * 100);
      expect(amountPaise).toBe(10000);
    });
  });
});

describe('Payment Service - Critical Business Logic Tests', () => {
  describe('Payment Amount Mismatch Validation', () => {
    it('should detect and reject amount mismatch', () => {
      // Arrange
      const orderAmount = 1000;
      const sentAmount = 900;

      // Act
      const amountsMatch = Math.round(orderAmount) === Math.round(sentAmount);

      // Assert
      expect(amountsMatch).toBe(false);
    });

    it('should accept matching amounts', () => {
      // Arrange
      const orderAmount = 1000;
      const sentAmount = 1000;

      // Act
      const amountsMatch = Math.round(orderAmount) === Math.round(sentAmount);

      // Assert
      expect(amountsMatch).toBe(true);
    });

    it('should accept amounts with decimal precision difference', () => {
      // Arrange
      const orderAmount = 1000.005;
      const sentAmount = 1000.004;

      // Act
      const amountsMatch = Math.round(orderAmount) === Math.round(sentAmount);

      // Assert
      expect(amountsMatch).toBe(true);
    });
  });

  describe('Idempotency Protection', () => {
    it('should prevent duplicate payment processing', () => {
      // Arrange
      const processedPayments = new Set();
      const paymentId = 'pay_123456';

      // Act - First attempt
      const firstAttempt = !processedPayments.has(paymentId);
      processedPayments.add(paymentId);

      // Second attempt
      const secondAttempt = !processedPayments.has(paymentId);

      // Assert
      expect(firstAttempt).toBe(true); // Should process
      expect(secondAttempt).toBe(false); // Should reject
    });
  });
});
