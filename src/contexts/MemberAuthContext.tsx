import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface MemberData {
  id: string;
  name: string;
  mess_id: string;
  is_active: boolean;
}

interface MessData {
  id: string;
  mess_id: string;
  name: string | null;
  current_month: string;
  status: 'active' | 'inactive' | 'suspended';
  suspend_reason: string | null;
}

interface SubscriptionData {
  type: string;
  status: string;
  end_date: string;
}

interface MemberSession {
  member: MemberData;
  mess: MessData;
  subscription: SubscriptionData | null;
  session_token: string; // For backward compatibility with edge functions
}

interface MemberAuthContextType {
  user: User | null;
  memberSession: MemberSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshMemberData: () => Promise<void>;
}

const MemberAuthContext = createContext<MemberAuthContextType | undefined>(undefined);

export function MemberAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [memberSession, setMemberSession] = useState<MemberSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMemberData = async (userId: string, accessToken: string) => {
    try {
      // Fetch member data
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id, name, mess_id, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (memberError || !memberData) {
        console.log('No active member found for user');
        return;
      }

      // Fetch mess data
      const { data: messData, error: messError } = await supabase
        .from('messes')
        .select('id, mess_id, name, current_month, status, suspend_reason')
        .eq('id', memberData.mess_id)
        .single();

      if (messError || !messData) {
        console.error('Error fetching mess data:', messError);
        return;
      }

      // Fetch subscription data
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('type, status, end_date')
        .eq('mess_id', memberData.mess_id)
        .eq('status', 'active')
        .single();

      setMemberSession({
        member: memberData,
        mess: messData as MessData,
        subscription: subData || null,
        session_token: accessToken, // Use access token for edge function calls
      });
    } catch (error) {
      console.error('Error fetching member data:', error);
    }
  };

  const refreshMemberData = async () => {
    if (user) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await fetchMemberData(user.id, session.access_token);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session?.user) {
          setUser(session.user);
          
          // Check if user has member role
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();

          if (roleData?.role === 'member') {
            await fetchMemberData(session.user.id, session.access_token);
          }
        }
      } catch (error) {
        console.error('Error initializing member auth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        if (session?.user) {
          setUser(session.user);
          
          // Check role and fetch member data
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();

          if (roleData?.role === 'member') {
            await fetchMemberData(session.user.id, session.access_token);
          }
        } else {
          setUser(null);
          setMemberSession(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMemberSession(null);
    window.location.href = '/login';
  };

  return (
    <MemberAuthContext.Provider
      value={{
        user,
        memberSession,
        isAuthenticated: !!memberSession,
        isLoading,
        logout,
        refreshMemberData,
      }}
    >
      {children}
    </MemberAuthContext.Provider>
  );
}

export function useMemberAuth() {
  const context = useContext(MemberAuthContext);
  if (context === undefined) {
    throw new Error('useMemberAuth must be used within a MemberAuthProvider');
  }
  return context;
}
