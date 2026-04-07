/**
 * Standardized API Response Helpers
 * Use these functions to ensure consistent response format across all microservices
 */

/**
 * Standard success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Success message
 * @param {*} data - Response data
 * @param {Object} meta - Additional metadata (pagination, etc.)
 */
export const successResponse = (res, statusCode = 200, message = 'Success', data = null, meta = null) => {
  const response = {
    success: true,
    message,
    data,
    error: null
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Standard error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string} message - Error message
 * @param {Object} error - Error details (only in development)
 * @param {Object} errors - Validation errors object
 */
export const errorResponse = (res, statusCode = 500, message = 'Server Error', error = null, errors = null) => {
  const response = {
    success: false,
    message,
    data: null,
    error: {
      code: statusCode,
      message: error?.message || message
    }
  };

  if (errors) {
    response.error.errors = errors;
  }

  // Only include stack trace in development
  if (process.env.NODE_ENV === 'development' && error?.stack) {
    response.error.stack = error.stack;
  }

  return res.status(statusCode).json(response);
};

/**
 * Pagination metadata helper
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} Pagination metadata
 */
export const createPaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

/**
 * Async handler wrapper to eliminate try-catch boilerplate
 * @param {Function} fn - Async controller function
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
