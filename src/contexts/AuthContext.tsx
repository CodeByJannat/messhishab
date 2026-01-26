import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Mess {
  id: string;
  mess_id: string;
  mess_password: string;
  name: string | null;
  current_month: string;
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
  userRole: 'manager' | 'member' | null;
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
  const [userRole, setUserRole] = useState<'manager' | 'member' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleData) {
        setUserRole(roleData.role as 'manager' | 'member');
      }

      // Fetch mess data (as manager)
      const { data: messData } = await supabase
        .from('messes')
        .select('*')
        .eq('manager_id', userId)
        .single();

      if (messData) {
        setMess(messData as Mess);

        // Fetch subscription
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('mess_id', messData.id)
          .single();

        if (subData) {
          setSubscription(subData as Subscription);
        }
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
    // Set up auth state listener FIRST
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid blocking the auth state change
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setMess(null);
          setSubscription(null);
          setUserRole(null);
        }
        setIsLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setIsLoading(false);
    });

    return () => {
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
