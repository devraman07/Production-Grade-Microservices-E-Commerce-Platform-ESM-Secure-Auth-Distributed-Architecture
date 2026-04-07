'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * AuthInitializer - Mount this in root layout to check auth status on app load
 * Calls /api/auth/check-auth to verify session from HTTP-only cookie
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    // Check auth status on mount
    initializeAuth();
  }, [initializeAuth]);

  return <>{children}</>;
}
