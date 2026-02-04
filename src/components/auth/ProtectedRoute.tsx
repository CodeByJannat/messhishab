import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { createContext, useContext } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'manager' | 'member' | 'admin';
}

// Context to share read-only status with child components
interface ReadOnlyContextType {
  isReadOnly: boolean;
  expiredDaysAgo: number;
  readOnlyMonths: number;
}

const ReadOnlyContext = createContext<ReadOnlyContextType>({
  isReadOnly: false,
  expiredDaysAgo: 0,
  readOnlyMonths: 0,
});

export const useReadOnly = () => useContext(ReadOnlyContext);

// Routes that are always accessible even without active subscription
const ALWAYS_ACCESSIBLE_ROUTES = [
  '/manager/dashboard',
  '/manager/subscription',
  '/manager/payment',
  '/manager/helpdesk', // Must be accessible for support communication
];

// Routes that require active subscription for managers (but can be read-only when expired)
const SUBSCRIPTION_REQUIRED_ROUTES = [
  '/manager/members',
  '/manager/meals',
  '/manager/bazar',
  '/manager/deposits',
  '/manager/balance',
  '/manager/additional-costs',
  '/manager/pins',
  '/manager/notifications',
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

  // Check role first
  if (requiredRole && userRole !== requiredRole) {
    if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (userRole === 'manager') return <Navigate to="/manager/dashboard" replace />;
    return <Navigate to="/member/dashboard" replace />;
  }

  // Check subscription for managers
  if (userRole === 'manager') {
    const now = new Date();
    
    // Determine if subscription is active (exists AND active status AND not expired)
    const hasActiveSubscription = subscription?.status === 'active' && 
      new Date(subscription.end_date) > now;
    
    // Check if current route requires subscription
    const currentPath = location.pathname;
    const requiresSubscription = SUBSCRIPTION_REQUIRED_ROUTES.some(
      route => currentPath.startsWith(route)
    );
    
    // Calculate read-only access period
    let isReadOnly = false;
    let expiredDaysAgo = 0;
    let readOnlyMonths = 0;
    
    if (subscription && !hasActiveSubscription) {
      const endDate = new Date(subscription.end_date);
      const diffTime = now.getTime() - endDate.getTime();
      expiredDaysAgo = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      readOnlyMonths = subscription.type === 'yearly' ? 12 : 1;
      const maxReadOnlyDays = readOnlyMonths * 30;
      
      // Allow read-only access if within the grace period
      if (expiredDaysAgo <= maxReadOnlyDays) {
        isReadOnly = true;
      }
    }
    
    // If on a route that requires subscription
    if (requiresSubscription) {
      if (!hasActiveSubscription && !isReadOnly) {
        // No active subscription and no read-only access, redirect
        return <Navigate to="/manager/subscription" replace />;
      }
    }
    
    // Wrap children with read-only context
    return (
      <ReadOnlyContext.Provider value={{ isReadOnly, expiredDaysAgo, readOnlyMonths }}>
        {children}
      </ReadOnlyContext.Provider>
    );
  }

  return <>{children}</>;
}
