import { useState, useEffect } from 'react';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MemberDashboardLayout } from '@/components/dashboard/MemberDashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

interface AdminMessage {
  id: string;
  message: string;
  target_type: string;
  created_at: string;
}

export default function MemberNotificationsPage() {
  const { memberSession } = useMemberAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (memberSession) {
      fetchNotifications();
    }
  }, [memberSession]);

  const fetchNotifications = async () => {
    if (!memberSession) return;
    setIsLoading(true);

    try {
      // Use the edge function to fetch data (bypasses RLS for PIN-authenticated members)
      const { data, error } = await supabase.functions.invoke('get-member-portal-data', {
        body: {
          member_id: memberSession.member.id,
          mess_id: memberSession.mess.id,
          session_token: memberSession.session_token,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const portalData = data.data;

      // Combine and sort notifications
      const combined = [
        ...(portalData.notifications || []).map((n: Notification) => ({ ...n, isAdmin: false, source: 'manager' })),
        ...(portalData.adminMessages || []).map((a: AdminMessage) => ({ ...a, isAdmin: true, source: 'admin', to_all: a.target_type === 'global' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(combined);
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

  return (
    <MemberDashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {language === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'bn' ? 'ম্যানেজার ও এডমিনের বার্তা' : 'Messages from manager and admin'}
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
                key={`${notification.source}-${notification.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        notification.isAdmin ? 'bg-primary/10' : 'bg-secondary/10'
                      }`}>
                        <BellRing className={`w-5 h-5 ${notification.isAdmin ? 'text-primary' : 'text-secondary'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant={notification.isAdmin ? 'default' : 'secondary'}>
                            {notification.isAdmin 
                              ? (language === 'bn' ? 'এডমিন' : 'Admin')
                              : (language === 'bn' ? 'ম্যানেজার' : 'Manager')}
                          </Badge>
                          {notification.to_all && (
                            <Badge variant="outline" className="text-xs">
                              {language === 'bn' ? 'সবার জন্য' : 'To All'}
                            </Badge>
                          )}
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
