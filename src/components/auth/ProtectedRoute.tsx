import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'manager' | 'member';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, userRole, subscription } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            {language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check subscription for managers
  if (userRole === 'manager' && subscription) {
    const isExpired = new Date(subscription.end_date) < new Date();
    if (isExpired && location.pathname !== '/subscription') {
      return <Navigate to="/subscription" replace />;
    }
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={userRole === 'manager' ? '/dashboard' : '/member'} replace />;
  }

  return <>{children}</>;
}
