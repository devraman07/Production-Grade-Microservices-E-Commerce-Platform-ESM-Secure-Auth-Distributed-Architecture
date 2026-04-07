import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCartStore } from '@/store/cartStore';

describe('Cart Store', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.clearCart();
    });
  });

  it('adds item to cart', () => {
    const { result } = renderHook(() => useCartStore());
    
    act(() => {
      result.current.addItem({
        type: 'product',
        name: 'Test Item',
        image: '/test.jpg',
        price: 50,
        quantity: 1,
      });
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.totalItems).toBe(1);
    expect(result.current.totalAmount).toBe(50);
  });

  it('updates item quantity', () => {
    const { result } = renderHook(() => useCartStore());
    
    act(() => {
      const item = result.current.addItem({
        type: 'product',
        name: 'Test Item',
        image: '/test.jpg',
        price: 50,
        quantity: 1,
      });
      if (item) {
        result.current.updateQuantity(item.id, 3);
      }
    });
    
    expect(result.current.totalItems).toBe(3);
    expect(result.current.totalAmount).toBe(150);
  });

  it('removes item from cart', () => {
    const { result } = renderHook(() => useCartStore());
    
    let itemId: string;
    act(() => {
      const item = result.current.addItem({
        type: 'product',
        name: 'Test Item',
        image: '/test.jpg',
        price: 50,
        quantity: 1,
      });
      itemId = item?.id || '';
    });
    
    act(() => {
      result.current.removeItem(itemId);
    });
    
    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalItems).toBe(0);
  });

  it('clears cart completely', () => {
    const { result } = renderHook(() => useCartStore());
    
    act(() => {
      result.current.addItem({
        type: 'product',
        name: 'Item 1',
        image: '/test1.jpg',
        price: 50,
        quantity: 1,
      });
      result.current.addItem({
        type: 'product',
        name: 'Item 2',
        image: '/test2.jpg',
        price: 30,
        quantity: 2,
      });
    });
    
    act(() => {
      result.current.clearCart();
    });
    
    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalAmount).toBe(0);
  });

  it('aggregates quantities for same item', () => {
    const { result } = renderHook(() => useCartStore());
    
    act(() => {
      result.current.addItem({
        type: 'product',
        name: 'Same Item',
        image: '/test.jpg',
        price: 50,
        quantity: 1,
      });
      result.current.addItem({
        type: 'product',
        name: 'Same Item',
        image: '/test.jpg',
        price: 50,
        quantity: 2,
      });
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.totalItems).toBe(3);
  });
});
