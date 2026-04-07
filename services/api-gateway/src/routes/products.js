import express from 'express';
import axios from 'axios';
import { getServiceUrl } from '../services/serviceRegistry.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const response = await axios.get(`${getServiceUrl('products')}/api/products`, {
      params: req.query,
      headers: req.accessToken ? { Authorization: `Bearer ${req.accessToken}` } : {}
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const response = await axios.get(`${getServiceUrl('products')}/api/products/${req.params.id}`, {
      headers: req.accessToken ? { Authorization: `Bearer ${req.accessToken}` } : {}
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

export default router;
