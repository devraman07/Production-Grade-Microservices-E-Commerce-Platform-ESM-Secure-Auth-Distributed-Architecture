import express from 'express';
import axios from 'axios';
import { getServiceUrl } from '../services/serviceRegistry.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get user notifications
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const response = await axios.get(`${getServiceUrl('notifications')}/api/notifications`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// Send order confirmation notification
router.post('/order/:orderId', requireAuth, async (req, res, next) => {
  try {
    const response = await axios.post(
      `${getServiceUrl('notifications')}/api/notifications/order/${req.params.orderId}`,
      req.body,
      { headers: { Authorization: req.headers.authorization } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// Send payment success notification
router.post('/payment/:transactionId', requireAuth, async (req, res, next) => {
  try {
    const response = await axios.post(
      `${getServiceUrl('notifications')}/api/notifications/payment/${req.params.transactionId}`,
      req.body,
      { headers: { Authorization: req.headers.authorization } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

// Mark notification as read
router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const response = await axios.patch(
      `${getServiceUrl('notifications')}/api/notifications/${req.params.id}/read`,
      {},
      { headers: { Authorization: req.headers.authorization } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

export default router;
