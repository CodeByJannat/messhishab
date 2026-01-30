import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Mess {
  id: string;
  mess_id: string;
  mess_password: string;
  name: string | null;
  current_month: string;
  status: 'active' | 'inactive' | 'suspended';
  suspend_reason: string | null;
}

interface Subscription {
  id: string;
  type: 'monthly' | 'yearly';
  status: 'active' | 'expired' | 'cancelled';
  start_date: string;
  end_date: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  mess: Mess | null;
  subscription: Subscription | null;
  userRole: 'manager' | 'member' | 'admin' | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshMess: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [mess, setMess] = useState<Mess | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [userRole, setUserRole] = useState<'manager' | 'member' | 'admin' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch user role - use maybeSingle to avoid error when no data found
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching role:', roleError);
      }

      if (roleData) {
        setUserRole(roleData.role as 'manager' | 'member' | 'admin');
      } else {
        setUserRole(null);
      }

      // Fetch mess data (as manager) - use maybeSingle to avoid error
      const { data: messData, error: messError } = await supabase
        .from('messes')
        .select('*')
        .eq('manager_id', userId)
        .maybeSingle();

      if (messError) {
        console.error('Error fetching mess:', messError);
      }

      if (messData) {
        setMess(messData as Mess);

        // Fetch subscription - use maybeSingle to avoid error
        const { data: subData, error: subError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('mess_id', messData.id)
          .maybeSingle();

        if (subError) {
          console.error('Error fetching subscription:', subError);
        }

        if (subData) {
          setSubscription(subData as Subscription);
        } else {
          setSubscription(null);
        }
      } else {
        setMess(null);
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const refreshMess = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Check for existing session first
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserData(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state listener for subsequent changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid blocking the auth state change
          setTimeout(() => {
            if (mounted) {
              fetchUserData(session.user.id);
            }
          }, 0);
        } else {
          setMess(null);
          setSubscription(null);
          setUserRole(null);
        }
      }
    );

    return () => {
      mounted = false;
      authSubscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setMess(null);
    setSubscription(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        mess,
        subscription,
        userRole,
        isLoading,
        signOut,
        refreshMess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
