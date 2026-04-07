'use client';
import { useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { ProtectedRoute } from '@/components/auth';
import { Button } from '@/components/ui/Button';
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCart, updateCartItem, removeFromCart } from '@/lib/cart';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/Skeleton';

function CartContent() {
  const { setCart, updateQuantity: updateLocalQuantity, removeItem: removeLocalItem } = useCartStore();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  // Fetch cart from server
  const { data: serverCart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    enabled: isAuthenticated,
  });

  // Sync server cart to local store
  useEffect(() => {
    if (serverCart) {
      // Convert to CartItem format
      const items = serverCart.items.map((item: any) => ({
        id: item.productId || item.menuItemId,
        type: item.type,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
      }));
      setCart(items, serverCart.totalItems, serverCart.totalAmount);
    }
  }, [serverCart, setCart]);

  // Update quantity mutation
  const updateMutation = useMutation({
    mutationFn: updateCartItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update cart',
        description: error.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  // Remove item mutation
  const removeMutation = useMutation({
    mutationFn: removeFromCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast({ title: 'Item removed from cart' });
    },
  });

  const { items, totalItems, totalAmount } = useCartStore();

  const handleUpdateQuantity = (itemId: string, type: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeMutation.mutate({ itemId, type: type as 'product' | 'menu' });
    } else {
      updateLocalQuantity(itemId, newQuantity);
      updateMutation.mutate({ itemId, type: type as 'product' | 'menu', quantity: newQuantity });
    }
  };

  const handleRemoveItem = (itemId: string, type: string) => {
    removeLocalItem(itemId);
    removeMutation.mutate({ itemId, type: type as 'product' | 'menu' });
  };

  if (isLoading) {
    return <CartSkeleton />;
  }

  if (totalItems === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 mx-auto mb-8 bg-gray-100 rounded-full flex items-center justify-center">
          <ShoppingBag className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Add some products or food to get started</p>
        <Link href="/products">
          <Button size="lg">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart ({totalItems} items)</h1>
      
      <div className="space-y-6 mb-12">
        {items.map((item) => (
          <div key={item.id} className="flex gap-6 bg-white p-6 rounded-2xl shadow-lg">
            <div className="relative w-24 h-24 flex-shrink-0">
              <Image
                src={item.image || '/placeholder.jpg'}
                alt={item.name}
                fill
                sizes="96px"
                className="object-cover rounded-lg"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
              <p className="text-2xl font-bold text-gray-900">
                ₹{(item.price * item.quantity).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateQuantity(item.id, item.type, item.quantity - 1)}
                disabled={updateMutation.isPending}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-semibold">{item.quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateQuantity(item.id, item.type, item.quantity + 1)}
                disabled={updateMutation.isPending}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveItem(item.id, item.type)}
              className="text-red-500 hover:text-red-700"
              disabled={removeMutation.isPending}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl sticky bottom-0">
        <div className="flex justify-between items-center mb-6">
          <span className="text-2xl font-bold">Total: ₹{totalAmount.toLocaleString()}</span>
          <span className="text-lg text-gray-600">
            {totalItems} items
          </span>
        </div>
        <Link href="/checkout">
          <Button className="w-full h-14 text-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600">
            Proceed to Checkout
          </Button>
        </Link>
      </div>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Skeleton className="h-10 w-48 mb-8" />
      <div className="space-y-6 mb-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-6 bg-white p-6 rounded-2xl shadow-lg">
            <Skeleton className="w-24 h-24 flex-shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="flex items-center space-x-3">
              <Skeleton className="w-10 h-10" />
              <Skeleton className="w-12 h-6" />
              <Skeleton className="w-10 h-10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <ProtectedRoute>
      <CartContent />
    </ProtectedRoute>
  );
}