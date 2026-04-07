import axios from 'axios';

const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    req.userId = response.data.user.id;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

export default protect;
