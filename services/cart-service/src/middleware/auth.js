import axios from 'axios';
import { getSessionCart } from '../utils/cartUtils.js';

const protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1];
  req.userId = null;
  req.sessionId = req.cookies?.sessionId || req.headers['x-session-id'];

  if (token) {
    try {
      // Verify with Auth Service
      const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      req.userId = response.data.user.id;
    } catch (error) {
      console.log('Auth failed, treating as guest');
    }
  }

  next();
};

export default protect;
