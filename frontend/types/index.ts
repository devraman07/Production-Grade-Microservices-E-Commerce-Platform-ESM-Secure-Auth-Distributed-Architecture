export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface CartItem {
  id: string;
  type: 'product' | 'menu';
  name: string;
  image?: string;
  price: number;
  quantity: number;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: { name: string };
  stock: number;
  ratings?: {
    average: number;
    count: number;
  };
}

// Standard API response format from backend
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error: {
    code: number;
    message: string;
    errors?: Record<string, string>;
    stack?: string;
  } | null;
}

// Pagination metadata
export interface PaginationMeta {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
