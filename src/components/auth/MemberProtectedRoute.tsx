import { Navigate } from 'react-router-dom';
import { useMemberAuth } from '@/contexts/MemberAuthContext';

interface MemberProtectedRouteProps {
  children: React.ReactNode;
}

export function MemberProtectedRoute({ children }: MemberProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useMemberAuth();

  // Let the child component handle loading state with its own skeleton
  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/member/dashboard" replace />;
  }

  return <>{children}</>;
}
