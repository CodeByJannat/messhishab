import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, MessageCircle, Users, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ConversationList } from '@/components/messaging/ConversationList';
import { ChatArea } from '@/components/messaging/ChatArea';
import { NewMessageModal } from '@/components/messaging/NewMessageModal';
import { BroadcastList } from '@/components/messaging/BroadcastList';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

interface Member {
  id: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

interface DirectMessage {
  id: string;
  member_id: string;
  sender_type: 'manager' | 'member';
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Broadcast {
  id: string;
  message: string;
  created_at: string;
}

export default function MessagesPage() {
  const { language } = useLanguage();
  const { mess } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('individual');
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [allMembers, setAllMembers] = useState<{ id: string; name: string }[]>([]);

  const { clearUnread, refreshUnread } = useUnreadMessages({
    messId: mess?.id,
    isManager: true,
  });

  // Fetch members with conversations
  const fetchMembersWithConversations = useCallback(async () => {
    if (!mess) return;
    setIsLoading(true);

    try {
      // Fetch all members
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('id, name, is_active')
        .eq('mess_id', mess.id)
        .eq('is_active', true)
        .order('name');

      if (membersError) throw membersError;

      setAllMembers(membersData || []);

      // Fetch all direct messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('mess_id', mess.id)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Group messages by member
      const memberMessageMap = new Map<string, { lastMessage: string; lastMessageTime: string; unreadCount: number }>();
      
      for (const msg of messagesData || []) {
        if (!memberMessageMap.has(msg.member_id)) {
          memberMessageMap.set(msg.member_id, {
            lastMessage: msg.message,
            lastMessageTime: msg.created_at,
            unreadCount: msg.sender_type === 'member' && !msg.is_read ? 1 : 0,
          });
        } else {
          const existing = memberMessageMap.get(msg.member_id)!;
          if (msg.sender_type === 'member' && !msg.is_read) {
            existing.unreadCount++;
          }
        }
      }

      // Create conversation list with members who have messages
      const membersWithConversations: Member[] = (membersData || [])
        .filter((m) => memberMessageMap.has(m.id))
        .map((m) => ({
          ...m,
          ...memberMessageMap.get(m.id),
        }))
        .sort((a, b) => {
          const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
          const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
          return timeB - timeA;
        });

      setMembers(membersWithConversations);

      // Fetch broadcasts
      const { data: broadcastsData, error: broadcastsError } = await supabase
        .from('broadcast_messages')
        .select('*')
        .eq('mess_id', mess.id)
        .order('created_at', { ascending: false });

      if (broadcastsError) throw broadcastsError;
      setBroadcasts(broadcastsData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [mess, language, toast]);

  useEffect(() => {
    fetchMembersWithConversations();
  }, [fetchMembersWithConversations]);

  // Fetch messages for selected member
  const fetchMessages = useCallback(async (memberId: string) => {
    if (!mess) return;
    setIsLoadingMessages(true);

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('mess_id', mess.id)
        .eq('member_id', memberId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(m => ({
        ...m,
        sender_type: m.sender_type as 'manager' | 'member',
      })));

      // Mark unread messages as read
      const unreadIds = (data || [])
        .filter((m) => m.sender_type === 'member' && !m.is_read)
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        await supabase
          .from('direct_messages')
          .update({ is_read: true })
          .in('id', unreadIds);

        // Refresh the member list to update unread counts
        fetchMembersWithConversations();
        clearUnread();
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [mess, fetchMembersWithConversations, clearUnread]);

  useEffect(() => {
    if (selectedMemberId) {
      fetchMessages(selectedMemberId);
    }
  }, [selectedMemberId, fetchMessages]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!mess) return;

    const channel = supabase
      .channel(`messages-${mess.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `mess_id=eq.${mess.id}`,
        },
        (payload) => {
          const newMessage = payload.new as DirectMessage;
          
          // If this message is for the currently selected member, add it
          if (selectedMemberId && newMessage.member_id === selectedMemberId) {
            setMessages((prev) => [...prev, newMessage]);
            
            // Mark as read if from member
            if (newMessage.sender_type === 'member') {
              supabase
                .from('direct_messages')
                .update({ is_read: true })
                .eq('id', newMessage.id);
            }
          }
          
          // Refresh conversation list
          fetchMembersWithConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'broadcast_messages',
          filter: `mess_id=eq.${mess.id}`,
        },
        (payload) => {
          const newBroadcast = payload.new as Broadcast;
          setBroadcasts((prev) => [newBroadcast, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mess, selectedMemberId, fetchMembersWithConversations]);

  // Send direct message
  const handleSendDirectMessage = async (messageText: string) => {
    if (!mess || !selectedMemberId) return;
    setIsSending(true);

    try {
      const { error } = await supabase.from('direct_messages').insert({
        mess_id: mess.id,
        member_id: selectedMemberId,
        sender_type: 'manager',
        message: messageText,
        is_read: false,
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Send new message from modal
  const handleSendNewMessage = async (memberIds: string[], messageText: string, isBroadcast: boolean) => {
    if (!mess) return;

    try {
      if (isBroadcast) {
        // Send broadcast message
        const { error } = await supabase.from('broadcast_messages').insert({
          mess_id: mess.id,
          message: messageText,
        });

        if (error) throw error;

        toast({
          title: language === 'bn' ? 'সফল!' : 'Success!',
          description: language === 'bn' ? 'সবাইকে মেসেজ পাঠানো হয়েছে' : 'Message sent to everyone',
        });
      } else {
        // Send individual messages
        const inserts = memberIds.map((memberId) => ({
          mess_id: mess.id,
          member_id: memberId,
          sender_type: 'manager' as const,
          message: messageText,
          is_read: false,
        }));

        const { error } = await supabase.from('direct_messages').insert(inserts);

        if (error) throw error;

        toast({
          title: language === 'bn' ? 'সফল!' : 'Success!',
          description: language === 'bn' ? 'মেসেজ পাঠানো হয়েছে' : 'Message sent',
        });

        // If sending to a single member, select them
        if (memberIds.length === 1) {
          setSelectedMemberId(memberIds[0]);
        }
      }

      fetchMembersWithConversations();
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const selectedMember = members.find((m) => m.id === selectedMemberId) || 
                         allMembers.find((m) => m.id === selectedMemberId);

  return (
    <DashboardLayout>
      <div className="space-y-6 h-[calc(100vh-120px)]">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {language === 'bn' ? 'মেসেজ' : 'Messages'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'bn' ? 'মেম্বারদের সাথে যোগাযোগ করুন' : 'Communicate with members'}
            </p>
          </div>
          <Button onClick={() => setShowNewMessageModal(true)} className="btn-primary-glow">
            <Plus className="w-4 h-4 mr-2" />
            {language === 'bn' ? 'নতুন মেসেজ' : 'New Message'}
          </Button>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="individual" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              {language === 'bn' ? 'ব্যক্তিগত' : 'Individual'}
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {language === 'bn' ? 'গ্রুপ' : 'Broadcast'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="mt-4 h-[calc(100vh-280px)]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
              {/* Conversation List */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-1"
              >
                <Card className="glass-card h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {language === 'bn' ? 'কথোপকথন' : 'Conversations'} ({members.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 h-[calc(100%-60px)]">
                    <ConversationList
                      members={members}
                      selectedMemberId={selectedMemberId}
                      onSelectMember={setSelectedMemberId}
                      isLoading={isLoading}
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Chat Area */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-2"
              >
                <Card className="glass-card h-full">
                  {selectedMember ? (
                    <ChatArea
                      messages={messages}
                      recipientName={selectedMember.name}
                      isLoading={isLoadingMessages}
                      isSending={isSending}
                      onSendMessage={handleSendDirectMessage}
                      currentUserType="manager"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <MessageCircle className="w-12 h-12 mb-4 opacity-50" />
                      <p>{language === 'bn' ? 'একটি কথোপকথন নির্বাচন করুন' : 'Select a conversation'}</p>
                      <Button
                        variant="link"
                        onClick={() => setShowNewMessageModal(true)}
                        className="mt-2"
                      >
                        {language === 'bn' ? 'অথবা নতুন মেসেজ পাঠান' : 'Or start a new message'}
                      </Button>
                    </div>
                  )}
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="broadcast" className="mt-4 h-[calc(100vh-280px)]">
            <Card className="glass-card h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {language === 'bn' ? 'গ্রুপ মেসেজ' : 'Broadcast Messages'} ({broadcasts.length})
                  </CardTitle>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setShowNewMessageModal(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {language === 'bn' ? 'নতুন' : 'New'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-60px)]">
                <BroadcastList broadcasts={broadcasts} isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* New Message Modal */}
        <NewMessageModal
          isOpen={showNewMessageModal}
          onClose={() => setShowNewMessageModal(false)}
          members={allMembers}
          onSendMessage={handleSendNewMessage}
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
}
