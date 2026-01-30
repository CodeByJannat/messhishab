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
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const fetchMemberData = async (userId: string, accessToken: string): Promise<boolean> => {
    try {
      // Fetch member data - use maybeSingle to avoid errors
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id, name, mess_id, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (memberError) {
        console.error('Error fetching member:', memberError);
        return false;
      }

      if (!memberData) {
        console.log('No active member found for user');
        return false;
      }

      // Fetch mess data - use maybeSingle to avoid errors
      const { data: messData, error: messError } = await supabase
        .from('messes')
        .select('id, mess_id, name, current_month, status, suspend_reason')
        .eq('id', memberData.mess_id)
        .maybeSingle();

      if (messError) {
        console.error('Error fetching mess data:', messError);
        return false;
      }

      if (!messData) {
        console.log('No mess found for member');
        return false;
      }

      // Fetch subscription data - use maybeSingle to avoid errors
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('type, status, end_date')
        .eq('mess_id', memberData.mess_id)
        .eq('status', 'active')
        .maybeSingle();

      setMemberSession({
        member: memberData,
        mess: messData as MessData,
        subscription: subData || null,
        session_token: accessToken,
      });
      
      return true;
    } catch (error) {
      console.error('Error fetching member data:', error);
      return false;
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

    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        if (session?.user) {
          setUser(session.user);
          setIsDataLoaded(false);
          
          // Check if user has member role - use maybeSingle
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (roleData?.role === 'member') {
            await fetchMemberData(session.user.id, session.access_token);
          }
          
          if (mounted) {
            setIsDataLoaded(true);
            setIsLoading(false);
          }
        } else {
          setUser(null);
          setMemberSession(null);
          setIsDataLoaded(false);
          if (mounted) {
            setIsLoading(false);
          }
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (!session) {
          setIsLoading(false);
          return;
        }
        
        setUser(session.user);
        
        // Check if user has member role - use maybeSingle
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (roleData?.role === 'member') {
          await fetchMemberData(session.user.id, session.access_token);
        }
        
        if (mounted) {
          setIsDataLoaded(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing member auth:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMemberSession(null);
    setIsDataLoaded(false);
    window.location.href = '/login';
  };

  // Consider loading if initial load OR (user exists but data not yet loaded)
  const effectiveIsLoading = isLoading || (user !== null && !isDataLoaded);

  return (
    <MemberAuthContext.Provider
      value={{
        user,
        memberSession,
        isAuthenticated: !!memberSession,
        isLoading: effectiveIsLoading,
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
