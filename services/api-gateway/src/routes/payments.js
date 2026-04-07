import express from 'express';
import axios from 'axios';
import { getServiceUrl } from '../services/serviceRegistry.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Payment routes - all require authentication
router.use(requireAuth);

// Create payment intent
router.post('/intent', async (req, res, next) => {
  try {
    const response = await axios.post(`${getServiceUrl('payments')}/api/payments/intent`, req.body, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// Process payment
router.post('/process', async (req, res, next) => {
  try {
    const response = await axios.post(`${getServiceUrl('payments')}/api/payments/process`, req.body, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// Payment callback (webhook - no auth required)
router.post('/callback', async (req, res, next) => {
  try {
    const response = await axios.post(`${getServiceUrl('payments')}/api/payments/callback`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// Get payment history
router.get('/history', async (req, res, next) => {
  try {
    const response = await axios.get(`${getServiceUrl('payments')}/api/payments/history`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

export default router;
