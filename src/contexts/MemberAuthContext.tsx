import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';

interface MemberSession {
  member: {
    id: string;
    name: string;
  };
  mess: {
    id: string;
    mess_id: string;
    name: string | null;
    current_month: string;
  };
  subscription: {
    type: string;
    status: string;
    end_date: string;
  } | null;
  session_token: string;
}

interface MemberAuthContextType {
  memberSession: MemberSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

const MemberAuthContext = createContext<MemberAuthContextType | undefined>(undefined);

export function MemberAuthProvider({ children }: { children: ReactNode }) {
  const [memberSession, setMemberSession] = useState<MemberSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing session
    const storedSession = localStorage.getItem('member_session');
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        setMemberSession(parsed);
      } catch (e) {
        localStorage.removeItem('member_session');
      }
    }
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('member_session');
    setMemberSession(null);
    window.location.href = '/login';
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    memberSession,
    isAuthenticated: !!memberSession,
    isLoading,
    logout,
  }), [memberSession, isLoading, logout]);

  return (
    <MemberAuthContext.Provider value={value}>
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
