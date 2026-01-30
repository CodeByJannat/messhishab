import { Navigate } from 'react-router-dom';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { useAuth } from '@/contexts/AuthContext';

interface MemberProtectedRouteProps {
  children: React.ReactNode;
}

export function MemberProtectedRoute({ children }: MemberProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useMemberAuth();
  const { user, userRole, isLoading: authLoading } = useAuth();

  // Show loading state
  if (isLoading || authLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  // If user is authenticated but not a member, redirect to appropriate dashboard
  if (user && userRole && userRole !== 'member') {
    if (userRole === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated at all, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
