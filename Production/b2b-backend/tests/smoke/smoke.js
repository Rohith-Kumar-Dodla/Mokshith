#!/usr/bin/env node
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const base = process.env.SMOKE_BASE_URL || 'http://localhost:5000';
const endpoints = [
  '/health/ready',
  '/api/health/ready',
  '/api/v1/health/ready',
  '/metrics'
];

async function checkEndpoint(path) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, { method: 'GET' });
    const text = await res.text();
    console.log(`[OK] GET ${url} -> ${res.status}`);
    try {
      console.log(JSON.stringify(JSON.parse(text), null, 2));
    } catch (e) {
      console.log(text.slice(0, 1000));
    }
  } catch (err) {
    console.error(`[ERR] GET ${url} -> ${err.message}`);
  }
}

async function sendWebhook() {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.log('Skipping webhook test: RAZORPAY_WEBHOOK_SECRET not set');
    return;
  }

  const orderId = process.env.SMOKE_ORDER_ID || 'smoke_order_1';
  const paymentId = process.env.SMOKE_PAYMENT_ID || 'smoke_pay_1';
  const amountRupees = Number(process.env.SMOKE_AMOUNT || 100);
  const body = {
    event: 'payment.captured',
    id: `smoke_webhook_${Date.now()}`,
    payload: {
      payment: {
        entity: {
          order_id: orderId,
          id: paymentId,
          amount: Math.round(amountRupees * 100)
        }
      }
    }
  };

  const raw = JSON.stringify(body);
  const signature = crypto.createHmac('sha256', secret).update(raw).digest('hex');

  const url = `${base}/api/v1/payments/webhook`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature
      },
      body: raw
    });
    const json = await res.text();
    console.log(`[OK] POST ${url} -> ${res.status}`);
    console.log(json.slice(0, 2000));
  } catch (err) {
    console.error(`[ERR] POST ${url} -> ${err.message}`);
  }
}

async function main() {
  console.log('Running smoke checks against', base);
  for (const ep of endpoints) {
    await checkEndpoint(ep);
  }

  if (process.env.SMOKE_WEBHOOK === 'true') {
    console.log('Running webhook smoke test...');
    await sendWebhook();
  } else {
    console.log('Webhook smoke test skipped (set SMOKE_WEBHOOK=true to run)');
  }
}

main().catch((e) => {
  console.error('Smoke script failed:', e);
  process.exit(1);
});

