import { useState, useEffect } from 'react';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MemberDashboardLayout } from '@/components/dashboard/MemberDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface SentMessage {
  id: string;
  message: string;
  created_at: string;
}

export default function MemberContactPage() {
  const { memberSession } = useMemberAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (memberSession) {
      fetchSentMessages();
    }
  }, [memberSession]);

  const fetchSentMessages = async () => {
    if (!memberSession) return;
    setIsLoading(true);

    try {
      // Call edge function to get sent messages
      const { data, error } = await supabase.functions.invoke('get-member-portal-data', {
        body: {
          member_id: memberSession.member.id,
          mess_id: memberSession.mess.id,
          session_token: memberSession.session_token,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Get sent messages from the response
      setSentMessages(data.data.sentMessages || []);
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberSession || !message.trim()) return;

    setIsSubmitting(true);

    try {
      // Use edge function to send message
      const { data, error } = await supabase.functions.invoke('submit-member-message', {
        body: {
          member_id: memberSession.member.id,
          mess_id: memberSession.mess.id,
          session_token: memberSession.session_token,
          message: message.trim(),
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'মেসেজ পাঠানো হয়েছে' : 'Message sent',
      });

      setMessage('');
      setSentMessages((prev) => [data.message, ...prev]);
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MemberDashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {language === 'bn' ? 'ম্যানেজারকে মেসেজ' : 'Message Manager'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'bn' ? 'যেকোনো প্রশ্ন বা অভিযোগ জানান' : 'Send questions or concerns'}
          </p>
        </div>

        {/* Message Form */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              {language === 'bn' ? 'নতুন মেসেজ' : 'New Message'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={language === 'bn' ? 'আপনার মেসেজ লিখুন...' : 'Write your message...'}
                className="rounded-xl min-h-[120px]"
                required
              />
              <Button type="submit" disabled={isSubmitting || !message.trim()} className="w-full sm:w-auto">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                {language === 'bn' ? 'পাঠান' : 'Send'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sent Messages */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {language === 'bn' ? 'পাঠানো মেসেজ' : 'Sent Messages'}
          </h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : sentMessages.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {language === 'bn' ? 'কোনো মেসেজ পাঠাননি' : 'No messages sent yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sentMessages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1">
                            {new Date(msg.created_at).toLocaleString(
                              language === 'bn' ? 'bn-BD' : 'en-US'
                            )}
                          </p>
                          <p className="text-foreground">{msg.message}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MemberDashboardLayout>
  );
}
