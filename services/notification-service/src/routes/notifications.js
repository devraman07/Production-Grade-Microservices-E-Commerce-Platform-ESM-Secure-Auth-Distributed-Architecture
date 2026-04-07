import express from 'express';
import * as NotificationController from '../controllers/notificationController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(NotificationController.getNotifications);

router.route('/order/:orderId')
  .post(NotificationController.sendOrderConfirmation);

router.route('/payment/:transactionId')
  .post(NotificationController.sendPaymentSuccess);

router.route('/:id/read')
  .patch(NotificationController.markAsRead);

export default router;
