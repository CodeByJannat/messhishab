import { Navigate } from 'react-router-dom';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { Loader2 } from 'lucide-react';

interface MemberProtectedRouteProps {
  children: React.ReactNode;
}

export function MemberProtectedRoute({ children }: MemberProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useMemberAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
