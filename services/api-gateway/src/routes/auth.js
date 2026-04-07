import express from 'express';
import axios from 'axios';
import { getServiceUrl } from '../services/serviceRegistry.js';
import { validate } from '../middleware/validation.js';
import { requireAuth } from '../middleware/auth.js';
import Joi from 'joi';

const router = express.Router();

const authSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

router.post('/register', validate(authSchema), async (req, res, next) => {
  try {
    const response = await axios.post(`${getServiceUrl('auth')}/api/auth/register`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

router.post('/login', validate(authSchema), async (req, res, next) => {
  try {
    const response = await axios.post(`${getServiceUrl('auth')}/api/auth/login`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const response = await axios.get(`${getServiceUrl('auth')}/api/auth/profile`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

export default router;
