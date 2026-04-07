import express from 'express';
import axios from 'axios';
import { getServiceUrl } from '../services/serviceRegistry.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import Joi from 'joi';

const router = express.Router();

const addToCartSchema = Joi.object({
  itemId: Joi.string().required(),
  type: Joi.string().valid('product', 'menu').required(),
  quantity: Joi.number().integer().min(1).default(1),
  restaurantId: Joi.string().when('type', {
    is: 'menu',
    then: Joi.required()
  })
});

router.post('/add', optionalAuth, validate(addToCartSchema), async (req, res, next) => {
  try {
    const response = await axios.post(`${getServiceUrl('cart')}/api/cart/add`, req.body, {
      headers: { 
        Authorization: req.accessToken ? `Bearer ${req.accessToken}` : '',
        'x-session-id': req.sessionId
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const response = await axios.get(`${getServiceUrl('cart')}/api/cart`, {
      headers: { 
        Authorization: req.accessToken ? `Bearer ${req.accessToken}` : '',
        'x-session-id': req.sessionId
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

router.put('/update', requireAuth, async (req, res, next) => {
  try {
    const response = await axios.put(`${getServiceUrl('cart')}/api/cart/update`, req.body, {
      headers: { Authorization: `Bearer ${req.accessToken}` }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

router.delete('/remove', requireAuth, async (req, res, next) => {
  try {
    const response = await axios.delete(`${getServiceUrl('cart')}/api/cart/remove`, {
      headers: { Authorization: `Bearer ${req.accessToken}` },
      data: req.body
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

export default router;
