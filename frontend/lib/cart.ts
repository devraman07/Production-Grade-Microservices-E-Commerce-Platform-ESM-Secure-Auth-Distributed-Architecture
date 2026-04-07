import api from './api';

// Backend API Response interface
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface CartItem {
  productId?: string;
  menuItemId?: string;
  type: 'product' | 'menu';
  name: string;
  image?: string;
  price: number;
  quantity: number;
  restaurantId?: string;
}

interface Cart {
  id?: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
}

/**
 * Get current user's cart
 */
export const getCart = async (): Promise<Cart> => {
  const { data } = await api.get<ApiResponse<{ cart: Cart }>>('/cart');
  return data.data.cart;
};

/**
 * Add item to cart
 */
export const addToCart = async (item: {
  itemId: string;
  type: 'product' | 'menu';
  quantity: number;
  restaurantId?: string;
}): Promise<Cart> => {
  const { data } = await api.post<ApiResponse<{ cart: Cart }>>('/cart', item);
  return data.data.cart;
};

/**
 * Update cart item quantity
 */
export const updateCartItem = async (update: {
  itemId: string;
  type: 'product' | 'menu';
  quantity: number;
}): Promise<Cart> => {
  const { data } = await api.put<ApiResponse<{ cart: Cart }>>('/cart', update);
  return data.data.cart;
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (item: {
  itemId: string;
  type: 'product' | 'menu';
}): Promise<Cart> => {
  const { data } = await api.delete<ApiResponse<{ cart: Cart }>>('/cart', { data: item });
  return data.data.cart;
};

/**
 * Clear entire cart
 */
export const clearCart = async (): Promise<void> => {
  await api.delete('/cart/clear');
};

/**
 * Merge guest cart with user cart after login
 */
export const mergeCart = async (sessionId: string): Promise<Cart> => {
  const { data } = await api.post<ApiResponse<{ cart: Cart }>>('/cart/merge', { sessionId });
  return data.data.cart;
};
