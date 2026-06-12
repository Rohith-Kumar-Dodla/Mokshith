import mongoose from 'mongoose';
import { redisClient } from '../config/redis.js';
import { logger } from '../config/logger.js';

/**
 * System Monitoring Service
 * Provides real-time metrics for production monitoring and alerting
 */

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      slowQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      activeConnections: 0
    };

    this.startTime = Date.now();
  }

  /**
   * Get comprehensive system health metrics
   */
  async getSystemMetrics() {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    return {
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      uptimeSeconds: Math.floor(uptime),
      
      // Memory metrics
      memory: {
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
        heapUsagePercent: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2)
      },
      
      // Database metrics
      database: await this.getDatabaseMetrics(),
      
      // Cache metrics
      cache: await this.getCacheMetrics(),
      
      // Application metrics
      application: {
        totalRequests: this.metrics.requests,
        totalErrors: this.metrics.errors,
        slowQueries: this.metrics.slowQueries,
        errorRate: this.metrics.requests > 0 
          ? ((this.metrics.errors / this.metrics.requests) * 100).toFixed(2) + '%'
          : '0%'
      }
    };
  }

  // Override to include alert notification after metrics retrieval
  async getSystemMetricsAndAlert() {
    const metrics = await this.getSystemMetrics();
    const alerts = this.getAlerts();
    if (alerts && alerts.length > 0) {
      // Non-blocking notification
      this.checkAndNotifyAlerts(alerts);
    }
    return { metrics, alerts };
  }

  /**
   * Check alerts and optionally notify an external webhook (if configured)
   * Non-blocking and best-effort.
   */
  async checkAndNotifyAlerts(alerts) {
    try {
      if (!alerts || alerts.length === 0) return;
      const webhook = process.env.MONITORING_ALERT_WEBHOOK;
      if (!webhook) {
        logger.warn('Monitoring alerts:', { alerts });
        return;
      }

      // Send a concise payload
      const payload = {
        timestamp: new Date().toISOString(),
        alerts,
        app: process.env.npm_package_name || 'backend'
      };

      // Best-effort POST
      try {
        await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          // short timeout via AbortSignal if available
        });
        logger.info('Monitoring alerts posted to webhook', { webhook, count: alerts.length });
      } catch (err) {
        logger.warn('Failed to send monitoring alerts to webhook', { error: err.message });
      }
    } catch (err) {
      logger.error('Error in checkAndNotifyAlerts:', err);
    }
  }

  /**
   * Get MongoDB metrics
   */
  async getDatabaseMetrics() {
    try {
      if (mongoose.connection.readyState !== 1) {
        return { status: 'disconnected' };
      }

      const db = mongoose.connection.db;
      const admin = db.admin();
      
      // Get server status
      const serverStatus = await admin.serverStatus();
      
      // Get database stats
      const dbStats = await db.stats();

      return {
        status: 'connected',
        connections: {
          current: serverStatus.connections.current,
          available: serverStatus.connections.available,
          totalCreated: serverStatus.connections.totalCreated
        },
        operations: {
          insert: serverStatus.opcounters.insert,
          query: serverStatus.opcounters.query,
          update: serverStatus.opcounters.update,
          delete: serverStatus.opcounters.delete
        },
        storage: {
          dataSize: `${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`,
          indexSize: `${(dbStats.indexSize / 1024 / 1024).toFixed(2)} MB`,
          totalSize: `${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`
        },
        collections: dbStats.collections,
        indexes: dbStats.indexes
      };
    } catch (error) {
      logger.error('Failed to get database metrics:', error);
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Get Redis cache metrics
   */
  async getCacheMetrics() {
    try {
      const info = await redisClient.info('stats');
      const memory = await redisClient.info('memory');
      
      // Parse info strings
      const stats = this.parseRedisInfo(info);
      const memoryStats = this.parseRedisInfo(memory);

      return {
        status: 'connected',
        operations: {
          totalCommandsProcessed: stats.total_commands_processed,
          opsPerSecond: stats.instantaneous_ops_per_sec
        },
        memory: {
          used: memoryStats.used_memory_human,
          peak: memoryStats.used_memory_peak_human,
          fragmentation: memoryStats.mem_fragmentation_ratio
        },
        keyspace: await this.getKeyspaceMetrics(),
        cacheHitRate: this.getCacheHitRate()
      };
    } catch (error) {
      logger.error('Failed to get cache metrics:', error);
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Get Redis keyspace metrics
   */
  async getKeyspaceMetrics() {
    try {
      const dbSize = await redisClient.dbsize();
      return {
        totalKeys: dbSize,
        cacheKeys: await redisClient.keys('cache:*').then(keys => keys.length),
        lockKeys: await redisClient.keys('lock:*').then(keys => keys.length),
        queueKeys: await redisClient.keys('bull:*').then(keys => keys.length)
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Parse Redis INFO output
   */
  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const parsed = {};
    
    lines.forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          parsed[key] = isNaN(value) ? value : parseFloat(value);
        }
      }
    });
    
    return parsed;
  }

  /**
   * Calculate cache hit rate
   */
  getCacheHitRate() {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    if (total === 0) return '0%';
    
    return ((this.metrics.cacheHits / total) * 100).toFixed(2) + '%';
  }

  /**
   * Track request
   */
  trackRequest() {
    this.metrics.requests++;
  }

  /**
   * Track error
   */
  trackError() {
    this.metrics.errors++;
  }

  /**
   * Track slow query
   */
  trackSlowQuery() {
    this.metrics.slowQueries++;
  }

  /**
   * Track cache hit
   */
  trackCacheHit() {
    this.metrics.cacheHits++;
  }

  /**
   * Track cache miss
   */
  trackCacheMiss() {
    this.metrics.cacheMisses++;
  }

  /**
   * Get alert conditions
   */
  getAlerts() {
    const alerts = [];
    const memoryUsage = process.memoryUsage();
    const heapUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    // High memory usage
    if (heapUsagePercent > 90) {
      alerts.push({
        level: 'critical',
        type: 'memory',
        message: `Heap usage at ${heapUsagePercent.toFixed(2)}%`,
        threshold: '90%'
      });
    } else if (heapUsagePercent > 75) {
      alerts.push({
        level: 'warning',
        type: 'memory',
        message: `Heap usage at ${heapUsagePercent.toFixed(2)}%`,
        threshold: '75%'
      });
    }

    // High error rate
    if (this.metrics.requests > 100) {
      const errorRate = (this.metrics.errors / this.metrics.requests) * 100;
      if (errorRate > 5) {
        alerts.push({
          level: 'critical',
          type: 'error_rate',
          message: `Error rate at ${errorRate.toFixed(2)}%`,
          threshold: '5%'
        });
      } else if (errorRate > 2) {
        alerts.push({
          level: 'warning',
          type: 'error_rate',
          message: `Error rate at ${errorRate.toFixed(2)}%`,
          threshold: '2%'
        });
      }
    }

    // Many slow queries
    if (this.metrics.slowQueries > 50) {
      alerts.push({
        level: 'warning',
        type: 'performance',
        message: `${this.metrics.slowQueries} slow queries detected`,
        threshold: '50'
      });
    }

    return alerts;
  }

  /**
   * Reset metrics (for testing or scheduled resets)
   */
  resetMetrics() {
    this.metrics = {
      requests: 0,
      errors: 0,
      slowQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      activeConnections: 0
    };
    logger.info('Monitoring metrics reset');
  }
}

// Export singleton
export const monitoringService = new MonitoringService();
