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


// 🔥 TRUST PROXY (important for cloud)
app.set('trust proxy', 1);


// 🔥 CORS CONFIG (FIXED)
const allowedOrigins = [
  "http://localhost:5173",
  "https://mokshith-entreprises.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow Postman / curl

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("CORS not allowed"), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 🔥 HANDLE PREFLIGHT (CRITICAL FIX)
app.options("*", cors());


// 🔐 Security
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


// 🔁 Idempotency
app.use(idempotencyMiddleware);


// 🔥 Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// 🚀 Health route
app.get('/health', (req, res) =>
  res.status(200).json({ status: 'ok', timestamp: new Date() })
);


// 🚀 API Routes
app.use('/api', routes);


// ❌ Not Found
app.use(notFound);


// 💥 Error Handler (must be last)
app.use(errorHandler);


export default app;