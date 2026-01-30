import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'manager' | 'member' | 'admin';
}

// Routes that require active subscription for managers
const SUBSCRIPTION_REQUIRED_ROUTES = [
  '/manager/members',
  '/manager/meals',
  '/manager/bazar',
  '/manager/deposits',
  '/manager/balance',
  '/manager/pins',
  '/manager/notifications',
];

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, userRole, subscription } = useAuth();
  const location = useLocation();

  // Show loading state while auth is being determined
  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  // Not logged in - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User exists but role is still null after loading - this shouldn't happen
  // but handle gracefully by showing loading
  if (userRole === null) {
    return <div className="min-h-screen bg-background" />;
  }

  // Check subscription for managers
  if (userRole === 'manager') {
    // Determine if subscription is active (exists AND active status AND not expired)
    const hasActiveSubscription = subscription?.status === 'active' && 
      new Date(subscription.end_date) > new Date();
    
    // Check if current route requires subscription
    const currentPath = location.pathname;
    const requiresSubscription = SUBSCRIPTION_REQUIRED_ROUTES.some(
      route => currentPath.startsWith(route)
    );
    
    // If on a route that requires subscription and no active subscription, redirect to subscription page
    if (requiresSubscription && !hasActiveSubscription) {
      return <Navigate to="/manager/subscription" replace />;
    }
  }

  // Check if user has the required role
  if (requiredRole && userRole !== requiredRole) {
    if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (userRole === 'manager') return <Navigate to="/manager/dashboard" replace />;
    return <Navigate to="/member/dashboard" replace />;
  }

  return <>{children}</>;
}
