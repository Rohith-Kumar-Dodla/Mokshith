import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Create transports array
const transports = [
  // Console transport
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? structuredFormat : consoleFormat
  })
];

// Add file transports in production
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGGING === 'true') {
  const logsDir = path.resolve(process.cwd(), 'logs');
  
  // Error log
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: structuredFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    })
  );

  // Combined log
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: structuredFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    })
  );

  // Performance log
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'performance.log'),
      level: 'info',
      format: structuredFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 3
    })
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: structuredFormat,
  defaultMeta: {
    service: 'b2b-backend',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports,
  exitOnError: false
});

// Create child logger with correlation ID
export const createLogger = (correlationId) => {
  return logger.child({ correlationId });
};