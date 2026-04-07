import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '@/components/features/ProductCard';

const mockProduct = {
  _id: '1',
  name: 'Test Product',
  description: 'A test product description',
  price: 100,
  originalPrice: 150,
  stock: 10,
  images: ['/test-image.jpg'],
  ratings: {
    average: 4.5,
    count: 10,
  },
};

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('A test product description')).toBeInTheDocument();
    expect(screen.getByText('₹100')).toBeInTheDocument();
    expect(screen.getByText('10 left')).toBeInTheDocument();
  });

  it('displays out of stock when stock is 0', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };
    render(<ProductCard product={outOfStockProduct} />);
    
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('displays correct star rating', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('(10)')).toBeInTheDocument();
  });
});
