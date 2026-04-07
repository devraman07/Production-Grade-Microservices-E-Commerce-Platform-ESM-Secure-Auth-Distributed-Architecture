import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/store/authStore';

describe('Auth Store', () => {
  it('starts with unauthenticated state', () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });

  it('logs in user correctly', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const mockUser = {
      _id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
    };
    
    act(() => {
      result.current.login(mockUser);
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('logs out user correctly', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const mockUser = {
      _id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
    };
    
    act(() => {
      result.current.login(mockUser);
      result.current.logout();
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('updates loading state', () => {
    const { result } = renderHook(() => useAuthStore());
    
    act(() => {
      result.current.setLoading(false);
    });
    
    expect(result.current.isLoading).toBe(false);
    
    act(() => {
      result.current.setLoading(true);
    });
    
    expect(result.current.isLoading).toBe(true);
  });
});
