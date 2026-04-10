import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cookieParser from 'cookie-parser';


// Shared middleware
import { globalErrorHandler } from '../../shared/middleware/errorHandler.js';
import { corsConfig, securityHeaders, rateLimiters } from '../../shared/config/middleware.js';
import { requestLogger } from '../../shared/utils/logger.js';
import { sanitizeMongo, createUserRateLimiter } from '../../shared/middleware/security.js';
import { routeTimeout } from '../../shared/middleware/performance.js';

import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import restaurantsRoutes from './routes/restaurants.js';
import cartRoutes from './routes/cart.js';
import ordersRoutes from './routes/orders.js';
import paymentsRoutes from './routes/payments.js';
import notificationsRoutes from './routes/notifications.js';
import usersRoutes from './routes/users.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(securityHeaders);
app.use(sanitizeMongo);

app.use(corsConfig);


// Rate limiting at gateway level
app.use('/api/auth', rateLimiters.auth);
app.use('/api', rateLimiters.standard);
app.use('/api', createUserRateLimiter(200, 15 * 60 * 1000)); // Gateway has higher limits

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging & Performance
app.use(requestLogger);
app.use(routeTimeout(30000));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Gateway is healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/restaurants', restaurantsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/notifications', notificationsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`🌐 API Gateway running on http://localhost:${PORT}`);
});

