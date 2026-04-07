import redis from 'redis';
import Cart from '../models/Cart.js';

const client = redis.createClient({
  url: process.env.REDIS_URL
});
client.connect();

// Generate session ID
const generateSessionId = () => {
  return 'sess_' + Math.random().toString(36).substr(2, 9);
};

// Get or create session cart
const getSessionCart = async (sessionId) => {
  if (!sessionId) {
    sessionId = generateSessionId();
  }

  let cart = await client.hGet('carts', sessionId);
  if (!cart) {
    cart = { items: [], totalItems: 0, totalAmount: 0 };
    await client.hSet('carts', sessionId, JSON.stringify(cart));
    await client.expire(sessionId, 24 * 60 * 60); // 24h
  } else {
    cart = JSON.parse(cart);
  }

  return { cart, sessionId };
};

// Merge session → user cart
const mergeCarts = async (sessionId, userId) => {
  const { cart: sessionCart } = await getSessionCart(sessionId);
  let userCart = await Cart.findOne({ userId });

  if (!userCart) {
    userCart = new Cart({ userId, items: [] });
  }

  // Merge logic
  sessionCart.items.forEach(sessionItem => {
    const existing = userCart.items.find(item => 
      item.type === sessionItem.type && 
      item[sessionItem.type + 'Id'].toString() === sessionItem[sessionItem.type + 'Id'].toString()
    );

    if (existing) {
      existing.quantity += sessionItem.quantity;
    } else {
      userCart.items.push(sessionItem);
    }
  });

  // Recalculate totals
  userCart.totalItems = userCart.items.reduce((sum, item) => sum + item.quantity, 0);
  userCart.totalAmount = userCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  await userCart.save();
  
  // Clear session
  await client.hDel('carts', sessionId);
  
  return userCart;
};

export {
  getSessionCart,
  mergeCarts,
  generateSessionId
};
