import axios from 'axios';

const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL,
  users: process.env.USER_SERVICE_URL,
  products: process.env.PRODUCT_SERVICE_URL,
  restaurants: process.env.RESTAURANT_SERVICE_URL,
  cart: process.env.CART_SERVICE_URL,
  orders: process.env.ORDER_SERVICE_URL,
  payments: process.env.PAYMENT_SERVICE_URL,
  notifications: process.env.NOTIFICATION_SERVICE_URL
};

const getServiceUrl = (service) => {
  return SERVICES[service];
};

const healthCheck = async (service) => {
  try {
    await axios.get(`${getServiceUrl(service)}/health`, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
};

export { getServiceUrl, healthCheck, SERVICES };
