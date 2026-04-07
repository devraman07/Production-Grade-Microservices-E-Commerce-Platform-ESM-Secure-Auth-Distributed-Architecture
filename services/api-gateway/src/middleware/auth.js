import axios from 'axios';
import { getServiceUrl } from '../services/serviceRegistry.js';

const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token with Auth Service
    const response = await axios.get(`${getServiceUrl('auth')}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000
    });

    req.user = response.data.user;
    req.accessToken = token;
    
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const response = await axios.get(`${getServiceUrl('auth')}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      req.user = response.data.user;
      req.accessToken = token;
    }
    next();
  } catch (error) {
    // Continue as guest if auth fails
    next();
  }
};

export { requireAuth, optionalAuth };
