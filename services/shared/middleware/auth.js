import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/responseHelper.js';

/**
 * Extract token from request
 * Supports: Bearer token in Authorization header or HTTP-only cookie
 */
export const extractToken = (req) => {
  // Check Authorization header
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  
  // Check HTTP-only cookie
  if (req.cookies?.token) {
    return req.cookies.token;
  }
  
  return null;
};

/**
 * Authentication Middleware - Requires valid token
 */
export const authenticate = (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return errorResponse(res, 401, 'Authentication required. Please login.');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.token = token;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Session expired. Please login again.');
    }
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 401, 'Invalid authentication token.');
    }
    return errorResponse(res, 401, 'Authentication failed.', error);
  }
};

/**
 * Optional Authentication - Doesn't require token but attaches user if present
 */
export const optionalAuth = (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
      req.userRole = decoded.role;
      req.token = token;
    }
    
    next();
  } catch (error) {
    // Continue without auth - this is optional
    next();
  }
};

/**
 * Authorization Middleware - Check user roles
 * @param {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.userId) {
      return errorResponse(res, 401, 'Authentication required.');
    }
    
    if (!roles.includes(req.userRole)) {
      return errorResponse(
        res, 
        403, 
        `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.userRole}`
      );
    }
    
    next();
  };
};

/**
 * Service-to-Service Authentication
 * For internal service communication
 */
export const serviceAuth = (req, res, next) => {
  const serviceKey = req.headers['x-service-key'];
  
  if (serviceKey !== process.env.INTERNAL_SERVICE_KEY) {
    return errorResponse(res, 403, 'Invalid service authentication');
  }
  
  next();
};
