import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import { globalErrorHandler, notFoundHandler } from '../../shared/middleware/errorHandler.js';
import { corsConfig, securityHeaders, rateLimiters } from '../../shared/config/middleware.js';
import { requestLogger } from '../../shared/utils/logger.js';
import { sanitizeMongo, createUserRateLimiter, queryLimiter } from '../../shared/middleware/security.js';
import { routeTimeout } from '../../shared/middleware/performance.js';

import paymentRoutes from './routes/payment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3007;

// MongoDB with optimized settings
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log('✅ Payment DB Connected'))
  .catch(err => console.error('❌ Payment DB Error'));

// Security middleware
app.use(securityHeaders);
app.use(sanitizeMongo);
app.use(corsConfig);

// Rate limiting - stricter for payment
app.use('/api/payment', rateLimiters.payment);
app.use('/api/payment', createUserRateLimiter(20, 60 * 1000)); // 20 per minute for payments
app.use('/api', createUserRateLimiter(100, 15 * 60 * 1000));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: 'application/json' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging & Performance
app.use(requestLogger);
app.use(queryLimiter);
app.use(routeTimeout(45000)); // Longer timeout for payment processing

// Serve uploads (receipts, etc)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Payment Service is healthy',
    service: 'payment-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/payment', paymentRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`💳 Payment Service on port ${PORT}`);
});
