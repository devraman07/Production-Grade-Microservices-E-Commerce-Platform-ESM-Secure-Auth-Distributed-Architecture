/**
 * Database Performance Middleware
 * Query optimization and timeout handling
 */

import mongoose from 'mongoose';
import { logSlowQuery, logError } from '../utils/logger.js';
import { errorResponse } from '../utils/responseHelper.js';

/**
 * Query Timeout Wrapper
 * Automatically times out slow queries
 */
export const MAX_QUERY_TIME = 10000; // 10 seconds

export const withTimeout = (promise, timeout = MAX_QUERY_TIME, operation = 'database query') => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeout}ms`)), timeout)
    )
  ]);
};

/**
 * Optimized Query Builder
 * Adds common optimizations to Mongoose queries
 */
export class OptimizedQuery {
  constructor(model, query = {}) {
    this.model = model;
    this.query = query;
    this.options = {
      limit: 100,
      lean: false,
      select: null,
      populate: null,
      sort: null,
      skip: 0
    };
  }
  
  limit(n) {
    this.options.limit = Math.min(n, 100); // Hard cap at 100
    return this;
  }
  
  skip(n) {
    this.options.skip = n;
    return this;
  }
  
  sort(field) {
    this.options.sort = field;
    return this;
  }
  
  select(fields) {
    this.options.select = fields;
    return this;
  }
  
  lean() {
    this.options.lean = true;
    return this;
  }
  
  populate(path, select) {
    this.options.populate = { path, select };
    return this;
  }
  
  async exec() {
    const startTime = Date.now();
    
    let q = this.model.find(this.query);
    
    if (this.options.select) q = q.select(this.options.select);
    if (this.options.sort) q = q.sort(this.options.sort);
    if (this.options.skip) q = q.skip(this.options.skip);
    if (this.options.limit) q = q.limit(this.options.limit);
    if (this.options.lean) q = q.lean();
    if (this.options.populate) q = q.populate(this.options.populate);
    
    try {
      const result = await withTimeout(q, MAX_QUERY_TIME);
      const duration = Date.now() - startTime;
      
      logSlowQuery('mongodb_find', duration, {
        collection: this.model.collection.name,
        query: JSON.stringify(this.query),
        limit: this.options.limit
      });
      
      return result;
    } catch (error) {
      if (error.message.includes('timed out')) {
        logError(error, { originalUrl: '/db_query', method: 'DB' });
        throw new Error('Database query timeout - please try again');
      }
      throw error;
    }
  }
  
  async count() {
    const startTime = Date.now();
    
    try {
      const result = await withTimeout(
        this.model.countDocuments(this.query),
        MAX_QUERY_TIME
      );
      
      logSlowQuery('mongodb_count', Date.now() - startTime, {
        collection: this.model.collection.name
      });
      
      return result;
    } catch (error) {
      if (error.message.includes('timed out')) {
        throw new Error('Database count timeout');
      }
      throw error;
    }
  }
}

/**
 * Timeout Middleware for Routes
 * Prevents long-running requests from hanging
 */
export const routeTimeout = (timeoutMs = 30000) => {
  return (req, res, next) => {
    // Set timeout on the request
    req.setTimeout(timeoutMs, () => {
      logError(new Error('Request timeout'), req);
      if (!res.headersSent) {
        errorResponse(res, 504, 'Request timeout - operation took too long');
      }
    });
    
    // Track if response was sent
    const originalEnd = res.end;
    res.end = function(...args) {
      res.responseEnded = true;
      return originalEnd.apply(this, args);
    };
    
    next();
  };
};

/**
 * Circuit Breaker Pattern
 * Prevents cascading failures when services are down
 */
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000; // 30 seconds
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.nextAttempt = Date.now();
  }
  
  async execute(operation, ...args) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN - service temporarily unavailable');
      }
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await operation(...args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failures++;
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      
      logError(new Error(`Circuit breaker opened for service`), {
        originalUrl: '/circuit_breaker',
        method: 'SYSTEM'
      });
    }
  }
}

// Global circuit breakers for inter-service calls
export const circuitBreakers = {
  auth: new CircuitBreaker({ failureThreshold: 3 }),
  cart: new CircuitBreaker({ failureThreshold: 5 }),
  order: new CircuitBreaker({ failureThreshold: 5 }),
  payment: new CircuitBreaker({ failureThreshold: 3 }),
  user: new CircuitBreaker({ failureThreshold: 5 }),
  product: new CircuitBreaker({ failureThreshold: 5 })
};

/**
 * Safe Service Call with Circuit Breaker
 */
export const safeServiceCall = async (serviceName, operation, ...args) => {
  const breaker = circuitBreakers[serviceName];
  
  if (!breaker) {
    return operation(...args);
  }
  
  return breaker.execute(operation, ...args);
};
