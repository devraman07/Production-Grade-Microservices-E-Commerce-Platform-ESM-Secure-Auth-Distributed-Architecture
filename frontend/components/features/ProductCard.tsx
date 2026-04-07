'use client';

import React, { useCallback, memo } from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Star, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addToCart } from '@/lib/cart';
import { toast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  // Safe image fallback with blur placeholder
  const imageUrl = product.images?.[0] || '/placeholder.jpg';

  // Backend sync mutation (only for logged-in users)
  const addToCartMutation = useMutation({
    mutationFn: addToCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast({
        title: 'Added to cart',
        description: `${product.name} has been added to your cart.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add to cart',
        description: error.response?.data?.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const handleAddToCart = useCallback(() => {
    if (product.stock === 0) return;

    // Optimistic UI update
    const cartItem = addItem({
      type: 'product',
      name: product.name,
      image: imageUrl,
      price: product.price,
      quantity: 1
    });

    // Sync with backend if authenticated
    if (isAuthenticated) {
      addToCartMutation.mutate({
        itemId: product._id,
        type: 'product',
        quantity: 1,
      });
    } else {
      toast({
        title: 'Added to cart',
        description: `${product.name} has been added to your cart.`,
      });
    }
  }, [addItem, product, imageUrl, isAuthenticated, addToCartMutation]);

  const rating = Math.round(product.ratings?.average || 0);

  return (
    <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
      
      {/* Image Section */}
      <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          priority={false}
        />

        {/* Stock Badge */}
        <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
          {product.stock} left
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        
        {/* Title */}
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-orange-500 transition">
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-gray-500 text-sm mb-3 line-clamp-2">
          {product.description}
        </p>

        {/* Ratings */}
        <div className="flex items-center mb-4">
          <div className="flex mr-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < rating
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">
            ({product.ratings?.count || 0})
          </span>
        </div>

        {/* Price + Stock */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              ₹{product.price.toLocaleString()}
            </span>

            {product.originalPrice && (
              <span className="ml-2 text-sm text-gray-400 line-through">
                ₹{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          <span
            className={`text-xs px-2 py-1 rounded-full ${
              product.stock > 0
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        {/* Button */}
        <Button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || addToCartMutation.isPending}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {addToCartMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : product.stock === 0 ? (
            'Out of Stock'
          ) : (
            'Add to Cart'
          )}
        </Button>
      </div>
    </div>
  );
});