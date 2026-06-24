#!/usr/bin/env node
/**
 * Simple responsive screenshot audit using Puppeteer.
 * Usage:
 *   NODE_ENV=production node tools/responsive-audit.js
 *
 * Configure ROUTES below or pass via env ROUTES as comma-separated list.
 */
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.resolve(process.cwd(), 'tools', 'responsive-screenshots');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const DEFAULT_ROUTES = [
  '/',
  '/login',
  '/register',
  '/vendor/checkout',
  '/vendor/order-success',
  '/vendor/orders',
  '/admin/orders',
  '/super-admin/dashboard',
];

const ROUTES = (process.env.ROUTES ? process.env.ROUTES.split(',') : DEFAULT_ROUTES).map(r => r.trim());
const VIEWPORTS = [
  { name: 'iphone5', width: 320, height: 568 },
  { name: 'iphone8', width: 375, height: 667 },
  { name: 'pixel3', width: 393, height: 851 },
  { name: 'ipad', width: 768, height: 1024 },
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'ultrawide', width: 1920, height: 1080 },
];

async function run() {
  const base = process.env.BASE_URL || 'http://localhost:5173';
  const browser = await puppeteer.launch({ headless: true });
  for (const route of ROUTES) {
    const url = `${base}${route}`;
    const page = await browser.newPage();
    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        const safeName = route === '/' ? 'home' : route.replace(/\//g, '_').replace(/^_/, '');
        const filename = `${safeName}_${vp.name}_${vp.width}x${vp.height}.png`;
        const filepath = path.join(OUTPUT_DIR, filename);
        await page.screenshot({ path: filepath, fullPage: true });
        console.log('Captured', filepath);
      } catch (err) {
        console.error('Failed to capture', url, vp, err.message);
      }
    }
    await page.close();
  }
  await browser.close();
  console.log('Responsive audit complete. Screenshots in', OUTPUT_DIR);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

