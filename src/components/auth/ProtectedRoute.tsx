import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'manager' | 'member' | 'admin';
}

// Routes that are always accessible even without active subscription
const ALWAYS_ACCESSIBLE_ROUTES = [
  '/dashboard',
  '/dashboard/subscription',
  '/dashboard/payment',
  '/dashboard/helpdesk', // Must be accessible for support communication
];

// Routes that require active subscription for managers
const SUBSCRIPTION_REQUIRED_ROUTES = [
  '/dashboard/members',
  '/dashboard/meals',
  '/dashboard/bazar',
  '/dashboard/deposits',
  '/dashboard/balance',
  '/dashboard/pins',
  '/dashboard/notifications',
];

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, userRole, subscription } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();

  if (isLoading) {
    // Return minimal loading state - individual pages handle their own skeleton loading
    return <div className="min-h-screen bg-background" />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
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
      return <Navigate to="/dashboard/subscription" replace />;
    }
  }

  if (requiredRole && userRole !== requiredRole) {
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'manager') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/member" replace />;
  }

  return <>{children}</>;
}
