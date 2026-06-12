#!/usr/bin/env node
import dotenv from 'dotenv';

dotenv.config();

const webhook = process.env.MONITORING_ALERT_WEBHOOK;
if (!webhook) {
  console.error('MONITORING_ALERT_WEBHOOK not configured. Set it in .env to test.');
  process.exit(1);
}

const payload = {
  timestamp: new Date().toISOString(),
  app: process.env.npm_package_name || 'b2b-backend',
  alerts: [
    { level: 'warning', type: 'memory', message: 'Heap usage at 80%', threshold: '75%' }
  ]
};

async function send() {
  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log('Alert POST status:', res.status);
    const body = await res.text();
    console.log('Response:', body.slice(0, 1000));
  } catch (err) {
    console.error('Failed to post alert:', err.message);
  }
}

send();

