import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// This page now redirects authenticated members to their dashboard
// Since login is now email/password based, no need for member selection
export default function MemberDashboard() {
  const { isAuthenticated, isLoading: memberLoading } = useMemberAuth();
  const { user, userRole, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || memberLoading) return;

    // If authenticated as member, redirect to dashboard
    if (isAuthenticated && userRole === 'member') {
      navigate('/member/dashboard', { replace: true });
      return;
    }

    // If authenticated as other role, redirect accordingly
    if (user && userRole) {
      if (userRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (userRole === 'manager') {
        navigate('/manager/dashboard', { replace: true });
      }
      return;
    }

    // Not authenticated, redirect to login
    navigate('/login', { replace: true });
  }, [isAuthenticated, user, userRole, authLoading, memberLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
