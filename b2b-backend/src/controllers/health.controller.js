import mongoose from 'mongoose';
import { redisClient } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { monitoringService } from '../services/monitoring.service.js';
import { workers } from '../workers/index.js';

/**
 * Comprehensive health check endpoint
 */
export const healthCheck = async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      memory: checkMemory(),
      queues: await checkQueues(),
      disk: checkDisk()
    }
  };

  // Determine overall health status
  const statuses = Object.values(health.checks).map(check => check.status);
  const hasUnhealthy = statuses.includes('unhealthy');
  const hasDegraded = statuses.includes('degraded') || statuses.includes('warning');
  
  if (hasUnhealthy) {
    health.status = 'unhealthy';
  } else if (hasDegraded) {
    health.status = 'degraded';
  } else {
    health.status = 'healthy';
  }

  const statusCode = hasUnhealthy ? 503 : (hasDegraded ? 200 : 200);
  
  res.status(statusCode).json(health);
};

/**
 * Liveness probe - checks if app is running
 */
export const livenessProbe = (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
};

/**
 * Readiness probe - checks if app is ready to serve traffic
 */
export const readinessProbe = async (req, res) => {
  const dbHealthy = await checkDatabase();
  const redisHealthy = await checkRedis();

  const ready = dbHealthy.status === 'healthy' && redisHealthy.status === 'healthy';

  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not ready',
    timestamp: new Date().toISOString(),
    checks: {
      database: dbHealthy,
      redis: redisHealthy
    }
  });
};

/**
 * Database health check with latency thresholds
 */
async function checkDatabase() {
  try {
    const start = Date.now();
    
    if (mongoose.connection.readyState !== 1) {
      return {
        status: 'unhealthy',
        message: 'Database not connected',
        readyState: mongoose.connection.readyState
      };
    }

    // Ping database
    await mongoose.connection.db.admin().ping();
    const responseTime = Date.now() - start;

    // Get connection stats
    const stats = await mongoose.connection.db.stats();

    // Determine status based on latency thresholds
    let status = 'healthy';
    if (responseTime > 500) {
      status = 'unhealthy';
      logger.error('Database latency critical', { responseTime });
    } else if (responseTime > 100) {
      status = 'degraded';
      logger.warn('Database latency high', { responseTime });
    }

    return {
      status,
      responseTime: `${responseTime}ms`,
      latencyMs: responseTime,
      connections: mongoose.connection.db.serverConfig?.s?.pool?.totalConnectionCount || 'N/A',
      collections: stats.collections,
      dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
      thresholds: { healthy: '< 100ms', degraded: '< 500ms', unhealthy: '>= 500ms' }
    };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      status: 'unhealthy',
      message: error.message
    };
  }
}

/**
 * Redis health check with latency thresholds
 */
async function checkRedis() {
  try {
    const start = Date.now();
    
    // Test Redis connectivity with ping
    await redisClient.ping();
    const responseTime = Date.now() - start;

    // Get Redis info for additional metrics
    const info = await redisClient.info('stats');
    const memory = await redisClient.info('memory');
    
    // Parse used memory
    const memMatch = memory.match(/used_memory_human:([^\r\n]+)/);
    const usedMemory = memMatch ? memMatch[1] : 'N/A';
    
    // 🔒 Get circuit breaker status
    const circuitBreaker = redisClient.getCircuitBreakerStatus();

    // Determine status based on latency thresholds and circuit breaker
    let status = 'healthy';
    if (circuitBreaker.state === 'OPEN') {
      status = 'unhealthy';
      logger.error('Redis circuit breaker OPEN - using fallback mode');
    } else if (circuitBreaker.state === 'HALF_OPEN') {
      status = 'degraded';
      logger.warn('Redis circuit breaker HALF_OPEN - testing recovery');
    } else if (responseTime > 200) {
      status = 'unhealthy';
      logger.error('Redis latency critical', { responseTime });
    } else if (responseTime > 50) {
      status = 'degraded';
      logger.warn('Redis latency high', { responseTime });
    }

    return {
      status,
      responseTime: `${responseTime}ms`,
      latencyMs: responseTime,
      connected: true,
      usedMemory,
      circuitBreaker: {
        state: circuitBreaker.state,
        isHealthy: circuitBreaker.isHealthy,
        failureCount: circuitBreaker.failureCount
      },
      thresholds: { healthy: '< 50ms', degraded: '< 200ms', unhealthy: '>= 200ms' }
    };
  } catch (error) {
    logger.error('Redis health check failed:', error);
    
    // Check circuit breaker even on failure
    const circuitBreaker = redisClient.getCircuitBreakerStatus();
    
    return {
      status: 'unhealthy',
      message: error.message,
      connected: false,
      circuitBreaker: {
        state: circuitBreaker.state,
        fallbackActive: circuitBreaker.state === 'OPEN'
      }
    };
  }
}

/**
 * Memory health check with usage thresholds
 */
function checkMemory() {
  const usage = process.memoryUsage();
  const totalHeapMB = (usage.heapTotal / 1024 / 1024).toFixed(2);
  const usedHeapMB = (usage.heapUsed / 1024 / 1024).toFixed(2);
  const usagePercent = parseFloat(((usage.heapUsed / usage.heapTotal) * 100).toFixed(2));

  // Determine status based on memory usage thresholds
  let status = 'healthy';
  if (usagePercent >= 90) {
    status = 'unhealthy';
    logger.error('Memory usage critical', { usagePercent: `${usagePercent}%` });
  } else if (usagePercent >= 80) {
    status = 'degraded';
    logger.warn('Memory usage high', { usagePercent: `${usagePercent}%` });
  }

  return {
    status,
    heapTotal: `${totalHeapMB} MB`,
    heapUsed: `${usedHeapMB} MB`,
    heapUsage: `${usagePercent}%`,
    rss: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`,
    external: `${(usage.external / 1024 / 1024).toFixed(2)} MB`,
    thresholds: { healthy: '< 80%', degraded: '< 90%', unhealthy: '>= 90%' }
  };
}

/**
 * Queue and worker health check with advanced validation
 * 🔒 PHASE 3: Enhanced with queue depth, stuck jobs, and DLQ monitoring
 */
async function checkQueues() {
  try {
    if (process.env.ENABLE_QUEUE !== 'true') {
      return {
        status: 'healthy',
        message: 'Queues disabled',
        enabled: false
      };
    }

    // Check worker status
    const workerStatuses = [];
    let hasUnhealthy = false;
    let hasDegraded = false;
    
    for (const worker of workers) {
      const isRunning = worker.isRunning();
      const isPaused = worker.isPaused();
      const isClosed = worker.closing || false;
      
      // 🔒 PHASE 3: Get queue instance from worker to check depth
      const queue = worker.queue;
      let queueDepth = { waiting: 0, active: 0, delayed: 0, failed: 0 };
      let processingLatency = null;
      
      try {
        // Get queue job counts
        const counts = await queue.getJobCounts('waiting', 'active', 'delayed', 'failed');
        queueDepth = counts;
        
        // 🔒 PHASE 3: Detect stuck/failed jobs
        const failedJobs = await queue.getFailed(0, 5); // Get last 5 failed jobs
        const hasRecentFailures = failedJobs.length > 0;
        
        // 🔒 PHASE 3: Check for excessive queue depth (potential backpressure)
        const totalPending = counts.waiting + counts.delayed;
        const isBacklogged = totalPending > 100;
        
        // 🔒 PHASE 3: Detect dead-letter queue growth
        const isDLQGrowing = counts.failed > 50;
        
        // 🔒 PHASE 3: Calculate processing latency (average time in queue)
        if (counts.active > 0) {
          const activeJobs = await queue.getActive(0, 1);
          if (activeJobs.length > 0) {
            const oldestActive = activeJobs[0];
            processingLatency = Date.now() - oldestActive.timestamp;
          }
        }
        
        // Determine worker health status
        if (!isRunning || isClosed || isDLQGrowing) {
          hasUnhealthy = true;
          logger.error('Worker unhealthy', { 
            worker: worker.name, 
            isRunning, 
            isClosed, 
            failedCount: counts.failed 
          });
        } else if (isBacklogged || hasRecentFailures || (processingLatency && processingLatency > 60000)) {
          hasDegraded = true;
          logger.warn('Worker degraded', { 
            worker: worker.name, 
            totalPending, 
            failedCount: counts.failed,
            latencyMs: processingLatency
          });
        }
        
        workerStatuses.push({
          name: worker.name,
          running: isRunning,
          paused: isPaused,
          closed: isClosed,
          queueDepth,
          totalPending,
          processingLatencyMs: processingLatency,
          status: !isRunning || isClosed || isDLQGrowing ? 'unhealthy' : 
                  isBacklogged || hasRecentFailures || (processingLatency && processingLatency > 60000) ? 'degraded' : 
                  'healthy'
        });
      } catch (queueErr) {
        logger.error('Failed to get queue metrics', { 
          worker: worker.name, 
          error: queueErr.message 
        });
        hasUnhealthy = true;
        
        workerStatuses.push({
          name: worker.name,
          running: isRunning,
          paused: isPaused,
          closed: isClosed,
          status: 'unhealthy',
          error: 'Failed to fetch queue metrics'
        });
      }
    }

    // Check queue keys in Redis
    let queueKeysCount = 0;
    try {
      const queueKeys = await redisClient.keys('bull:*');
      queueKeysCount = queueKeys.length;
    } catch (redisErr) {
      logger.error('Failed to get queue keys from Redis', { error: redisErr.message });
    }
    
    // Determine overall status
    const overallStatus = hasUnhealthy ? 'unhealthy' : 
                          hasDegraded ? 'degraded' : 
                          'healthy';
    
    return {
      status: overallStatus,
      enabled: true,
      workers: workerStatuses,
      totalWorkers: workers.length,
      runningWorkers: workerStatuses.filter(w => w.running).length,
      healthyWorkers: workerStatuses.filter(w => w.status === 'healthy').length,
      degradedWorkers: workerStatuses.filter(w => w.status === 'degraded').length,
      unhealthyWorkers: workerStatuses.filter(w => w.status === 'unhealthy').length,
      queueKeysCount,
      thresholds: {
        backlogWarning: 100,
        dlqWarning: 50,
        latencyWarning: '60s'
      }
    };
  } catch (error) {
    logger.error('Queue health check failed:', error);
    return {
      status: 'unhealthy',
      message: error.message,
      enabled: true
    };
  }
}

/**
 * Disk health check (basic)
 */
function checkDisk() {
  // In production, you'd want to check actual disk usage
  // For now, we'll return a basic check
  return {
    status: 'healthy',
    message: 'Disk monitoring not implemented'
  };
}

/**
 * System metrics endpoint - comprehensive production monitoring
 */
export const getMetrics = async (req, res) => {
  try {
    const metrics = await monitoringService.getSystemMetrics();
    const alerts = monitoringService.getAlerts();

    res.status(200).json({
      success: true,
      metrics,
      alerts,
      alertCount: alerts.length
    });
  } catch (error) {
    logger.error('Failed to get system metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system metrics'
    });
  }
};
