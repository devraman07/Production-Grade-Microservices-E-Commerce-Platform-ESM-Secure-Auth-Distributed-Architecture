import express from 'express';
import * as PaymentController from '../controllers/paymentController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/intent', PaymentController.createPaymentIntent);
router.post('/process', PaymentController.processPayment);
router.post('/callback', PaymentController.paymentCallback);
router.get('/history', PaymentController.getPaymentHistory);

export default router;
