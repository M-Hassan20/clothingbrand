import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../stores/auth';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <span className="text-xs text-text-secondary">Verifying credentials...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
