import express from 'express';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import config from './src/config/environment.js';
import logger from './src/utils/logger.js';
import setupSecurity from './src/middlewares/security/index.js';
import routes from './src/routes/index.js';
import notFound from './src/middlewares/notFoundMiddleware.js';
import errorHandler from './src/middlewares/errorMiddleware.js';
import AppConstants from './src/constants/appConstants.js';

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser middleware
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Morgan logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Security middleware
setupSecurity(app);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Mokshith B2B Backend API Running',
  });
});

// API routes
app.use(`${AppConstants.API_PREFIX}/${AppConstants.API_VERSION}`, routes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

export default app;
