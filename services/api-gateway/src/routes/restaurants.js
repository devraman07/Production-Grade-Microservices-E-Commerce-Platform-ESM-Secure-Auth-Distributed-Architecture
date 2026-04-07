import express from 'express';
import axios from 'axios';
import { getServiceUrl } from '../services/serviceRegistry.js';
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const response = await axios.get(`${getServiceUrl('restaurants')}/api/restaurants`, { params: req.query });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

export default router;
