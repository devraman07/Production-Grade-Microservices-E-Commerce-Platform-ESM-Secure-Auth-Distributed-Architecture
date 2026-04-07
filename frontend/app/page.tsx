import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Store, Utensils } from 'lucide-react';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center mb-20">
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-6">
          Food & Shopping
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Order delicious food from local restaurants or shop premium products. 
          One platform. Everything you need.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/restaurants">
            <Button size="lg" className="group">
              Order Food 
              <Utensils className="ml-2 h-5 w-5 group-hover:translate-x-1 transition" />
            </Button>
          </Link>
          <Link href="/products">
            <Button variant="outline" size="lg" className="group">
              Shop Products
              <Store className="ml-2 h-5 w-5 group-hover:translate-x-1 transition" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mt-32">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Lightning Fast Delivery</h3>
          <p className="text-gray-600 mb-6">
            Get your food or products delivered in 30 minutes or less. 
            Real-time tracking included.
          </p>
          <Button className="w-full">Start Ordering</Button>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white p-8 rounded-2xl shadow-xl">
          <h3 className="text-2xl font-bold mb-4">Secure Payments</h3>
          <p className="mb-6">
            Multiple payment options with bank-level security. 
            Money-back guarantee.
          </p>
          <Button variant="secondary" className="w-full bg-white text-orange-500">
            Shop Securely
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
