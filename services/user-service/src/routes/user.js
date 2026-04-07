import express from 'express';
import { getUserProfile, updateUserProfile } from '../controllers/userController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes protected

router
  .route('/profile')
  .get(getUserProfile)
  .put(updateUserProfile);

export default router;
