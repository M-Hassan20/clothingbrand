import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthResponse } from '@/types/api';

interface AuthState {
  token: string | null;
  userId: string | null;
  email: string | null;
  fullName: string | null;
  role: 'ADMIN' | 'CUSTOMER' | null;
  isAuthenticated: boolean;
  setAuth: (authData: AuthResponse) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      email: null,
      fullName: null,
      role: null,
      isAuthenticated: false,
      setAuth: (authData) =>
        set({
          token: authData.token,
          userId: authData.userId,
          email: authData.email,
          fullName: authData.fullName,
          role: authData.role,
          isAuthenticated: true,
        }),
      clearAuth: () =>
        set({
          token: null,
          userId: null,
          email: null,
          fullName: null,
          role: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'haus-of-hafsah-auth', // localStorage key
    }
  )
);
