'use client';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { ShoppingCart, User, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from '@/hooks/use-toast';

export default function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const { totalItems } = useCartStore();

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: 'Logged out successfully' });
    } catch (error) {
      toast({ 
        title: 'Logout failed', 
        variant: 'destructive' 
      });
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="text-2xl font-bold text-orange-500">
            🍕 FoodEcom
          </Link>

          <nav className="flex items-center space-x-4">
            <Link href="/products" className="hover:text-orange-500">
              Products
            </Link>
            <Link href="/restaurants" className="hover:text-orange-500">
              Restaurants
            </Link>

            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            ) : isAuthenticated && user ? (
              <>
                <Link href="/cart" className="relative">
                  <ShoppingCart className="h-6 w-6" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </Link>
                <Link href="/orders" className="flex items-center space-x-2 hover:text-orange-500">
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline">{user.name}</span>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button>Login</Button>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
