import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { successResponse, errorResponse } from '../../../shared/utils/responseHelper.js';
import jwt from 'jsonwebtoken';

/**
 * Cookie options for HTTP-only secure cookies
 */
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000
});

// @desc    Register new user
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return errorResponse(res, 400, 'User already exists with this email');
    }

    const user = await User.create({ name, email, password });

    if (user) {
      const token = generateToken(user._id);
      res.cookie('token', token, getCookieOptions());
      
      return successResponse(res, 201, 'User registered successfully', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    
    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);
      res.cookie('token', token, getCookieOptions());
      
      return successResponse(res, 200, 'Login successful', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      return errorResponse(res, 401, 'Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
export const logoutUser = async (req, res, next) => {
  try {
    res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
    return successResponse(res, 200, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    
    return successResponse(res, 200, 'Profile retrieved', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return errorResponse(res, 401, 'No token provided');
    }
    
    // Verify token (even if expired, we'll check grace period)
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        // Allow refresh within 7 days of expiry
        decoded = jwt.decode(token);
        const expiryTime = decoded.exp * 1000;
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        
        if (Date.now() - expiryTime > sevenDays) {
          return errorResponse(res, 401, 'Token expired beyond refresh window. Please login again.');
        }
      } else {
        throw err;
      }
    }
    
    // Get fresh user data
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }
    
    if (!user.isActive) {
      return errorResponse(res, 403, 'Account is deactivated');
    }
    
    // Generate new tokens
    const newToken = generateToken(user._id, user.role);
    
    // Set new cookie
    res.cookie('token', newToken, getCookieOptions());
    
    return successResponse(res, 200, 'Token refreshed successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check token validity (for frontend auth check)
export const checkAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return errorResponse(res, 401, 'Not authenticated');
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user || !user.isActive) {
        return errorResponse(res, 401, 'User not found or inactive');
      }
      
      return successResponse(res, 200, 'Authenticated', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 401, 'Token expired');
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};
