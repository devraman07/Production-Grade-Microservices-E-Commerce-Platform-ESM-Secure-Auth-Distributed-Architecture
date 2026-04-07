import Cart from '../models/Cart.js';
import { getSessionCart } from '../utils/cartUtils.js';
import axios from 'axios';
import { successResponse, errorResponse } from '../../shared/utils/responseHelper.js';
import redis from 'redis';

// Add to cart
export const addToCart = async (req, res, next) => {
  try {
    const { itemId, type, quantity = 1, restaurantId } = req.body;
    const sessionId = req.sessionId || req.cookies.sessionId;

    let cart, isUserCart = false;

    // Priority: User cart > Session cart
    if (req.userId) {
      cart = await Cart.findOne({ userId: req.userId });
      isUserCart = true;
    } else {
      const sessionResult = await getSessionCart(sessionId);
      cart = sessionResult.cart;
    }

    // Fetch item details
    let itemDetails;
    if (type === 'product') {
      const response = await axios.get(`${process.env.PRODUCT_SERVICE_URL}/api/products/${itemId}`);
      itemDetails = response.data.product;
    } else {
      const response = await axios.get(`${process.env.RESTAURANT_SERVICE_URL}/api/restaurants/${restaurantId}`);
      itemDetails = response.data.menu.find(item => item._id.toString() === itemId);
    }

    // Add/Update item
    const cartItem = {
      [type + 'Id']: itemId,
      type,
      name: itemDetails.name,
      image: itemDetails.image || itemDetails.images?.[0],
      price: itemDetails.price,
      quantity,
      restaurantId: type === 'menu' ? restaurantId : undefined
    };

    if (isUserCart) {
      // User cart logic
      const existingIndex = cart.items.findIndex(item => 
        item.type === type && item[type + 'Id'].toString() === itemId
      );

      if (existingIndex > -1) {
        cart.items[existingIndex].quantity += quantity;
      } else {
        cart.items.push(cartItem);
      }
    } else {
      // Session cart logic
      const existingIndex = cart.items.findIndex(item => 
        item.type === type && item[type + 'Id'] === itemId
      );

      if (existingIndex > -1) {
        cart.items[existingIndex].quantity += quantity;
      } else {
        cart.items.push(cartItem);
      }

      // Save to Redis
      const redisClient = redis.createClient({ url: process.env.REDIS_URL });
      await redisClient.connect();
      await redisClient.hSet('carts', sessionId, JSON.stringify(cart));
      await redisClient.expire(sessionId, 24 * 60 * 60);
      await redisClient.quit();
    }

    // Calculate totals
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (isUserCart) {
      cart.totalItems = totalItems;
      cart.totalAmount = totalAmount;
      await cart.save();
    } else {
      cart.totalItems = totalItems;
      cart.totalAmount = totalAmount;
    }

    return successResponse(res, 200, 'Item added to cart', {
      cart: {
        id: isUserCart ? cart._id : sessionId,
        items: cart.items,
        totalItems,
        totalAmount: Number(totalAmount.toFixed(2))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get cart
export const getCart = async (req, res, next) => {
  try {
    let cart;

    if (req.userId) {
      cart = await Cart.findOne({ userId: req.userId });
    } else {
      const { cart: sessionCart, sessionId } = await getSessionCart(req.sessionId);
      cart = sessionCart;
      res.cookie('sessionId', sessionId, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
    }

    return successResponse(res, 200, 'Cart retrieved successfully', {
      cart: cart || { items: [], totalItems: 0, totalAmount: 0 }
    });
  } catch (error) {
    next(error);
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res, next) => {
  try {
    const { itemId, type, quantity } = req.body;

    let cart = req.userId 
      ? await Cart.findOne({ userId: req.userId })
      : (await getSessionCart(req.sessionId)).cart;

    const itemIndex = cart.items.findIndex(item => 
      item.type === type && item[type + 'Id'].toString() === itemId
    );

    if (itemIndex === -1) {
      return errorResponse(res, 404, 'Item not found in cart');
    }

    cart.items[itemIndex].quantity = quantity;

    // Remove if quantity = 0
    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    }

    // Recalculate
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Save
    if (req.userId) {
      await cart.save();
    } else {
      // Save to Redis
      const redisClient = redis.createClient({ url: process.env.REDIS_URL });
      await redisClient.connect();
      await redisClient.hSet('carts', req.sessionId, JSON.stringify(cart));
      await redisClient.expire(req.sessionId, 24 * 60 * 60);
      await redisClient.quit();
    }

    return successResponse(res, 200, 'Cart updated successfully', {
      cart: {
        items: cart.items,
        totalItems: cart.totalItems,
        totalAmount: Number(cart.totalAmount.toFixed(2))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Remove from cart
export const removeFromCart = async (req, res, next) => {
  try {
    const { itemId, type } = req.body;
    
    let cart = req.userId 
      ? await Cart.findOne({ userId: req.userId })
      : (await getSessionCart(req.sessionId)).cart;

    const itemIndex = cart.items.findIndex(item => 
      item.type === type && item[type + 'Id'].toString() === itemId
    );

    if (itemIndex === -1) {
      return errorResponse(res, 404, 'Item not found in cart');
    }

    cart.items.splice(itemIndex, 1);

    // Recalculate
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Save
    if (req.userId) {
      await cart.save();
    } else {
      const redisClient = redis.createClient({ url: process.env.REDIS_URL });
      await redisClient.connect();
      await redisClient.hSet('carts', req.sessionId, JSON.stringify(cart));
      await redisClient.expire(req.sessionId, 24 * 60 * 60);
      await redisClient.quit();
    }

    return successResponse(res, 200, 'Item removed from cart', {
      cart: {
        items: cart.items,
        totalItems: cart.totalItems,
        totalAmount: Number(cart.totalAmount.toFixed(2))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Clear cart
export const clearCart = async (req, res, next) => {
  try {
    if (req.userId) {
      await Cart.findOneAndDelete({ userId: req.userId });
    } else {
      const redisClient = redis.createClient({ url: process.env.REDIS_URL });
      await redisClient.connect();
      await redisClient.hDel('carts', req.sessionId);
      await redisClient.quit();
    }

    return successResponse(res, 200, 'Cart cleared successfully', {
      cart: { items: [], totalItems: 0, totalAmount: 0 }
    });
  } catch (error) {
    next(error);
  }
};
