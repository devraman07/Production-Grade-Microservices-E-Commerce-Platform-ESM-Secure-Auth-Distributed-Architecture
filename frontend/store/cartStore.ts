import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  isLoading: boolean;
  addItem: (item: Omit<CartItem, 'id'>) => CartItem;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  setCart: (items: CartItem[], totalItems: number, totalAmount: number) => void;
  setLoading: (loading: boolean) => void;
}

// Helper to calculate totals
const calculateTotals = (items: CartItem[]) => ({
  totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
  totalAmount: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
});

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalAmount: 0,
      isLoading: false,

      addItem: (itemData) => {
        const item: CartItem = { id: crypto.randomUUID(), ...itemData };
        
        set((state) => {
          const existing = state.items.find((i) => i.name === item.name);
          let items: CartItem[];

          if (existing) {
            items = state.items.map((i) =>
              i.name === item.name
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            );
          } else {
            items = [...state.items, item];
          }

          const totals = calculateTotals(items);
          return { items, ...totals };
        });

        return item;
      },

      updateQuantity: (id, quantity) => {
        set((state) => {
          const items = state.items.map((item) =>
            item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item
          ).filter((item) => item.quantity > 0);

          const totals = calculateTotals(items);
          return { items, ...totals };
        });
      },

      removeItem: (id) => {
        set((state) => {
          const items = state.items.filter((item) => item.id !== id);
          const totals = calculateTotals(items);
          return { items, ...totals };
        });
      },

      clearCart: () => set({ items: [], totalItems: 0, totalAmount: 0, isLoading: false }),

      setCart: (items, totalItems, totalAmount) =>
        set({ items, totalItems, totalAmount }),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        totalItems: state.totalItems,
        totalAmount: state.totalAmount,
      }),
    }
  )
);
