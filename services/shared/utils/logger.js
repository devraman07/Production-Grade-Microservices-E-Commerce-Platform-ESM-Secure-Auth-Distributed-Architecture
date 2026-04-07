import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';

/**
 * Pino Logger Configuration
 * Production-ready logging with structured JSON output
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  base: {
    service: process.env.SERVICE_NAME || 'unknown-service',
    version: process.env.SERVICE_VERSION || '1.0.0'
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'req.body.password', 'req.body.cvv', 'req.body.cardNumber'],
    remove: true
  }
});

/**
 * Request Logger Middleware
 * Logs request start, end, and timing
 * Adds requestId for tracing
 */
export const requestLogger = (req, res, next) => {
  // Generate unique request ID
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.requestId = requestId;
  
  // Add requestId to response headers
  res.setHeader('X-Request-Id', requestId);
  
  const startTime = process.hrtime();
  
  // Log request start
  logger.info({
    requestId,
    type: 'request_start',
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.userId || 'anonymous'
  }, `→ ${req.method} ${req.originalUrl}`);
  
  // Capture response finish
  res.on('finish', () => {
    const diff = process.hrtime(startTime);
    const duration = Math.round((diff[0] * 1e3 + diff[1] * 1e-6) * 100) / 100; // ms with 2 decimals
    
    const logData = {
      requestId,
      type: 'request_end',
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.userId || 'anonymous'
    };
    
    // Log based on status
    if (res.statusCode >= 500) {
      logger.error(logData, `✗ ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    } else if (res.statusCode >= 400) {
      logger.warn(logData, `⚠ ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    } else {
      logger.info(logData, `✓ ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
    
    // Store response time for metrics
    res.responseTime = duration;
  });
  
  next();
};

/**
 * Error Logger
 * Logs errors with full context
 */
export const logError = (error, req, extraContext = {}) => {
  logger.error({
    requestId: req?.requestId,
    type: 'error',
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      code: error.code,
      statusCode: error.statusCode
    },
    context: {
      method: req?.method,
      url: req?.originalUrl,
      userId: req?.userId,
      ...extraContext
    }
  }, `Error: ${error.message}`);
};

/**
 * Performance Logger
 * Logs slow queries and operations
 */
export const logSlowQuery = (operation, duration, context = {}) => {
  const threshold = parseInt(process.env.SLOW_QUERY_THRESHOLD) || 500; // ms
  
  if (duration > threshold) {
    logger.warn({
      type: 'slow_query',
      operation,
      duration: `${duration}ms`,
      threshold: `${threshold}ms`,
      ...context
    }, `Slow query: ${operation} took ${duration}ms`);
  }
};

/**
 * Business Logic Logger
 * For important business events
 */
export const logEvent = (eventType, data) => {
  logger.info({
    type: 'business_event',
    event: eventType,
    ...data
  }, `Event: ${eventType}`);
};
