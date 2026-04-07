import express from 'express';
import axios from 'axios';
import { getServiceUrl } from '../services/serviceRegistry.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All user routes require authentication
router.use(requireAuth);

// Get user profile
router.get('/profile', async (req, res, next) => {
  try {
    const response = await axios.get(`${getServiceUrl('users')}/api/users/profile`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// Update user profile
router.put('/profile', async (req, res, next) => {
  try {
    const response = await axios.put(`${getServiceUrl('users')}/api/users/profile`, req.body, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

export default router;
