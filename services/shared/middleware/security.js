/**
 * Security Middleware
 * Production-grade security protections
 */

import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import { logEvent, logError } from '../utils/logger.js';
import { errorResponse } from '../utils/responseHelper.js';

/**
 * MongoDB Sanitization
 * Removes $ and . from request to prevent NoSQL injection
 */
export const sanitizeMongo = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logEvent('mongo_sanitize_triggered', {
      key,
      url: req.originalUrl,
      ip: req.ip
    });
  }
});

/**
 * User-based Rate Limiting Store
 * Uses memory (use Redis in production)
 */
class UserRateLimitStore {
  constructor() {
    this.requests = new Map();
    this.windowMs = 15 * 60 * 1000; // 15 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), this.windowMs);
  }
  
  // Get unique key: userId or IP address
  getKey(req) {
    return req.userId || req.ip;
  }
  
  increment(req) {
    const key = this.getKey(req);
    const now = Date.now();
    
    if (!this.requests.has(key)) {
      this.requests.set(key, { count: 1, resetTime: now + this.windowMs });
      return { count: 1, resetTime: now + this.windowMs };
    }
    
    const record = this.requests.get(key);
    
    if (now > record.resetTime) {
      // Reset window
      record.count = 1;
      record.resetTime = now + this.windowMs;
    } else {
      record.count++;
    }
    
    return { count: record.count, resetTime: record.resetTime };
  }
  
  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

const userRateStore = new UserRateLimitStore();

/**
 * User-based Rate Limiting Middleware
 * Limits requests per user (or IP for guests)
 */
export const createUserRateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return async (req, res, next) => {
    const result = userRateStore.increment(req);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - result.count));
    res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
    
    if (result.count > maxRequests) {
      logEvent('rate_limit_exceeded', {
        userId: req.userId || 'anonymous',
        ip: req.ip,
        url: req.originalUrl,
        count: result.count
      });
      
      return errorResponse(
        res, 
        429, 
        'Too many requests. Please try again later.'
      );
    }
    
    next();
  };
};

/**
 * Strict Rate Limiting for Sensitive Operations
 * For password changes, payment, etc.
 */
export const createStrictRateLimiter = (maxRequests = 5, windowMs = 60 * 60 * 1000) => {
  const store = new Map();
  
  return async (req, res, next) => {
    const key = req.userId || req.ip;
    const now = Date.now();
    
    if (!store.has(key)) {
      store.set(key, { count: 1, resetTime: now + windowMs });
    } else {
      const record = store.get(key);
      if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + windowMs;
      } else {
        record.count++;
      }
      
      if (record.count > maxRequests) {
        return errorResponse(
          res,
          429,
          `This operation is rate limited. Maximum ${maxRequests} attempts per hour.`
        );
      }
    }
    
    next();
  };
};

/**
 * Query Limiting Middleware
 * Prevents over-fetching with excessive limits
 */
export const queryLimiter = (req, res, next) => {
  const MAX_LIMIT = 100;
  const DEFAULT_LIMIT = 10;
  
  let limit = parseInt(req.query.limit) || DEFAULT_LIMIT;
  
  // Enforce maximum
  if (limit > MAX_LIMIT) {
    logEvent('query_limit_enforced', {
      requested: limit,
      enforced: MAX_LIMIT,
      url: req.originalUrl,
      userId: req.userId
    });
    limit = MAX_LIMIT;
  }
  
  // Store normalized limit
  req.query.limit = limit;
  req.query.page = Math.max(1, parseInt(req.query.page) || 1);
  
  next();
};

/**
 * Request Size Limiter
 * Prevents large payload attacks
 */
export const requestSizeLimiter = (maxSize = '10mb') => {
  const bytes = parseInt(maxSize) * 1024 * 1024;
  
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length']);
    
    if (contentLength && contentLength > bytes) {
      logEvent('payload_too_large', {
        size: contentLength,
        max: bytes,
        url: req.originalUrl,
        userId: req.userId
      });
      
      return errorResponse(res, 413, `Request entity too large. Maximum size: ${maxSize}`);
    }
    
    next();
  };
};

/**
 * IP Whitelist Middleware (for admin routes)
 */
export const ipWhitelist = (allowedIps = []) => {
  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    
    if (allowedIps.length > 0 && !allowedIps.includes(clientIp)) {
      logEvent('ip_blocked', {
        ip: clientIp,
        url: req.originalUrl,
        allowed: allowedIps
      });
      
      return errorResponse(res, 403, 'Access denied from this IP address');
    }
    
    next();
  };
};

export { userRateStore };
