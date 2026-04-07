import Order from '../models/Order.js';
import axios from 'axios';
import { successResponse, errorResponse, createPaginationMeta } from '../../shared/utils/responseHelper.js';
import { orderSchemas } from '../../shared/utils/validationSchemas.js';

/**
 * In-memory store for idempotency keys (use Redis in production)
 * Prevents duplicate order creation
 */
const idempotencyStore = new Map();

// Create order from cart
export const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod, notes, idempotencyKey } = req.body;
    
    // Check for duplicate order using idempotency key
    if (idempotencyKey) {
      const existingOrder = idempotencyStore.get(idempotencyKey);
      if (existingOrder) {
        return successResponse(res, 200, 'Order already created', { order: existingOrder });
      }
    }

    // Get cart
    const cartResponse = await axios.get(`${process.env.CART_SERVICE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${req.token}` },
      timeout: 5000
    });

    const cart = cartResponse.data.data?.cart || cartResponse.data.cart;
    
    if (!cart || cart.items.length === 0) {
      return errorResponse(res, 400, 'Cart is empty');
    }

    // Check for existing pending order from same cart (prevent duplicates)
    const existingPendingOrder = await Order.findOne({
      userId: req.userId,
      status: 'pending',
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Within last 5 minutes
    });

    if (existingPendingOrder) {
      return successResponse(res, 200, 'You have a pending order being processed', {
        order: {
          id: existingPendingOrder._id,
          orderNumber: existingPendingOrder.orderNumber,
          status: existingPendingOrder.status
        }
      });
    }

    // Calculate totals
    const subtotal = cart.totalAmount;
    const tax = subtotal * 0.18; // 18% GST
    const shipping = 50;
    const totalAmount = subtotal + tax + shipping;

    // Create order
    const order = new Order({
      userId: req.userId,
      items: cart.items.map(item => ({
        ...item,
        _id: undefined // Remove Mongo _id
      })),
      shippingAddress,
      payment: {
        method: paymentMethod,
        amount: totalAmount,
        status: 'pending'
      },
      subtotal,
      tax,
      shipping,
      totalAmount
    });

    if (notes) order.notes = notes;
    
    await order.save();

    // Store in idempotency cache
    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, {
        id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status
      });
      // Clean up after 24 hours
      setTimeout(() => idempotencyStore.delete(idempotencyKey), 24 * 60 * 60 * 1000);
    }

    // Clear cart after successful order creation
    try {
      await axios.delete(`${process.env.CART_SERVICE_URL}/api/cart/clear`, {
        headers: { Authorization: `Bearer ${req.token}` },
        timeout: 5000
      });
    } catch (cartError) {
      console.error('Failed to clear cart:', cartError.message);
      // Don't fail the order if cart clearing fails
    }

    return successResponse(res, 201, 'Order created successfully', {
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get user orders with standardized pagination
export const getUserOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const orders = await Order.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate('items.productId', 'name')
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments({ userId: req.userId });

    const meta = createPaginationMeta(page, limit, total);

    return successResponse(res, 200, 'Orders retrieved successfully', {
      orders: orders.map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt
      }))
    }, meta);
  } catch (error) {
    next(error);
  }
};

// Get single order
export const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!order) {
      return errorResponse(res, 404, 'Order not found');
    }

    return successResponse(res, 200, 'Order retrieved successfully', { order });
  } catch (error) {
    next(error);
  }
};

// Update order status (Admin/Payment callback)
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, transactionId } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return errorResponse(res, 404, 'Order not found');
    }

    // Validate status transition
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'cancelled'],
      'delivered': [],
      'cancelled': []
    };

    if (!validTransitions[order.status].includes(status)) {
      return errorResponse(res, 400, `Cannot transition from ${order.status} to ${status}`);
    }

    // Update payment status if provided
    if (transactionId) {
      order.payment.status = 'paid';
      order.payment.transactionId = transactionId;
    }

    // Update order status
    order.status = status;

    await order.save();

    return successResponse(res, 200, 'Order status updated successfully', {
      order: {
        id: order._id,
        status: order.status,
        paymentStatus: order.payment.status
      }
    });
  } catch (error) {
    next(error);
  }
};
