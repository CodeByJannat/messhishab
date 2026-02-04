import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseUnreadMessagesOptions {
  messId?: string;
  memberId?: string;
  isManager?: boolean;
}

export function useUnreadMessages({ messId, memberId, isManager = false }: UseUnreadMessagesOptions) {
  const [hasUnreadDirect, setHasUnreadDirect] = useState(false);
  const [hasUnreadBroadcast, setHasUnreadBroadcast] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const checkUnread = useCallback(async () => {
    if (!messId) return;

    try {
      if (isManager) {
        // For manager: check unread messages from members
        const { data, error } = await supabase
          .from('direct_messages')
          .select('id')
          .eq('mess_id', messId)
          .eq('sender_type', 'member')
          .eq('is_read', false);

        if (!error && data) {
          setUnreadCount(data.length);
          setHasUnreadDirect(data.length > 0);
        }
      } else if (memberId) {
        // For member: check unread messages from manager
        const sessionToken = localStorage.getItem('member_session_token');
        
        // Skip if session token is missing
        if (!sessionToken) {
          return;
        }

        const { data, error } = await supabase.functions.invoke('get-direct-messages', {
          body: {
            member_id: memberId,
            mess_id: messId,
            session_token: sessionToken,
          },
        });

        if (!error && data?.directMessages) {
          const unread = data.directMessages.filter(
            (m: { sender_type: string; is_read: boolean }) => 
              m.sender_type === 'manager' && !m.is_read
          );
          setUnreadCount(unread.length);
          setHasUnreadDirect(unread.length > 0);
        }
      }
    } catch (error) {
      console.error('Error checking unread messages:', error);
    }
  }, [messId, memberId, isManager]);

  useEffect(() => {
    checkUnread();

    if (!messId) return;

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`unread-messages-${messId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `mess_id=eq.${messId}`,
        },
        (payload) => {
          const newMessage = payload.new as { sender_type: string };
          if (isManager && newMessage.sender_type === 'member') {
            setHasUnreadDirect(true);
            setUnreadCount(prev => prev + 1);
          } else if (!isManager && newMessage.sender_type === 'manager') {
            setHasUnreadDirect(true);
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'broadcast_messages',
          filter: `mess_id=eq.${messId}`,
        },
        () => {
          if (!isManager) {
            setHasUnreadBroadcast(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messId, isManager, checkUnread]);

  const clearUnread = useCallback(() => {
    setHasUnreadDirect(false);
    setHasUnreadBroadcast(false);
    setUnreadCount(0);
  }, []);

  return {
    hasUnread: hasUnreadDirect || hasUnreadBroadcast,
    hasUnreadDirect,
    hasUnreadBroadcast,
    unreadCount,
    clearUnread,
    refreshUnread: checkUnread,
  };
}
