import { createContext, useContext, useState } from 'react';
import type { AdminUser } from '../api/client';

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: AdminUser) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('admin_token'));
  const [user, setUser] = useState<AdminUser | null>(() => {
    const savedUser = localStorage.getItem('admin_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as AdminUser;
        return parsed.role === 'ADMIN' ? parsed : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading] = useState(false);

  const login = (newToken: string, newUser: AdminUser) => {
    localStorage.setItem('admin_token', newToken);
    localStorage.setItem('admin_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && user?.role === 'ADMIN',
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
