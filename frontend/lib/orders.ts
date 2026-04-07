import api from './api';

// Backend API Response interface
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface OrderItem {
  productId?: string;
  menuItemId?: string;
  type: 'product' | 'menu';
  name: string;
  image?: string;
  price: number;
  quantity: number;
  restaurantId?: string;
}

interface ShippingAddress {
  street: string;
  city: string;
  state?: string;
  zipCode: string;
  country?: string;
  phone?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'preparing' | 'out-for-delivery' | 'delivered' | 'cancelled';
  payment: {
    method: 'card' | 'cod' | 'wallet';
    status: 'pending' | 'paid' | 'failed';
    amount: number;
    transactionId?: string;
  };
  shippingAddress: ShippingAddress;
  subtotal: number;
  tax: number;
  shipping: number;
  totalAmount: number;
  createdAt: string;
}

interface CreateOrderRequest {
  shippingAddress: ShippingAddress;
  paymentMethod: 'card' | 'cod' | 'wallet';
  notes?: string;
  idempotencyKey?: string; // Prevent duplicate orders
}

interface OrdersData {
  orders: Order[];
  meta: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * Create a new order
 * Uses idempotency key to prevent duplicate submissions
 */
export const createOrder = async (order: CreateOrderRequest): Promise<Order> => {
  const { data } = await api.post<ApiResponse<{ order: Order }>>('/orders', order);
  return data.data.order;
};

/**
 * Get user's orders with pagination
 */
export const getOrders = async (params?: {
  page?: number;
  limit?: number;
}): Promise<OrdersData> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', String(params.page));
  if (params?.limit) searchParams.append('limit', String(params.limit));
  
  const { data } = await api.get<ApiResponse<OrdersData>>(`/orders?${searchParams}`);
  return data.data;
};

/**
 * Get single order by ID
 */
export const getOrderById = async (orderId: string): Promise<Order> => {
  const { data } = await api.get<ApiResponse<{ order: Order }>>(`/orders/${orderId}`);
  return data.data.order;
};

/**
 * Cancel an order (if still pending)
 */
export const cancelOrder = async (orderId: string): Promise<Order> => {
  const { data } = await api.patch<ApiResponse<{ order: Order }>>(`/orders/${orderId}`, {
    status: 'cancelled'
  });
  return data.data.order;
};

/**
 * Generate idempotency key for order creation
 * Use this to prevent duplicate orders on double-click
 */
export const generateIdempotencyKey = (): string => {
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
