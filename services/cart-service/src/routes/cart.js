import express from 'express';
import {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../controllers/cartController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getCart);

router.route('/add').post(addToCart);
router.route('/update').put(updateCartItem);
router.route('/remove').delete(removeFromCart);
router.delete('/clear', clearCart);

export default router;
