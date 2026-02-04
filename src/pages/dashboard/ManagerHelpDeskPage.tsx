import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, Plus, Loader2, User, Shield, Megaphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface Ticket {
  id: string;
  mess_id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
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

interface AdminMessage {
  id: string;
  message: string;
  target_type: 'global' | 'mess';
  created_at: string;
}

export default function ManagerHelpDeskPage() {
  const { language } = useLanguage();
  const { user, mess } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState('tickets');

  // New ticket modal
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (mess) {
      fetchTickets();
      fetchAdminMessages();
    }
  }, [mess]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      
      // Subscribe to new messages
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

  const fetchTickets = async () => {
    if (!mess) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('help_desk_tickets')
        .select('*')
        .eq('mess_id', mess.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data as Ticket[]);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminMessages = async () => {
    if (!mess) return;
    try {
      const { data, error } = await supabase
        .from('admin_messages')
        .select('*')
        .or(`target_type.eq.global,target_mess_id.eq.${mess.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdminMessages(data as AdminMessage[]);
    } catch (error) {
      console.error('Error fetching admin messages:', error);
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

      // Mark admin messages as read
      await supabase
        .from('help_desk_messages')
        .update({ is_read: true })
        .eq('ticket_id', ticketId)
        .eq('sender_type', 'admin');
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicketSubject.trim() || !newTicketMessage.trim() || !mess || !user) return;

    setIsCreating(true);
    try {
      // Create ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('help_desk_tickets')
        .insert({
          mess_id: mess.id,
          subject: newTicketSubject.trim(),
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Create first message
      const { error: messageError } = await supabase
        .from('help_desk_messages')
        .insert({
          ticket_id: ticketData.id,
          sender_type: 'manager',
          sender_id: user.id,
          message: newTicketMessage.trim(),
        });

      if (messageError) throw messageError;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'টিকেট তৈরি হয়েছে' : 'Ticket created successfully',
      });
      
      setShowNewTicketModal(false);
      setNewTicketSubject('');
      setNewTicketMessage('');
      fetchTickets();
      setSelectedTicket(ticketData as Ticket);
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
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
          sender_type: 'manager',
          sender_id: user.id,
          message: newMessage.trim(),
        });

      if (error) throw error;
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-warning">{language === 'bn' ? 'খোলা' : 'Open'}</Badge>;
      case 'in_progress':
        return <Badge className="bg-accent">{language === 'bn' ? 'চলমান' : 'In Progress'}</Badge>;
      case 'resolved':
        return <Badge className="bg-success">{language === 'bn' ? 'সমাধান' : 'Resolved'}</Badge>;
      case 'closed':
        return <Badge variant="secondary">{language === 'bn' ? 'বন্ধ' : 'Closed'}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {language === 'bn' ? 'হেল্প ডেস্ক' : 'Help Desk'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'bn' ? 'এডমিনের সাথে যোগাযোগ করুন' : 'Contact admin for support'}
            </p>
          </div>
        </div>

        {/* Tabs for Tickets and Admin Messages */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              {language === 'bn' ? 'সাপোর্ট টিকেট' : 'Support Tickets'}
            </TabsTrigger>
            <TabsTrigger value="admin-messages" className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              {language === 'bn' ? 'এডমিন মেসেজ' : 'Admin Messages'}
              {adminMessages.length > 0 && (
                <Badge variant="secondary" className="ml-1">{adminMessages.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="mt-4">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setShowNewTicketModal(true)} className="btn-primary-glow">
                <Plus className="w-4 h-4 mr-2" />
                {language === 'bn' ? 'নতুন টিকেট' : 'New Ticket'}
              </Button>
            </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
          {/* Ticket List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <Card className="glass-card h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {language === 'bn' ? 'আমার টিকেট' : 'My Tickets'} ({tickets.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-370px)]">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        {language === 'bn' ? 'কোনো টিকেট নেই' : 'No tickets yet'}
                      </p>
                      <Button 
                        variant="link" 
                        onClick={() => setShowNewTicketModal(true)}
                        className="mt-2"
                      >
                        {language === 'bn' ? 'নতুন টিকেট তৈরি করুন' : 'Create a new ticket'}
                      </Button>
                    </div>
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
                            <p className="font-medium truncate flex-1">{ticket.subject}</p>
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
            className="lg:col-span-2"
          >
            <Card className="glass-card h-full flex flex-col">
              {selectedTicket ? (
                <>
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedTicket.subject}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(selectedTicket.created_at), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                      {getStatusBadge(selectedTicket.status)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-[calc(100vh-500px)] p-4">
                      <div className="space-y-4">
                        {messages.map(message => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender_type === 'manager' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%]`}>
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  message.sender_type === 'admin' ? 'bg-destructive' : 'bg-primary'
                                }`}>
                                  {message.sender_type === 'admin' 
                                    ? <Shield className="w-3 h-3 text-white" />
                                    : <User className="w-3 h-3 text-white" />
                                  }
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {message.sender_type === 'admin' 
                                    ? (language === 'bn' ? 'এডমিন' : 'Admin')
                                    : (language === 'bn' ? 'আমি' : 'Me')
                                  }
                                </span>
                              </div>
                              <div className={`p-3 rounded-xl ${
                                message.sender_type === 'manager' 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted'
                              }`}>
                                <p className="whitespace-pre-wrap">{message.message}</p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(message.created_at), 'HH:mm')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>

                  {selectedTicket.status !== 'closed' && (
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder={language === 'bn' ? 'মেসেজ লিখুন...' : 'Type a message...'}
                          className="min-h-[60px] resize-none"
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
                          className="px-4"
                        >
                          {isSending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
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

          {/* Admin Messages Tab */}
          <TabsContent value="admin-messages" className="mt-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-destructive" />
                  {language === 'bn' ? 'এডমিন থেকে মেসেজ' : 'Messages from Admin'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {adminMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <Megaphone className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      {language === 'bn' ? 'কোনো এডমিন মেসেজ নেই' : 'No admin messages'}
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {adminMessages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-xl bg-destructive/5 border border-destructive/20"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center shrink-0">
                              <Shield className="w-5 h-5 text-destructive" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-destructive">
                                    {language === 'bn' ? 'এডমিন' : 'Admin'}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {msg.target_type === 'global' 
                                      ? (language === 'bn' ? 'সকলের জন্য' : 'Global')
                                      : (language === 'bn' ? 'আপনার জন্য' : 'For You')
                                    }
                                  </Badge>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(msg.created_at), 'dd/MM/yyyy HH:mm')}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap">{msg.message}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* New Ticket Modal */}
        <Dialog open={showNewTicketModal} onOpenChange={setShowNewTicketModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === 'bn' ? 'নতুন টিকেট তৈরি করুন' : 'Create New Ticket'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  placeholder={language === 'bn' ? 'বিষয় লিখুন...' : 'Subject...'}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Textarea
                  value={newTicketMessage}
                  onChange={(e) => setNewTicketMessage(e.target.value)}
                  placeholder={language === 'bn' ? 'আপনার সমস্যা বিস্তারিত লিখুন...' : 'Describe your issue in detail...'}
                  className="min-h-[150px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewTicketModal(false)}>
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button
                onClick={handleCreateTicket}
                disabled={!newTicketSubject.trim() || !newTicketMessage.trim() || isCreating}
              >
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {language === 'bn' ? 'তৈরি করুন' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
