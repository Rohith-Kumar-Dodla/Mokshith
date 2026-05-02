import express from 'express';
import morgan from 'morgan';
import cors from 'cors';

import path from 'path';
import { fileURLToPath } from 'url';

import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { notFound } from './middlewares/notFound.middleware.js';

import { securityMiddleware } from './config/security.js';
import { requestLogger } from './middlewares/requestLogger.middleware.js';
import { idempotencyMiddleware } from './middlewares/idempotency.middleware.js';

import logisticsRoutes from './modules/logistics/logistics.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();


// 🔥 Trust proxy (important for Render / cloud deployments)
app.set('trust proxy', 1);


// 🔥 CORS CONFIG (FINAL FIX)
const allowedOrigins = [
  "http://localhost:5173",
  "https://mokshith-entreprises.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without origin (Postman, mobile apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // ❗ Do NOT throw error (prevents 500 issue)
    return callback(null, false);
  },
  credentials: true
}));

// 🔥 Handle preflight requests (VERY IMPORTANT)
app.options("*", cors());


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


// 🔥 Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


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