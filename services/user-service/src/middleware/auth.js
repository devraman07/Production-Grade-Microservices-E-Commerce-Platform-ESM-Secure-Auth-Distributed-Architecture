import { verifyToken } from '../utils/apiClient.js';
import UserProfile from '../models/User.js';

const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && 
        req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      
      // Verify with Auth Service
      const authUser = await verifyToken(token);
      
      // Attach user to req
      req.user = authUser;
      next();
    } else {
      res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

export default protect;
