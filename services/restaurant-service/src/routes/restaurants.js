import express from 'express';
import { getRestaurants, getRestaurant } from '../controllers/restaurantController.js';

const router = express.Router();

router
  .route('/')
  .get(getRestaurants);

router.route('/:id').get(getRestaurant);

export default router;
