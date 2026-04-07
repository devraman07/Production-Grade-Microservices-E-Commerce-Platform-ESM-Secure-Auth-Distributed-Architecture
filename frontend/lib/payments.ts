import api from './api';

// Backend API Response interface
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaymentIntent {
  clientSecret: string;
  transactionId: string;
  amount: number;
  currency: string;
}

interface PaymentRequest {
  orderId: string;
  method: 'card' | 'cod' | 'wallet' | 'upi';
  amount: number;
}

interface ProcessPaymentRequest extends PaymentRequest {
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
  transactionId: string;
}

interface PaymentResult {
  status: 'success' | 'failed';
  transactionId: string;
}

/**
 * Create payment intent for an order
 */
export const createPaymentIntent = async (request: PaymentRequest): Promise<PaymentIntent> => {
  const { data } = await api.post<ApiResponse<PaymentIntent>>('/payments/intent', request);
  return data.data;
};

/**
 * Process payment after collecting card details
 */
export const processPayment = async (request: ProcessPaymentRequest): Promise<PaymentResult> => {
  const { data } = await api.post<ApiResponse<PaymentResult>>('/payments/process', request);
  return data.data;
};

/**
 * Get payment history
 */
export const getPaymentHistory = async (): Promise<{
  transactions: Array<{
    _id: string;
    orderId: string;
    amount: number;
    status: 'pending' | 'success' | 'failed' | 'refunded';
    method: string;
    createdAt: string;
  }>;
}> => {
  const { data } = await api.get<ApiResponse<{ transactions: any[] }>>('/payments/history');
  return data.data;
};

/**
 * Complete payment flow - creates intent and processes in one call
 * Use this for COD (no card details needed)
 */
export const completePayment = async (request: PaymentRequest): Promise<PaymentResult> => {
  // For COD, no need for payment intent
  if (request.method === 'cod') {
    const { data } = await api.post<ApiResponse<PaymentResult>>('/payments/cod', {
      orderId: request.orderId
    });
    return data.data;
  }
  
  // For card/wallet: create intent first
  const intent = await createPaymentIntent(request);
  
  // Then process (mock for now - in production this would be Stripe/payment gateway)
  const result = await processPayment({
    ...request,
    transactionId: intent.transactionId,
  });
  
  return result;
};
