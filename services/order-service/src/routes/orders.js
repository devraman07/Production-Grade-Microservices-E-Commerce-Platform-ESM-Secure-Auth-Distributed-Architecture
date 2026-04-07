import express from 'express';
import * as OrderController from '../controllers/orderController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(OrderController.createOrder)
  .get(OrderController.getUserOrders);

router.route('/:id')
  .get(OrderController.getOrder)
  .patch(OrderController.updateOrderStatus);

export default router;
