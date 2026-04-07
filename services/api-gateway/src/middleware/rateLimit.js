import rateLimit from 'express-rate-limit';

const createLimiter = (windowMs, max) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

export { createLimiter };
