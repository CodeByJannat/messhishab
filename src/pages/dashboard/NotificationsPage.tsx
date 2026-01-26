import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, Bell, BellRing } from 'lucide-react';
import { motion } from 'framer-motion';

interface Member {
  id: string;
  name: string;
}

interface Notification {
  id: string;
  message: string;
  to_all: boolean;
  to_member_id: string | null;
  is_read: boolean;
  created_at: string;
  from_user_id: string | null;
}

export default function NotificationsPage() {
  const { user, mess } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    toMemberId: 'all',
    message: '',
  });

  useEffect(() => {
    if (mess) {
      fetchMembers();
      fetchNotifications();
      subscribeToNotifications();
    }
  }, [mess]);

  const fetchMembers = async () => {
    if (!mess) return;

    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, name')
        .eq('mess_id', mess.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!mess) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('mess_id', mess.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
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

  const subscribeToNotifications = () => {
    if (!mess) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `mess_id=eq.${mess.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getMemberName = (memberId: string | null) => {
    if (!memberId) return null;
    return members.find((m) => m.id === memberId)?.name;
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mess || !user) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('notifications').insert({
        mess_id: mess.id,
        from_user_id: user.id,
        to_all: formData.toMemberId === 'all',
        to_member_id: formData.toMemberId === 'all' ? null : formData.toMemberId,
        message: formData.message,
      });

      if (error) throw error;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'নোটিফিকেশন পাঠানো হয়েছে' : 'Notification sent',
      });

      setIsAddOpen(false);
      setFormData({ toMemberId: 'all', message: '' });
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
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {language === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'bn' ? 'মেম্বারদের সাথে যোগাযোগ করুন' : 'Communicate with members'}
            </p>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary-glow">
                <Plus className="w-4 h-4 mr-2" />
                {language === 'bn' ? 'নোটিফিকেশন পাঠান' : 'Send Notification'}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {language === 'bn' ? 'নতুন নোটিফিকেশন' : 'New Notification'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'প্রাপক' : 'Recipient'}</Label>
                  <Select
                    value={formData.toMemberId}
                    onValueChange={(value) => setFormData({ ...formData, toMemberId: value })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {language === 'bn' ? 'সকল মেম্বার' : 'All Members'}
                      </SelectItem>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting || !formData.message}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {language === 'bn' ? 'পাঠান' : 'Send'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {language === 'bn' ? 'কোনো নোটিফিকেশন নেই' : 'No notifications yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <BellRing className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">
                            {notification.to_all
                              ? language === 'bn' ? 'সকলের জন্য' : 'To All'
                              : `${language === 'bn' ? 'প্রাপক:' : 'To:'} ${getMemberName(notification.to_member_id) || '-'}`}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString(
                              language === 'bn' ? 'bn-BD' : 'en-US'
                            )}
                          </span>
                        </div>
                        <p className="text-foreground">{notification.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
