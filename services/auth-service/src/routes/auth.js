import express from 'express';
import { registerUser, loginUser, logoutUser, getUserProfile, refreshToken, checkAuth } from '../controllers/authController.js';
import { authenticate } from '../../shared/middleware/auth.js';
import { validateBody } from '../../shared/middleware/validate.js';
import { authSchemas } from '../../shared/utils/validationSchemas.js';

const router = express.Router();

// Public routes
router.post('/register', validateBody(authSchemas.register), registerUser);
router.post('/login', validateBody(authSchemas.login), loginUser);
router.post('/refresh', refreshToken);
router.get('/check-auth', checkAuth);

// Protected routes
router.post('/logout', authenticate, logoutUser);
router.get('/profile', authenticate, getUserProfile);

export default router;
