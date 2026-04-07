'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ProtectedRoute } from '@/components/auth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getOrders, cancelOrder } from '@/lib/orders';
import { Package, Truck, CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-5 w-5 text-yellow-500" />,
  confirmed: <CheckCircle className="h-5 w-5 text-blue-500" />,
  preparing: <Package className="h-5 w-5 text-orange-500" />,
  'out-for-delivery': <Truck className="h-5 w-5 text-purple-500" />,
  delivered: <CheckCircle className="h-5 w-5 text-green-500" />,
  cancelled: <XCircle className="h-5 w-5 text-red-500" />,
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  'out-for-delivery': 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function OrdersContent() {
  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrders({ page: 1, limit: 20 }),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => {
      toast({ title: 'Order cancelled successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to cancel order',
        description: error.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return <OrdersSkeleton />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Failed to load orders</h2>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const orders = data?.orders || [];

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 mx-auto mb-8 bg-gray-100 rounded-full flex items-center justify-center">
          <Package className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-3xl font-bold mb-4">No orders yet</h2>
        <p className="text-gray-500 mb-8">Start shopping to place your first order</p>
        <Link href="/products">
          <Button size="lg">Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-semibold text-lg">Order #{order.orderNumber}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 mb-4">
                    {statusIcons[order.status]}
                    <span className={`text-sm font-medium ${
                      order.status === 'delivered' ? 'text-green-600' :
                      order.status === 'cancelled' ? 'text-red-600' :
                      'text-blue-600'
                    }`}>
                      {statusLabels[order.status]}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-2">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </p>

                  <p className="text-xl font-bold">
                    ₹{order.totalAmount.toLocaleString()}
                  </p>

                  {order.payment.status === 'pending' && (
                    <p className="text-sm text-orange-600 mt-1">
                      Payment pending
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end space-y-2">
                  {order.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelMutation.mutate(order.id)}
                      disabled={cancelMutation.isPending}
                    >
                      Cancel
                    </Button>
                  )}
                  <Link href={`/orders/${order.id}`}>
                    <Button variant="ghost" size="sm" className="flex items-center">
                      View Details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Skeleton className="h-10 w-48 mb-8" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-10 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <OrdersContent />
    </ProtectedRoute>
  );
}
