import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AdminRole } from '@/types';
import { Loader2, Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Roles allowed through, super admin excluded - it always passes. Omit to
   * require only that someone is signed in.
   *
   * This hides the screen; the server guard is what actually protects the data.
   */
  roles?: AdminRole[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, can } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !can(...roles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-sm text-center space-y-3">
          <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
          <h1 className="text-lg font-semibold">You don't have access to this page</h1>
          <p className="text-sm text-muted-foreground">
            Your admin role doesn't include this area. Ask a super admin if you need it.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
