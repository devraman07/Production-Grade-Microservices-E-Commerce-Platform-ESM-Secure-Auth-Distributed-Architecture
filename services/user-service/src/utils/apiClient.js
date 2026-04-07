import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.AUTH_SERVICE_URL,
  timeout: 10000
});

// Verify JWT token with Auth Service
const verifyToken = async (token) => {
  try {
    const response = await apiClient.get('/api/auth/profile', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.user;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export { verifyToken };
