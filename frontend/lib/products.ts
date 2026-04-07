import api from './api';
import { Product } from '@/types';

// Backend API Response interface
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ProductsData {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Fetch products with filters
 */
export const fetchProducts = async (params?: {
  search?: string;
  category?: string;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<ProductsData> => {
  const searchParams = new URLSearchParams();
  
  if (params?.search) searchParams.append('search', params.search);
  if (params?.category) searchParams.append('category', params.category);
  if (params?.sort) searchParams.append('sort', params.sort);
  if (params?.page) searchParams.append('page', String(params.page));
  if (params?.limit) searchParams.append('limit', String(params.limit));
  
  const { data } = await api.get<ApiResponse<ProductsData>>(`/products?${searchParams}`);
  return data.data;
};

/**
 * Fetch single product by ID
 */
export const fetchProductById = async (id: string): Promise<Product> => {
  const { data } = await api.get<ApiResponse<{ product: Product }>>(`/products/${id}`);
  return data.data.product;
};

/**
 * Fetch product categories
 */
export const fetchCategories = async (): Promise<{ _id: string; name: string; slug: string }[]> => {
  const { data } = await api.get<ApiResponse<{ categories: { _id: string; name: string; slug: string }[] }>>('/categories');
  return data.data.categories;
};
