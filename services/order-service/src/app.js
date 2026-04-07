import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';

import { globalErrorHandler, notFoundHandler } from '../../shared/middleware/errorHandler.js';
import { corsConfig, securityHeaders, rateLimiters } from '../../shared/config/middleware.js';
import { requestLogger } from '../../shared/utils/logger.js';
import { sanitizeMongo, createUserRateLimiter, queryLimiter } from '../../shared/middleware/security.js';
import { routeTimeout } from '../../shared/middleware/performance.js';

import orderRoutes from './routes/orders.js';

const app = express();
const PORT = process.env.PORT || 3006;

// MongoDB with optimized settings
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log('✅ Order DB Connected'))
  .catch(err => console.error('❌ Order DB Error'));

// Security middleware
app.use(securityHeaders);
app.use(sanitizeMongo);
app.use(corsConfig);

// Rate limiting
app.use('/api/orders', rateLimiters.standard);
app.use('/api', createUserRateLimiter(100, 15 * 60 * 1000));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging & Performance
app.use(requestLogger);
app.use(queryLimiter);
app.use(routeTimeout(30000));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Order Service is healthy',
    service: 'order-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/orders', orderRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`📦 Order Service on port ${PORT}`);
});
