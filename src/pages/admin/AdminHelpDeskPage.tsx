import { useEffect, useState, useRef } from 'react';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, Loader2, User, Shield, Mail, Clock, ArrowLeft, Inbox, Globe, Building2, Megaphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface Ticket {
  id: string;
  mess_id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  mess?: {
    mess_id: string;
    name: string | null;
  };
}

interface Message {
  id: string;
  ticket_id: string;
  sender_type: 'admin' | 'manager';
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
}

interface ContactReply {
  id: string;
  contact_message_id: string;
  admin_id: string;
  reply_message: string;
  sent_at: string;
}

interface Mess {
  id: string;
  mess_id: string;
  name: string | null;
}

interface AdminMessage {
  id: string;
  admin_id: string;
  target_type: string;
  target_mess_id: string | null;
  message: string;
  created_at: string;
}

export default function AdminHelpDeskPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Ticket state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Contact messages state
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [selectedContactMessage, setSelectedContactMessage] = useState<ContactMessage | null>(null);
  const [contactReplies, setContactReplies] = useState<ContactReply[]>([]);
  const [newContactReply, setNewContactReply] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isSendingContactReply, setIsSendingContactReply] = useState(false);
  const [contactFilter, setContactFilter] = useState<'all' | 'new' | 'replied'>('all');

  // Message Center state
  const [messes, setMesses] = useState<Mess[]>([]);
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSendingAdminMessage, setIsSendingAdminMessage] = useState(false);
  const [adminMessageForm, setAdminMessageForm] = useState({
    targetType: 'global' as 'global' | 'mess',
    targetMessId: '',
    message: '',
  });

  const messageScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTickets();
    fetchContactMessages();
    fetchMessagesData();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      
      const channel = supabase
        .channel(`ticket-${selectedTicket.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'help_desk_messages',
            filter: `ticket_id=eq.${selectedTicket.id}`,
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedTicket]);

  useEffect(() => {
    if (selectedContactMessage) {
      fetchContactReplies(selectedContactMessage.id);
    }
  }, [selectedContactMessage]);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('help_desk_tickets')
        .select(`
          *,
          mess:messes(mess_id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data as Ticket[]);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('help_desk_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data as Message[]);

      await supabase
        .from('help_desk_messages')
        .update({ is_read: true })
        .eq('ticket_id', ticketId)
        .eq('sender_type', 'manager');
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchContactMessages = async () => {
    setIsLoadingContacts(true);
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContactMessages(data as ContactMessage[]);
    } catch (error) {
      console.error('Error fetching contact messages:', error);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const fetchContactReplies = async (messageId: string) => {
    try {
      const { data, error } = await supabase
        .from('contact_message_replies')
        .select('*')
        .eq('contact_message_id', messageId)
        .order('sent_at', { ascending: true });

      if (error) throw error;
      setContactReplies(data as ContactReply[]);
    } catch (error) {
      console.error('Error fetching contact replies:', error);
    }
  };

  const fetchMessagesData = async () => {
    setIsLoadingMessages(true);
    try {
      const { data: messesData, error: messesError } = await supabase
        .from('messes')
        .select('id, mess_id, name')
        .order('mess_id');

      if (messesError) throw messesError;
      setMesses(messesData || []);

      const { data: messagesData, error: messagesError } = await supabase
        .from('admin_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;
      setAdminMessages(messagesData || []);
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || !user) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('help_desk_messages')
        .insert({
          ticket_id: selectedTicket.id,
          sender_type: 'admin',
          sender_id: user.id,
          message: newMessage.trim(),
        });

      if (error) throw error;

      const { data: messData } = await supabase
        .from('messes')
        .select('manager_id')
        .eq('id', selectedTicket.mess_id)
        .single();

      if (messData) {
        await supabase
          .from('notifications')
          .insert({
            mess_id: selectedTicket.mess_id,
            message: language === 'bn' 
              ? 'আপনার সাপোর্ট টিকেটে নতুন উত্তর এসেছে' 
              : 'You have a new reply on your support ticket',
            from_user_id: user.id,
          });
      }

      setNewMessage('');
      
      if (selectedTicket.status === 'open') {
        await supabase
          .from('help_desk_tickets')
          .update({ status: 'in_progress' })
          .eq('id', selectedTicket.id);
        
        setSelectedTicket(prev => prev ? { ...prev, status: 'in_progress' } : null);
        fetchTickets();
      }
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

  const handleSendContactReply = async () => {
    if (!newContactReply.trim() || !selectedContactMessage || !user) return;

    setIsSendingContactReply(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('send-contact-reply', {
        body: {
          contactMessageId: selectedContactMessage.id,
          recipientEmail: selectedContactMessage.email,
          recipientName: selectedContactMessage.name,
          replyMessage: newContactReply.trim(),
        },
      });

      if (response.error) throw new Error(response.error.message);

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' 
          ? 'উত্তর সফলভাবে পাঠানো হয়েছে'
          : 'Reply sent successfully',
      });

      setNewContactReply('');
      setSelectedContactMessage(prev => prev ? { ...prev, status: 'replied' } : null);
      fetchContactMessages();
      fetchContactReplies(selectedContactMessage.id);
    } catch (error: any) {
      console.error('Error sending contact reply:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' 
          ? 'উত্তর পাঠাতে সমস্যা হয়েছে'
          : 'Failed to send reply',
        variant: 'destructive',
      });
    } finally {
      setIsSendingContactReply(false);
    }
  };

  const handleSendAdminMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSendingAdminMessage(true);
    try {
      const { error } = await supabase.from('admin_messages').insert({
        admin_id: user.id,
        target_type: adminMessageForm.targetType,
        target_mess_id: adminMessageForm.targetType === 'mess' ? adminMessageForm.targetMessId : null,
        message: adminMessageForm.message,
      });

      if (error) throw error;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'মেসেজ পাঠানো হয়েছে' : 'Message sent successfully',
      });

      setAdminMessageForm({ targetType: 'global', targetMessId: '', message: '' });
      fetchMessagesData();
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSendingAdminMessage(false);
    }
  };

  const handleUpdateStatus = async (status: Ticket['status']) => {
    if (!selectedTicket) return;

    try {
      const { error } = await supabase
        .from('help_desk_tickets')
        .update({ status })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      setSelectedTicket(prev => prev ? { ...prev, status } : null);
      fetchTickets();
      
      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'স্ট্যাটাস আপডেট হয়েছে' : 'Status updated',
      });
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
      case 'new':
        return <Badge className="bg-warning">{language === 'bn' ? 'নতুন' : 'New'}</Badge>;
      case 'in_progress':
        return <Badge className="bg-accent">{language === 'bn' ? 'চলমান' : 'In Progress'}</Badge>;
      case 'resolved':
      case 'replied':
        return <Badge className="bg-success">{language === 'bn' ? 'উত্তর দেওয়া হয়েছে' : 'Replied'}</Badge>;
      case 'closed':
        return <Badge variant="secondary">{language === 'bn' ? 'বন্ধ' : 'Closed'}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMessName = (messId: string | null) => {
    if (!messId) return null;
    const mess = messes.find((m) => m.id === messId);
    return mess?.name || mess?.mess_id || 'Unknown';
  };

  const openTickets = tickets.filter(t => t.status === 'open').length;
  const newContactMessages = contactMessages.filter(m => m.status === 'new').length;

  const filteredContactMessages = contactMessages.filter(m => {
    if (contactFilter === 'all') return true;
    return m.status === contactFilter;
  });

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {language === 'bn' ? 'হেল্প ডেস্ক' : 'Help Desk'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'bn' ? 'সাপোর্ট টিকেট, যোগাযোগ বার্তা ও মেসেজ সেন্টার' : 'Support tickets, contact messages & message center'}
          </p>
        </div>

        <Tabs defaultValue="tickets" className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="tickets" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              {language === 'bn' ? 'টিকেট' : 'Tickets'}
              {openTickets > 0 && (
                <Badge variant="secondary" className="ml-1">{openTickets}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-2">
              <Inbox className="w-4 h-4" />
              {language === 'bn' ? 'যোগাযোগ' : 'Contact'}
              {newContactMessages > 0 && (
                <Badge variant="secondary" className="ml-1">{newContactMessages}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2">
              <Megaphone className="w-4 h-4" />
              {language === 'bn' ? 'মেসেজ' : 'Messages'}
            </TabsTrigger>
          </TabsList>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
              {/* Ticket List */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-1 min-h-0"
              >
                <Card className="glass-card h-full flex flex-col">
                  <CardHeader className="pb-3 shrink-0">
                    <CardTitle className="text-lg">
                      {language === 'bn' ? 'টিকেট তালিকা' : 'Tickets'} ({tickets.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 p-0">
                    <ScrollArea className="h-full">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                      ) : tickets.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          {language === 'bn' ? 'কোনো টিকেট নেই' : 'No tickets'}
                        </p>
                      ) : (
                        <div className="space-y-1 p-2">
                          {tickets.map(ticket => (
                            <button
                              key={ticket.id}
                              onClick={() => setSelectedTicket(ticket)}
                              className={`w-full text-left p-3 rounded-xl transition-all ${
                                selectedTicket?.id === ticket.id
                                  ? 'bg-primary/10 border border-primary'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{ticket.subject}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {ticket.mess?.mess_id || 'Unknown'}
                                  </p>
                                </div>
                                {getStatusBadge(ticket.status)}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm')}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Chat Area */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-2 min-h-0"
              >
                <Card className="glass-card h-full flex flex-col">
                  {selectedTicket ? (
                    <>
                      <CardHeader className="border-b shrink-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>{selectedTicket.subject}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {selectedTicket.mess?.name || selectedTicket.mess?.mess_id}
                            </p>
                          </div>
                          <Select value={selectedTicket.status} onValueChange={(v) => handleUpdateStatus(v as Ticket['status'])}>
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">{language === 'bn' ? 'খোলা' : 'Open'}</SelectItem>
                              <SelectItem value="in_progress">{language === 'bn' ? 'চলমান' : 'In Progress'}</SelectItem>
                              <SelectItem value="resolved">{language === 'bn' ? 'সমাধান' : 'Resolved'}</SelectItem>
                              <SelectItem value="closed">{language === 'bn' ? 'বন্ধ' : 'Closed'}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="flex-1 min-h-0 p-0">
                        <ScrollArea className="h-full">
                          <div className="space-y-4 p-4">
                            {messages.map(message => (
                              <div
                                key={message.id}
                                className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`max-w-[80%]`}>
                                  {message.sender_type !== 'admin' && (
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-primary">
                                        <User className="w-3 h-3 text-white" />
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        {language === 'bn' ? 'ম্যানেজার' : 'Manager'}
                                      </span>
                                    </div>
                                  )}
                                  <div className={`p-3 rounded-2xl ${
                                    message.sender_type === 'admin' 
                                      ? 'bg-primary text-primary-foreground rounded-br-sm' 
                                      : 'bg-muted rounded-bl-sm'
                                  }`}>
                                    <p className="whitespace-pre-wrap text-sm">{message.message}</p>
                                  </div>
                                  <p className={`text-xs text-muted-foreground mt-1 ${message.sender_type === 'admin' ? 'text-right' : 'text-left'}`}>
                                    {format(new Date(message.created_at), 'HH:mm')}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>

                      <div className="p-4 border-t shrink-0">
                        <div className="flex gap-2">
                          <Textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={language === 'bn' ? 'মেসেজ লিখুন...' : 'Type a message...'}
                            className="min-h-[50px] max-h-[120px] resize-none rounded-xl"
                            rows={1}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                          />
                          <Button
                            onClick={handleSendMessage}
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
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>{language === 'bn' ? 'একটি টিকেট নির্বাচন করুন' : 'Select a ticket to view'}</p>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Contact Messages Tab */}
          <TabsContent value="contact" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
              {/* Message List */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-1"
              >
                <Card className="glass-card h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{language === 'bn' ? 'বার্তা তালিকা' : 'Messages'}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        ({filteredContactMessages.length})
                      </span>
                    </CardTitle>
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm"
                        variant={contactFilter === 'all' ? 'default' : 'outline'}
                        onClick={() => setContactFilter('all')}
                        className="text-xs"
                      >
                        {language === 'bn' ? 'সব' : 'All'}
                      </Button>
                      <Button
                        size="sm"
                        variant={contactFilter === 'new' ? 'default' : 'outline'}
                        onClick={() => setContactFilter('new')}
                        className="text-xs"
                      >
                        {language === 'bn' ? 'নতুন' : 'New'}
                      </Button>
                      <Button
                        size="sm"
                        variant={contactFilter === 'replied' ? 'default' : 'outline'}
                        onClick={() => setContactFilter('replied')}
                        className="text-xs"
                      >
                        {language === 'bn' ? 'উত্তর দেওয়া' : 'Replied'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-450px)]">
                      {isLoadingContacts ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                      ) : filteredContactMessages.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          {language === 'bn' ? 'কোনো বার্তা নেই' : 'No messages'}
                        </p>
                      ) : (
                        <div className="space-y-1 p-2">
                          {filteredContactMessages.map(msg => (
                            <button
                              key={msg.id}
                              onClick={() => setSelectedContactMessage(msg)}
                              className={`w-full text-left p-3 rounded-xl transition-all ${
                                selectedContactMessage?.id === msg.id
                                  ? 'bg-primary/10 border border-primary'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{msg.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {msg.email}
                                  </p>
                                </div>
                                {getStatusBadge(msg.status)}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {msg.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(msg.created_at), 'dd/MM/yyyy HH:mm')}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Message Detail & Reply */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-2"
              >
                <Card className="glass-card h-full flex flex-col">
                  {selectedContactMessage ? (
                    <>
                      <CardHeader className="border-b">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedContactMessage(null)}
                            className="lg:hidden"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </Button>
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                              <User className="w-5 h-5" />
                              {selectedContactMessage.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              <a href={`mailto:${selectedContactMessage.email}`} className="hover:text-primary">
                                {selectedContactMessage.email}
                              </a>
                            </div>
                          </div>
                          {getStatusBadge(selectedContactMessage.status)}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="flex-1 overflow-hidden p-0">
                        <ScrollArea className="h-[calc(100vh-530px)] p-4">
                          {/* Original Message */}
                          <div className="mb-6">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                <User className="w-4 h-4 text-primary-foreground" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{selectedContactMessage.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(selectedContactMessage.created_at), 'dd MMM yyyy, HH:mm')}
                                </p>
                              </div>
                            </div>
                            <div className="bg-muted p-4 rounded-xl ml-10">
                              <p className="whitespace-pre-wrap">{selectedContactMessage.message}</p>
                            </div>
                          </div>

                          {/* Replies */}
                          {contactReplies.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="text-sm font-medium text-muted-foreground">
                                {language === 'bn' ? 'উত্তরসমূহ' : 'Replies'}
                              </h4>
                              {contactReplies.map(reply => (
                                <div key={reply.id} className="flex justify-end">
                                  <div className="max-w-[85%]">
                                    <div className="flex items-center gap-2 mb-1 justify-end">
                                      <p className="text-xs text-muted-foreground">
                                        {format(new Date(reply.sent_at), 'dd MMM yyyy, HH:mm')}
                                      </p>
                                      <div className="w-6 h-6 rounded-full bg-destructive flex items-center justify-center">
                                        <Shield className="w-3 h-3 text-white" />
                                      </div>
                                    </div>
                                    <div className="bg-destructive text-destructive-foreground p-4 rounded-xl">
                                      <p className="whitespace-pre-wrap">{reply.reply_message}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </CardContent>

                      <div className="p-4 border-t">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            {language === 'bn' ? 'উত্তর পাঠান' : 'Send Reply'}
                          </Label>
                          <div className="flex gap-2">
                            <Textarea
                              value={newContactReply}
                              onChange={(e) => setNewContactReply(e.target.value)}
                              placeholder={language === 'bn' ? 'উত্তর লিখুন...' : 'Write your reply...'}
                              className="min-h-[80px] resize-none"
                            />
                            <Button
                              onClick={handleSendContactReply}
                              disabled={!newContactReply.trim() || isSendingContactReply}
                              className="px-6"
                            >
                              {isSendingContactReply ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Send className="w-4 h-4 mr-2" />
                                  {language === 'bn' ? 'পাঠান' : 'Send'}
                                </>
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {language === 'bn' 
                              ? 'উত্তর ইমেইলে পাঠানো হবে এবং এখানে সংরক্ষিত থাকবে'
                              : 'Reply will be sent via email and saved here'}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Inbox className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>{language === 'bn' ? 'একটি বার্তা নির্বাচন করুন' : 'Select a message to view'}</p>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Message Center Tab */}
          <TabsContent value="messages" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Compose Message */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="w-5 h-5 text-primary" />
                      {language === 'bn' ? 'নতুন মেসেজ' : 'Compose Message'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSendAdminMessage} className="space-y-4">
                      <div className="space-y-2">
                        <Label>{language === 'bn' ? 'টার্গেট' : 'Target'}</Label>
                        <Select
                          value={adminMessageForm.targetType}
                          onValueChange={(value: 'global' | 'mess') => 
                            setAdminMessageForm({ ...adminMessageForm, targetType: value, targetMessId: '' })
                          }
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="global">
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                {language === 'bn' ? 'সব ম্যানেজার' : 'All Managers'}
                              </div>
                            </SelectItem>
                            <SelectItem value="mess">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                {language === 'bn' ? 'নির্দিষ্ট মেস' : 'Specific Mess'}
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {adminMessageForm.targetType === 'mess' && (
                        <div className="space-y-2">
                          <Label>{language === 'bn' ? 'মেস সিলেক্ট করুন' : 'Select Mess'}</Label>
                          <Select
                            value={adminMessageForm.targetMessId}
                            onValueChange={(value) => setAdminMessageForm({ ...adminMessageForm, targetMessId: value })}
                          >
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder={language === 'bn' ? 'মেস সিলেক্ট করুন' : 'Select mess'} />
                            </SelectTrigger>
                            <SelectContent>
                              {messes.map((mess) => (
                                <SelectItem key={mess.id} value={mess.id}>
                                  {mess.name || mess.mess_id} ({mess.mess_id})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>{language === 'bn' ? 'মেসেজ *' : 'Message *'}</Label>
                        <Textarea
                          value={adminMessageForm.message}
                          onChange={(e) => setAdminMessageForm({ ...adminMessageForm, message: e.target.value })}
                          placeholder={language === 'bn' ? 'আপনার মেসেজ লিখুন...' : 'Write your message...'}
                          required
                          className="rounded-xl min-h-[120px]"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="btn-primary-glow w-full"
                        disabled={isSendingAdminMessage || !adminMessageForm.message || (adminMessageForm.targetType === 'mess' && !adminMessageForm.targetMessId)}
                      >
                        {isSendingAdminMessage ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                        {language === 'bn' ? 'পাঠান' : 'Send'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Sent Messages */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="glass-card h-[calc(100vh-320px)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-primary" />
                      {language === 'bn' ? 'পাঠানো মেসেজ' : 'Sent Messages'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-450px)]">
                      {isLoadingMessages ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                      ) : adminMessages.length === 0 ? (
                        <div className="text-center py-8 px-4">
                          <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                          <p className="text-muted-foreground">
                            {language === 'bn' ? 'কোনো মেসেজ পাঠানো হয়নি' : 'No messages sent yet'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 p-4">
                          {adminMessages.map((msg, index) => (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className="p-4 border border-border rounded-xl bg-muted/30"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={msg.target_type === 'global' ? 'default' : 'secondary'}>
                                  {msg.target_type === 'global' ? (
                                    <><Globe className="w-3 h-3 mr-1" /> {language === 'bn' ? 'সব ম্যানেজার' : 'All Managers'}</>
                                  ) : (
                                    <><Building2 className="w-3 h-3 mr-1" /> {getMessName(msg.target_mess_id)}</>
                                  )}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(msg.created_at), 'dd/MM/yyyy HH:mm')}
                                </span>
                              </div>
                              <p className="text-foreground text-sm">{msg.message}</p>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
}