import express from 'express';
import morgan from 'morgan';
import cors from 'cors';

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { notFound } from './middlewares/notFound.middleware.js';

import { corsConfig } from './config/cors.js';
import { securityMiddleware } from './config/security.js';
import { requestLogger } from './middlewares/requestLogger.middleware.js';
import { idempotencyMiddleware } from './middlewares/idempotency.middleware.js';
import { ipBlockMiddleware } from './middlewares/ipBlock.middleware.js';

import logisticsRoutes from './modules/logistics/logistics.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🔥 THE ROBUST FIX: CHECK MULTIPLE POTENTIAL PATHS
const potentialPaths = [
  path.join(process.cwd(), 'uploads'),
  path.join(process.cwd(), 'b2b-backend', 'uploads'),
  path.resolve(__dirname, '..', 'uploads'),
  path.resolve(__dirname, '..', '..', 'uploads')
];

let uploadsPath = potentialPaths[0]; // Default

for (const p of potentialPaths) {
  if (fs.existsSync(p)) {
    uploadsPath = p;
    console.log(`✅ FOUND UPLOADS AT: ${p}`);
    break;
  }
}

// Ensure directory exists if none found
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// 1. Global headers for cross-origin images
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

// 2. Serve static files with absolute control to fix ERR_ABORTED
app.get('/uploads/:filename', (req, res) => {
  const filePath = path.join(uploadsPath, req.params.filename);
  
  if (fs.existsSync(filePath)) {
    // Set explicit headers to bypass all security blocks
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
    res.header('Cache-Control', 'public, max-age=3600');
    
    // Explicitly set MIME type for webp images
    if (req.params.filename.endsWith('.webp')) {
      res.type('image/webp');
    }
    
    return res.sendFile(filePath);
  } else {
    console.error(`❌ Image not found on disk at: ${filePath}`);
    return res.status(404).send(`Image not found at: ${filePath}`);
  }
});

// Backup for nested files if any
app.use('/uploads', express.static(uploadsPath));

// 🔥 Trust proxy (important for Render / cloud deployments)
app.set('trust proxy', 1);


// 🔥 CORS CONFIG
app.use(corsConfig);

// 🔥 IP Blocking
app.use(ipBlockMiddleware);

// 🔥 Handle preflight requests (VERY IMPORTANT)
app.options("*", corsConfig);


// 🔐 Security middleware
securityMiddleware(app);


// 🔥 Body parsers
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.includes('/webhook')) {
      req.rawBody = buf.toString();
    }
  }
}));
app.use(express.urlencoded({ extended: true }));


// 📜 Logging
app.use(morgan('dev'));
app.use(requestLogger);


// 🔁 Idempotency middleware
app.use(idempotencyMiddleware);


// ❤️ Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date()
  });
});


// 🚀 API routes
app.use('/api', routes);


// ❌ Not Found handler
app.use(notFound);


// 💥 Global error handler (must be last)
app.use(errorHandler);


export default app;