import { z } from 'zod';

/**
 * Zod Validation Middleware
 * Validates request body against a Zod schema
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
const validate = (schema) => async (req, res, next) => {
  try {
    const validated = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params
    });
    
    // Replace request data with validated data
    req.body = validated.body || req.body;
    req.query = validated.query || req.query;
    req.params = validated.params || req.params;
    
    next();
  } catch (error) {
    // Transform Zod error to match our error format
    if (error instanceof z.ZodError) {
      error.name = 'ZodError';
    }
    next(error);
  }
};

/**
 * Validate request body only
 * @param {z.ZodSchema} schema 
 */
const validateBody = (schema) => async (req, res, next) => {
  try {
    req.body = await schema.parseAsync(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.name = 'ZodError';
    }
    next(error);
  }
};

/**
 * Validate query params only
 * @param {z.ZodSchema} schema 
 */
const validateQuery = (schema) => async (req, res, next) => {
  try {
    req.query = await schema.parseAsync(req.query);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.name = 'ZodError';
    }
    next(error);
  }
};

/**
 * Validate route params only
 * @param {z.ZodSchema} schema 
 */
const validateParams = (schema) => async (req, res, next) => {
  try {
    req.params = await schema.parseAsync(req.params);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.name = 'ZodError';
    }
    next(error);
  }
};

export {
  validate,
  validateBody,
  validateQuery,
  validateParams
};
