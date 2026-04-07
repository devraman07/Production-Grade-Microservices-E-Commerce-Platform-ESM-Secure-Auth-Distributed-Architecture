/**
 * Shared Service Configuration
 * Standard CORS, Security, and Common Middleware Settings
 */

import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

/**
 * Standard CORS Configuration
 * Allows frontend origin with credentials
 */
export const corsConfig = cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      undefined // Allow requests with no origin (mobile apps, curl, etc.)
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS not allowed for origin: ${origin}`));
    }
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Service-Key'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
});

/**
 * Standard Security Headers
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false // Allow embedding for API responses
});

/**
 * Rate Limiting Configurations
 */
export const rateLimiters = {
  // Standard API rate limiter
  standard: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
  }),

  // Stricter limiter for auth endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // 10 attempts per 15 minutes
    skipSuccessfulRequests: true, // Don't count successful logins
    message: {
      success: false,
      message: 'Too many authentication attempts. Please try again later.'
    }
  }),

  // Payment endpoint limiter
  payment: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 payment attempts per minute
    message: {
      success: false,
      message: 'Too many payment attempts. Please try again later.'
    }
  })
};
