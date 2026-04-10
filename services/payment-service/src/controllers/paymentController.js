import Transaction from '../models/Transaction.js';
import axios from 'axios';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { successResponse, errorResponse } from '../../../shared/utils/responseHelper.js';

// Create payment intent
export const createPaymentIntent = async (req, res, next) => {
  try {
    const { orderId, method, amount } = req.body;

    // Validate order exists with timeout
    const orderResponse = await axios.get(`${process.env.ORDER_SERVICE_URL}/api/orders/${orderId}`, {
      headers: { Authorization: req.headers.authorization },
      timeout: 5000
    });

    const order = orderResponse.data.order;
    
    if (order.userId.toString() !== req.userId) {
      return errorResponse(res, 403, 'Unauthorized order access');
    }

    // Create transaction
    const transactionId = 'txn_' + uuidv4().slice(0, 8) + '_' + Date.now();
    
    const transaction = new Transaction({
      orderId,
      userId: req.userId,
      amount: order.totalAmount,
      method,
      gatewayTransactionId: transactionId,
      status: 'pending'
    });

    await transaction.save();

    // Mock client secret (for Stripe-like flow)
    const clientSecret = crypto.randomBytes(32).toString('hex');

    return successResponse(res, 200, 'Payment intent created', {
      clientSecret,
      transactionId: transaction._id,
      amount: order.totalAmount,
      currency: 'INR'
    });
  } catch (error) {
    next(error);
  }
};

// Process payment (Frontend calls after card details)
export const processPayment = async (req, res, next) => {
  try {
    const { 
      orderId, 
      method, 
      cardNumber, 
      expiry, 
      cvv,
      transactionId 
    } = req.body;

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

    // 90% success rate
    const isSuccess = Math.random() > 0.1;
    const status = isSuccess ? 'success' : 'failed';

    // Update transaction
    const transaction = await Transaction.findById(transactionId);
    transaction.status = status;
    
    if (isSuccess) {
      transaction.cardLast4 = cardNumber?.slice(-4) || '****';
    }

    await transaction.save();

    if (isSuccess) {
      // Notify Order Service
      try {
        await axios.patch(`${process.env.ORDER_SERVICE_URL}/api/orders/${orderId}`, {
          status: 'confirmed',
          transactionId: transaction.gatewayTransactionId
        }, {
          headers: { Authorization: req.headers.authorization },
          timeout: 5000
        });
      } catch (notifyError) {
        console.error('Failed to notify order service:', notifyError.message);
        // Continue - don't fail payment if notification fails
      }
    }

    return successResponse(res, isSuccess ? 200 : 402, isSuccess ? 'Payment successful' : 'Payment failed', {
      status,
      transactionId: transaction.gatewayTransactionId
    });
  } catch (error) {
    return errorResponse(res, 500, 'Payment processing failed', error);
  }
};

// Payment callback (for webhooks)
export const paymentCallback = async (req, res, next) => {
  try {
    const { orderId, status, gatewayTransactionId } = req.body;

    const transaction = await Transaction.findOne({ 
      orderId, 
      gatewayTransactionId 
    });

    if (!transaction) {
      return errorResponse(res, 404, 'Transaction not found');
    }

    // Prevent updating already completed transactions
    if (['success', 'failed', 'refunded'].includes(transaction.status)) {
      return errorResponse(res, 400, `Cannot update transaction with status: ${transaction.status}`);
    }

    transaction.status = status;
    await transaction.save();

    // Update order status with timeout
    await axios.patch(`${process.env.ORDER_SERVICE_URL}/api/orders/${orderId}`, {
      status: status === 'success' ? 'confirmed' : 'cancelled'
    }, {
      headers: { 'X-Service-Key': process.env.INTERNAL_SERVICE_KEY },
      timeout: 5000
    });

    return successResponse(res, 200, 'Payment callback processed');
  } catch (error) {
    next(error);
  }
};

// Get payment history
export const getPaymentHistory = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId })
      .populate('orderId', 'orderNumber totalAmount status')
      .sort({ createdAt: -1 })
      .limit(20);

    return successResponse(res, 200, 'Payment history retrieved', { transactions });
  } catch (error) {
    next(error);
  }
};
