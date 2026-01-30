import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, MessageSquare, Globe, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

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

export default function AdminMessagesPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [messes, setMesses] = useState<Mess[]>([]);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const [formData, setFormData] = useState({
    targetType: 'global' as 'global' | 'mess',
    targetMessId: '',
    message: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all messes
      const { data: messesData, error: messesError } = await supabase
        .from('messes')
        .select('id, mess_id, name')
        .order('mess_id');

      if (messesError) throw messesError;
      setMesses(messesData || []);

      // Fetch sent messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('admin_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);
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

  const getMessName = (messId: string | null) => {
    if (!messId) return null;
    const mess = messes.find((m) => m.id === messId);
    return mess?.name || mess?.mess_id || 'Unknown';
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from('admin_messages').insert({
        admin_id: user.id,
        target_type: formData.targetType,
        target_mess_id: formData.targetType === 'mess' ? formData.targetMessId : null,
        message: formData.message,
      });

      if (error) throw error;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'মেসেজ পাঠানো হয়েছে' : 'Message sent successfully',
      });

      setFormData({ targetType: 'global', targetMessId: '', message: '' });
      fetchData();
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

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {language === 'bn' ? 'মেসেজ সেন্টার' : 'Message Center'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'bn' ? 'ম্যানেজার ও মেম্বারদের কাছে মেসেজ পাঠান' : 'Send messages to managers and members'}
          </p>
        </div>

        {/* Compose Message */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              {language === 'bn' ? 'নতুন মেসেজ' : 'Compose Message'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'টার্গেট' : 'Target'}</Label>
                  <Select
                    value={formData.targetType}
                    onValueChange={(value: 'global' | 'mess') => 
                      setFormData({ ...formData, targetType: value, targetMessId: '' })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          {language === 'bn' ? 'সব মেস' : 'All Messes'}
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

                {formData.targetType === 'mess' && (
                  <div className="space-y-2">
                    <Label>{language === 'bn' ? 'মেস সিলেক্ট করুন' : 'Select Mess'}</Label>
                    <Select
                      value={formData.targetMessId}
                      onValueChange={(value) => setFormData({ ...formData, targetMessId: value })}
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
              </div>

              <div className="space-y-2">
                <Label>{language === 'bn' ? 'মেসেজ *' : 'Message *'}</Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={language === 'bn' ? 'আপনার মেসেজ লিখুন...' : 'Write your message...'}
                  required
                  className="rounded-xl min-h-[100px]"
                />
              </div>

              <Button 
                type="submit" 
                className="btn-primary-glow"
                disabled={isSending || !formData.message || (formData.targetType === 'mess' && !formData.targetMessId)}
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                {language === 'bn' ? 'পাঠান' : 'Send'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sent Messages */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              {language === 'bn' ? 'পাঠানো মেসেজ' : 'Sent Messages'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {language === 'bn' ? 'কোনো মেসেজ পাঠানো হয়নি' : 'No messages sent yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 border border-border rounded-xl bg-muted/30"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={msg.target_type === 'global' ? 'default' : 'secondary'}>
                        {msg.target_type === 'global' ? (
                          <><Globe className="w-3 h-3 mr-1" /> {language === 'bn' ? 'সব মেস' : 'All Messes'}</>
                        ) : (
                          <><Building2 className="w-3 h-3 mr-1" /> {getMessName(msg.target_mess_id)}</>
                        )}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}
                      </span>
                    </div>
                    <p className="text-foreground">{msg.message}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
}
