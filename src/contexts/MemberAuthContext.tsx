import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

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
  status: string;
}

interface SubscriptionData {
  type: string;
  status: string;
  end_date: string;
}

interface MemberSession {
  user: User;
  member: MemberData;
  mess: MessData;
  subscription: SubscriptionData | null;
}

interface MemberAuthContextType {
  memberSession: MemberSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const MemberAuthContext = createContext<MemberAuthContextType | undefined>(undefined);

export function MemberAuthProvider({ children }: { children: ReactNode }) {
  const [memberSession, setMemberSession] = useState<MemberSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadMemberData(session.user);
      } else {
        setMemberSession(null);
        setIsLoading(false);
      }
    });

    // Then check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await loadMemberData(session.user);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadMemberData = async (user: User) => {
    try {
      // Check if user has member role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleData?.role !== 'member') {
        // Not a member, don't set session
        setMemberSession(null);
        setIsLoading(false);
        return;
      }

      // Get member data
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id, name, mess_id, is_active')
        .eq('user_id', user.id)
        .single();

      if (memberError || !member) {
        console.error('Member data error:', memberError);
        setMemberSession(null);
        setIsLoading(false);
        return;
      }

      if (!member.is_active) {
        // Member is deactivated
        await supabase.auth.signOut();
        setMemberSession(null);
        setIsLoading(false);
        return;
      }

      // Get mess data
      const { data: mess, error: messError } = await supabase
        .from('messes')
        .select('id, mess_id, name, current_month, status')
        .eq('id', member.mess_id)
        .single();

      if (messError || !mess) {
        console.error('Mess data error:', messError);
        setMemberSession(null);
        setIsLoading(false);
        return;
      }

      // Check if mess is suspended
      if (mess.status === 'suspended') {
        await supabase.auth.signOut();
        setMemberSession(null);
        setIsLoading(false);
        return;
      }

      // Get subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('type, status, end_date')
        .eq('mess_id', mess.id)
        .single();

      // Check subscription validity
      if (!subscription || subscription.status !== 'active' || new Date(subscription.end_date) < new Date()) {
        await supabase.auth.signOut();
        setMemberSession(null);
        setIsLoading(false);
        return;
      }

      setMemberSession({
        user,
        member: {
          id: member.id,
          name: member.name,
          mess_id: member.mess_id,
          is_active: member.is_active,
        },
        mess: {
          id: mess.id,
          mess_id: mess.mess_id,
          name: mess.name,
          current_month: mess.current_month,
          status: mess.status,
        },
        subscription: subscription ? {
          type: subscription.type,
          status: subscription.status,
          end_date: subscription.end_date,
        } : null,
      });
    } catch (error) {
      console.error('Error loading member data:', error);
      setMemberSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setMemberSession(null);
    window.location.href = '/login';
  };

  return (
    <MemberAuthContext.Provider
      value={{
        memberSession,
        isAuthenticated: !!memberSession,
        isLoading,
        logout,
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
