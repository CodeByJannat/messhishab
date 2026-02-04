import { useState, useEffect, useCallback, useRef } from 'react';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MemberDashboardLayout } from '@/components/dashboard/MemberDashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2, MessageCircle, Users, Megaphone } from 'lucide-react';
import { MessageBubble } from '@/components/messaging/MessageBubble';
import { format } from 'date-fns';

// Chat skeleton component
function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          <Skeleton className={`h-12 ${i % 2 === 0 ? 'w-48' : 'w-36'} rounded-2xl`} />
        </div>
      ))}
    </div>
  );
}

// Broadcast skeleton component
function BroadcastSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="bg-muted/30">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

interface DirectMessage {
  id: string;
  sender_type: 'manager' | 'member';
  message: string;
  created_at: string;
  is_read: boolean;
}

interface Broadcast {
  id: string;
  message: string;
  created_at: string;
}

export default function MemberContactPage() {
  const { memberSession } = useMemberAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchMessages = useCallback(async () => {
    if (!memberSession) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('get-direct-messages', {
        body: {
          member_id: memberSession.member.id,
          mess_id: memberSession.mess.id,
          session_token: memberSession.session_token,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setMessages(data.directMessages || []);
      setBroadcasts(data.broadcasts || []);
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [memberSession, language, toast]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Poll for new messages every 10 seconds (since members can't use realtime directly)
  useEffect(() => {
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberSession || !newMessage.trim()) return;

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-direct-message', {
        body: {
          member_id: memberSession.member.id,
          mess_id: memberSession.mess.id,
          session_token: memberSession.session_token,
          message: newMessage.trim(),
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Add the new message to the list
      setMessages((prev) => [...prev, data.message]);
      setNewMessage('');
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  return (
    <MemberDashboardLayout>
      <div className="space-y-6 h-[calc(100vh-120px)]">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {language === 'bn' ? 'ম্যানেজারকে মেসেজ' : 'Message Manager'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'bn' ? 'যেকোনো প্রশ্ন বা অভিযোগ জানান' : 'Send questions or concerns'}
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              {language === 'bn' ? 'ম্যানেজার' : 'Manager'}
            </TabsTrigger>
            <TabsTrigger value="broadcasts" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {language === 'bn' ? 'গ্রুপ মেসেজ' : 'Broadcasts'}
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="mt-4 h-[calc(100vh-280px)]">
            <Card className="glass-card h-full flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">M</span>
                </div>
                <div>
                  <p className="font-semibold">
                    {language === 'bn' ? 'ম্যানেজার' : 'Manager'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {memberSession?.mess.name || memberSession?.mess.mess_id}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {isLoading ? (
                  <ChatSkeleton />
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                    <MessageCircle className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      {language === 'bn' ? 'এখনো কোনো মেসেজ নেই' : 'No messages yet'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {language === 'bn' ? 'কথোপকথন শুরু করুন!' : 'Start the conversation!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg.message}
                        senderType={msg.sender_type}
                        createdAt={msg.created_at}
                        isOwn={msg.sender_type === 'member'}
                      />
                    ))}
                    <div ref={scrollRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={language === 'bn' ? 'মেসেজ লিখুন...' : 'Type a message...'}
                    className="min-h-[50px] max-h-[120px] resize-none rounded-xl"
                    rows={1}
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    size="icon"
                    className="h-[50px] w-[50px] rounded-xl shrink-0"
                  >
                    {isSending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </TabsContent>

          {/* Broadcasts Tab */}
          <TabsContent value="broadcasts" className="mt-4 h-[calc(100vh-280px)]">
            <Card className="glass-card h-full">
              <ScrollArea className="h-full p-4">
                {isLoading ? (
                  <BroadcastSkeleton />
                ) : broadcasts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                    <Megaphone className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      {language === 'bn' ? 'কোনো গ্রুপ মেসেজ নেই' : 'No broadcast messages'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {broadcasts.map((broadcast) => (
                      <Card key={broadcast.id} className="bg-muted/30">
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-xs font-medium text-primary">
                                  {language === 'bn' ? 'ম্যানেজার' : 'Manager'} → {language === 'bn' ? 'সবাই' : 'Everyone'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(broadcast.created_at), 'dd/MM/yyyy HH:mm')}
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{broadcast.message}</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MemberDashboardLayout>
  );
}
