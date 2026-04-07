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

import productRoutes from './routes/products.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3003;

// MongoDB with optimized settings
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 15, // Higher for read-heavy product service
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log('✅ Product DB Connected'))
  .catch(err => console.error('❌ Product DB Error:', err));

// Security middleware
app.use(securityHeaders);
app.use(sanitizeMongo);
app.use(corsConfig);

// Rate limiting - more lenient for public product browsing
app.use('/api/products', rateLimiters.standard);
app.use('/api', createUserRateLimiter(200, 15 * 60 * 1000)); // 200 req per 15 min

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging & Performance
app.use(requestLogger);
app.use(queryLimiter);
app.use(routeTimeout(30000));

// Serve uploads (product images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Product Service is healthy',
    service: 'product-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/products', productRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Product Service on port ${PORT}`);
});
