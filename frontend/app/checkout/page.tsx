'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { ProtectedRoute } from '@/components/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { toast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { createOrder, generateIdempotencyKey } from '@/lib/orders';
import { completePayment } from '@/lib/payments';
import { Loader2 } from 'lucide-react';

function CheckoutContent() {
  const router = useRouter();
  const { items, totalAmount, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
  const [idempotencyKey] = useState(() => generateIdempotencyKey());
  
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('cod');

  // Calculate totals
  const subtotal = totalAmount;
  const tax = subtotal * 0.18; // 18% GST
  const shipping = 50;
  const total = subtotal + tax + shipping;

  const orderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      // Proceed to payment
      if (paymentMethod === 'cod') {
        // For COD, order is complete
        toast({
          title: 'Order placed successfully!',
          description: `Order #${order.orderNumber}`,
        });
        clearCart();
        router.push('/orders');
      } else {
        // For card payment
        setStep('payment');
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create order',
        description: error.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: completePayment,
    onSuccess: (result) => {
      if (result.status === 'success') {
        toast({
          title: 'Payment successful!',
          description: 'Your order has been confirmed.',
        });
        clearCart();
        router.push('/orders');
      } else {
        toast({
          title: 'Payment failed',
          description: 'Please try again or choose a different payment method.',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Payment failed',
        description: error.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const handleSubmitShipping = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.zipCode) {
      toast({
        title: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    orderMutation.mutate({
      shippingAddress: {
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        phone: shippingAddress.phone,
      },
      paymentMethod,
      idempotencyKey,
    });
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Add items to your cart before checkout</p>
        <Button onClick={() => router.push('/products')}>Continue Shopping</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          {step === 'shipping' ? (
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitShipping} className="space-y-4">
                  <Input
                    placeholder="Street Address *"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="City *"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      required
                    />
                    <Input
                      placeholder="ZIP Code *"
                      value={shippingAddress.zipCode}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                      required
                    />
                  </div>
                  <Input
                    placeholder="State"
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                  />
                  <Input
                    placeholder="Phone Number"
                    type="tel"
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                  />

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Payment Method</h3>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          value="cod"
                          checked={paymentMethod === 'cod'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'cod')}
                          className="h-4 w-4"
                        />
                        <span>Cash on Delivery</span>
                      </label>
                      <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          value="card"
                          checked={paymentMethod === 'card'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'card')}
                          className="h-4 w-4"
                        />
                        <span>Credit/Debit Card</span>
                      </label>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14"
                    disabled={orderMutation.isPending}
                  >
                    {orderMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      `Place Order • ₹${Math.round(total).toLocaleString()}`
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Processing payment for ₹{Math.round(total).toLocaleString()}</p>
                <Button 
                  onClick={() => {
                    paymentMutation.mutate({
                      orderId: orderMutation.data?.id || '',
                      method: 'card',
                      amount: total,
                    });
                  }}
                  disabled={paymentMutation.isPending}
                  className="w-full h-14"
                >
                  {paymentMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'Complete Payment'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} x {item.quantity}</span>
                    <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>GST (18%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>₹{shipping}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>₹{Math.round(total).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <CheckoutContent />
    </ProtectedRoute>
  );
}
