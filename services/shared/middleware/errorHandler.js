/**
 * Global Error Handler Middleware
 * Catches all errors and returns standardized error responses
 */

import { errorResponse } from '../utils/responseHelper.js';

export const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(`[ERROR] ${req.method} ${req.url}:`, err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id: ${err.value}`;
    return errorResponse(res, 404, message, err);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists. Please use a different value.`;
    return errorResponse(res, 400, message, err);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).reduce((acc, val) => {
      acc[val.path] = val.message;
      return acc;
    }, {});
    const message = 'Validation failed';
    return errorResponse(res, 400, message, err, errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 401, 'Invalid authentication token', err);
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 401, 'Authentication token expired. Please login again.', err);
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    const errors = err.errors.reduce((acc, curr) => {
      const path = curr.path.join('.');
      acc[path] = curr.message;
      return acc;
    }, {});
    return errorResponse(res, 400, 'Validation failed', err, errors);
  }

  // Axios errors (service-to-service communication)
  if (err.isAxiosError) {
    const status = err.response?.status || 503;
    const message = err.response?.data?.message || 'Service unavailable';
    return errorResponse(res, status, message, err);
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = error.message || 'Internal Server Error';
  
  return errorResponse(res, statusCode, message, err);
};

/**
 * 404 Not Found Handler
 * Catches all unmatched routes
 */
export const notFoundHandler = (req, res) => {
  return errorResponse(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};
