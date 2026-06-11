import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import config from '../../config/environment.js';

const setupSecurity = (app) => {
  // Helmet middleware for security headers
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true,
    })
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  });

  app.use('/api/', limiter);
};

export default setupSecurity;
