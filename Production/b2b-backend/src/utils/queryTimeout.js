import mongoose from 'mongoose';
import { logger } from '../config/logger.js';

/**
 * Query timeout utilities for MongoDB performance monitoring
 */

const DEFAULT_TIMEOUT = 5000; // 5 seconds
const SLOW_QUERY_THRESHOLD = 2000; // 2 seconds

/**
 * Apply timeout to Mongoose query
 */
export const withTimeout = (query, timeout = DEFAULT_TIMEOUT) => {
  return query.maxTimeMS(timeout);
};

/**
 * Execute query with timeout and logging
 */
export const executeWithTimeout = async (query, options = {}) => {
  const { timeout = DEFAULT_TIMEOUT, operation = 'query' } = options;

  const startTime = Date.now();

  try {
    const result = await query.maxTimeMS(timeout);
    const duration = Date.now() - startTime;

    // Log slow queries
    if (duration > SLOW_QUERY_THRESHOLD) {
      logger.warn('Slow query detected', {
        operation,
        duration: `${duration}ms`,
        collection: query.model?.collection?.name,
        filter: JSON.stringify(query.getFilter?.())
      });
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    // Check if it's a timeout error
    if (error.code === 50 || error.message?.includes('timeout')) {
      logger.error('Query timeout exceeded', {
        operation,
        duration: `${duration}ms`,
        timeout: `${timeout}ms`,
        collection: query.model?.collection?.name
      });
      throw new Error('Query took too long to execute. Please try again with more specific filters.');
    }

    throw error;
  }
};

/**
 * Middleware to apply default timeout to all queries
 */
export const setupQueryTimeout = () => {
  // Apply to all queries globally
  mongoose.plugin((schema) => {
    schema.pre('find', function() {
      if (!this.options.maxTimeMS) {
        this.maxTimeMS(DEFAULT_TIMEOUT);
      }
    });

    schema.pre('findOne', function() {
      if (!this.options.maxTimeMS) {
        this.maxTimeMS(DEFAULT_TIMEOUT);
      }
    });

    schema.pre('countDocuments', function() {
      if (!this.options.maxTimeMS) {
        this.maxTimeMS(DEFAULT_TIMEOUT);
      }
    });

    schema.pre('aggregate', function() {
      if (!this.options.maxTimeMS) {
        this.maxTimeMS(DEFAULT_TIMEOUT);
      }
    });
  });

  logger.info('Global query timeout configured');
};

/**
 * Create timeout decorator for service methods
 */
export const withQueryTimeout = (timeout = DEFAULT_TIMEOUT) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args) {
      const startTime = Date.now();
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        if (duration > SLOW_QUERY_THRESHOLD) {
          logger.warn('Slow service method', {
            method: `${target.constructor.name}.${propertyKey}`,
            duration: `${duration}ms`
          });
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Service method error', {
          method: `${target.constructor.name}.${propertyKey}`,
          duration: `${duration}ms`,
          error: error.message
        });
        throw error;
      }
    };

    return descriptor;
  };
};

/**
 * Monitor query performance
 */
export const monitorQueryPerformance = () => {
  // Enable MongoDB query profiling
  if (process.env.MONGODB_PROFILING === 'true') {
    mongoose.connection.on('connected', async () => {
      try {
        // Set profiling level (0=off, 1=slow, 2=all)
        await mongoose.connection.db.command({
          profile: 1,
          slowms: SLOW_QUERY_THRESHOLD
        });
        logger.info('MongoDB query profiling enabled');
      } catch (error) {
        logger.warn('Failed to enable query profiling:', error.message);
      }
    });
  }
};
