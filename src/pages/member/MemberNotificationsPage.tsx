import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MemberDashboardLayout } from '@/components/dashboard/MemberDashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Bell, BellRing } from 'lucide-react';
import { motion } from 'framer-motion';

interface Notification {
  id: string;
  message: string;
  to_all: boolean;
  is_read: boolean;
  created_at: string;
}

export default function MemberNotificationsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      subscribeToNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Get member info first
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id, mess_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (memberError) throw memberError;

      // Fetch notifications for this member
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('mess_id', memberData.mess_id)
        .or(`to_all.eq.true,to_member_id.eq.${memberData.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);

      // Mark unread as read
      const unreadIds = (data || []).filter((n) => !n.is_read).map((n) => n.id);
      if (unreadIds.length > 0) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .in('id', unreadIds);
      }
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

  const subscribeToNotifications = async () => {
    if (!user) return;

    try {
      const { data: memberData } = await supabase
        .from('members')
        .select('mess_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!memberData) return;

      const channel = supabase
        .channel('member-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `mess_id=eq.${memberData.mess_id}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            if (newNotification.to_all) {
              setNotifications((prev) => [newNotification, ...prev]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error subscribing:', error);
    }
  };

  return (
    <MemberDashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {language === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'bn' ? 'ম্যানেজারের বার্তা' : 'Messages from manager'}
          </p>
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
                      <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        <BellRing className="w-5 h-5 text-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">
                            {language === 'bn' ? 'ম্যানেজার থেকে' : 'From Manager'}
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
    </MemberDashboardLayout>
  );
}
