import Notification from '../models/Notification.js';
import { sendEmail } from '../services/emailService.js';
import { sendSMS } from '../services/smsService.js';
import orderTemplate from '../templates/orderConfirmation.js';

// Send order confirmation
export const sendOrderConfirmation = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    // Get order details (mock data for demo)
    const order = {
      _id: orderId,
      orderNumber: 'ORD123456',
      items: [
        { name: 'iPhone 15', price: 79999, quantity: 1 },
        { name: 'AirPods', price: 19999, quantity: 1 }
      ],
      totalAmount: 99998,
      shippingAddress: {
        street: '123 Main St',
        city: 'Mumbai'
      }
    };

    // Create notification record
    const notification = new Notification({
      userId,
      type: 'order',
      title: `Order #${order.orderNumber} Confirmed`,
      message: `Your order has been confirmed! Total: ₹${order.totalAmount}`,
      data: { orderId }
    });

    // Email channel
    notification.channels.push({ type: 'email' });
    
    // SMS channel  
    notification.channels.push({ type: 'sms' });

    await notification.save();

    // Send Email
    const emailHtml = orderTemplate(order);
    const userEmail = 'user@example.com'; // Get from User Service in production
    const emailResult = await sendEmail(userEmail, 'Order Confirmed!', emailHtml);
    
    notification.channels.find(c => c.type === 'email').status = 
      emailResult.success ? 'sent' : 'failed';
    notification.channels.find(c => c.type === 'email').providerId = 
      emailResult.messageId;

    // Send SMS
    const smsMessage = `Order #${order.orderNumber} confirmed! Total: ₹${order.totalAmount}. ETA: 30-45 mins`;
    const smsResult = await sendSMS('9876543210', smsMessage); // Get from User Service
    
    notification.channels.find(c => c.type === 'sms').status = 
      smsResult.success ? 'sent' : 'failed';
    notification.channels.find(c => c.type === 'sms').providerId = 
      smsResult.sid;

    await notification.save();

    res.json({
      success: true,
      notificationId: notification._id,
      channels: notification.channels
    });
  } catch (error) {
    next(error);
  }
};

// Send payment success
export const sendPaymentSuccess = async (req, res, next) => {
  try {
    const { transactionId } = req.params;

    const notification = new Notification({
      userId: req.userId,
      type: 'payment',
      title: 'Payment Successful ✅',
      message: 'Your payment was successful!',
      data: { transactionId }
    });

    notification.channels.push({ type: 'push' });
    await notification.save();

    // Simulate push notification
    console.log('🔔 Push sent:', notification.message);

    res.json({
      success: true,
      notificationId: notification._id
    });
  } catch (error) {
    next(error);
  }
};

// Get user notifications
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

// Mark as read
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification || notification.userId.toString() !== req.userId) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    next(error);
  }
};
