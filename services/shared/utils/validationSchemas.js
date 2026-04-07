import { z } from 'zod';

/**
 * Auth Service Validation Schemas
 */
const authSchemas = {
  register: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name too long'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['user', 'admin']).optional().default('user')
  }),

  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  })
};

/**
 * User Service Validation Schemas
 */
const userSchemas = {
  updateProfile: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    phone: z.string().regex(/^\+?[\d\s-]{10,}$/, 'Invalid phone number').optional(),
    address: z.object({
      street: z.string().min(1, 'Street is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      zipCode: z.string().min(4, 'Invalid zip code'),
      country: z.string().min(1, 'Country is required')
    }).optional()
  })
};

/**
 * Product Service Validation Schemas
 */
const productSchemas = {
  createProduct: z.object({
    name: z.string().min(2, 'Product name must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.number().positive('Price must be positive'),
    originalPrice: z.number().positive('Original price must be positive').optional(),
    stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
    category: z.string().min(1, 'Category is required'),
    images: z.array(z.string().url('Invalid image URL')).optional(),
    ratings: z.object({
      average: z.number().min(0).max(5).optional(),
      count: z.number().int().min(0).optional()
    }).optional()
  }),

  updateProduct: z.object({
    name: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    price: z.number().positive().optional(),
    stock: z.number().int().min(0).optional(),
    category: z.string().optional()
  }),

  queryProducts: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
    search: z.string().optional(),
    category: z.string().optional(),
    sort: z.enum(['featured', 'price-low', 'price-high', 'newest']).optional().default('featured'),
    minPrice: z.string().regex(/^\d+$/).transform(Number).optional(),
    maxPrice: z.string().regex(/^\d+$/).transform(Number).optional()
  })
};

/**
 * Cart Service Validation Schemas
 */
const cartSchemas = {
  addToCart: z.object({
    itemId: z.string().min(1, 'Item ID is required'),
    type: z.enum(['product', 'menu'], 'Type must be product or menu'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
    restaurantId: z.string().optional()
  }),

  updateCartItem: z.object({
    itemId: z.string().min(1, 'Item ID is required'),
    type: z.enum(['product', 'menu']),
    quantity: z.number().int().min(0, 'Quantity cannot be negative')
  }),

  removeFromCart: z.object({
    itemId: z.string().min(1, 'Item ID is required'),
    type: z.enum(['product', 'menu'])
  })
};

/**
 * Order Service Validation Schemas
 */
const orderSchemas = {
  createOrder: z.object({
    shippingAddress: z.object({
      street: z.string().min(1, 'Street is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(1, 'State is required'),
      zipCode: z.string().min(4, 'Invalid zip code'),
      country: z.string().min(1, 'Country is required')
    }),
    paymentMethod: z.enum(['card', 'cod', 'wallet', 'upi'], 'Invalid payment method'),
    notes: z.string().max(500, 'Notes too long').optional()
  }),

  updateOrderStatus: z.object({
    status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
    transactionId: z.string().optional()
  }),

  getOrders: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
    status: z.string().optional()
  })
};

/**
 * Payment Service Validation Schemas
 */
const paymentSchemas = {
  createPaymentIntent: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    method: z.enum(['card', 'wallet', 'upi'], 'Invalid payment method'),
    amount: z.number().positive().optional() // Optional as it can be fetched from order
  }),

  processPayment: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    method: z.enum(['card', 'wallet', 'upi']),
    cardNumber: z.string().regex(/^\d{16}$/, 'Card number must be 16 digits').optional(),
    expiry: z.string().regex(/^\d{2}\/\d{2}$/, 'Invalid expiry format (MM/YY)').optional(),
    cvv: z.string().regex(/^\d{3,4}$/, 'CVV must be 3-4 digits').optional(),
    transactionId: z.string().min(1, 'Transaction ID is required')
  }),

  paymentCallback: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    status: z.enum(['success', 'failed', 'pending']),
    gatewayTransactionId: z.string().min(1, 'Gateway transaction ID is required')
  })
};

export {
  authSchemas,
  userSchemas,
  productSchemas,
  cartSchemas,
  orderSchemas,
  paymentSchemas
};
