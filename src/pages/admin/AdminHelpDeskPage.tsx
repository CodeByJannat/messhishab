import { useEffect, useState } from 'react';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, Loader2, User, Shield } from 'lucide-react';
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

export default function AdminHelpDeskPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

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

      // Mark messages as read
      await supabase
        .from('help_desk_messages')
        .update({ is_read: true })
        .eq('ticket_id', ticketId)
        .eq('sender_type', 'manager');
    } catch (error) {
      console.error('Error fetching messages:', error);
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

      // Create notification for manager
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
      
      // Update ticket status to in_progress if it was open
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

  const openTickets = tickets.filter(t => t.status === 'open').length;

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {language === 'bn' ? 'হেল্প ডেস্ক' : 'Help Desk'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'bn' ? 'ম্যানেজারদের সাপোর্ট টিকেট' : 'Support tickets from managers'}
            {openTickets > 0 && (
              <span className="ml-2 text-warning font-medium">
                ({openTickets} {language === 'bn' ? 'নতুন' : 'new'})
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Ticket List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <Card className="glass-card h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {language === 'bn' ? 'টিকেট তালিকা' : 'Tickets'} ({tickets.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-320px)]">
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
                  
                  <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-[calc(100vh-450px)] p-4">
                      <div className="space-y-4">
                        {messages.map(message => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%] ${message.sender_type === 'admin' ? 'order-2' : 'order-1'}`}>
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
                                    : (language === 'bn' ? 'ম্যানেজার' : 'Manager')
                                  }
                                </span>
                              </div>
                              <div className={`p-3 rounded-xl ${
                                message.sender_type === 'admin' 
                                  ? 'bg-destructive text-destructive-foreground' 
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
      </div>
    </AdminDashboardLayout>
  );
}
