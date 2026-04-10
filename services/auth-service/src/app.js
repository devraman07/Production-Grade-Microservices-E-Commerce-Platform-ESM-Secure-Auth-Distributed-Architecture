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

import authRoutes from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB with optimized settings
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log('✅ MongoDB Connected - Auth Service'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Security middleware (order matters)
app.use(securityHeaders);
app.use(sanitizeMongo);
app.use(corsConfig);

// Rate limiting
app.use('/api/auth/login', rateLimiters.auth);
app.use('/api/auth/register', rateLimiters.auth);
app.use('/api', createUserRateLimiter(100, 15 * 60 * 1000)); // 100 req per 15 min per user

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use(requestLogger);

// Query limiting
app.use(queryLimiter);

// Route timeout
app.use(routeTimeout(30000));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth Service is healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Auth Service running on port ${PORT}`);
});
