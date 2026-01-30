import { useState, useEffect } from 'react';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MemberDashboardLayout } from '@/components/dashboard/MemberDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Utensils, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Loader2, 
  Sun, 
  Coffee,
  Moon,
  Bell,
  ShoppingCart,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MealBreakdown {
  breakfast: number;
  lunch: number;
  dinner: number;
  total: number;
}

interface Deposit {
  id: string;
  amount: number;
  date: string;
  note: string | null;
}

interface Notification {
  id: string;
  message: string;
  to_all: boolean;
  created_at: string;
}

interface AdminMessage {
  id: string;
  message: string;
  target_type: string;
  created_at: string;
}

export default function MemberPortalPage() {
  const { memberSession } = useMemberAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [mealBreakdown, setMealBreakdown] = useState<MealBreakdown>({ breakfast: 0, lunch: 0, dinner: 0, total: 0 });
  const [bazarContribution, setBazarContribution] = useState(0);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [totalDeposit, setTotalDeposit] = useState(0);
  const [balance, setBalance] = useState(0);
  const [mealRate, setMealRate] = useState(0);
  const [notifications, setNotifications] = useState<(Notification | AdminMessage)[]>([]);

  useEffect(() => {
    if (memberSession) {
      fetchPortalData();
    }
  }, [memberSession]);

  const fetchPortalData = async () => {
    if (!memberSession) return;
    setIsLoading(true);

    try {
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
      
      setMealBreakdown(portalData.mealBreakdown);
      setBazarContribution(portalData.bazarContribution);
      setDeposits(portalData.deposits);
      setTotalDeposit(portalData.totalDeposit);
      setMealRate(portalData.mealRate);
      setBalance(portalData.balance);

      // Combine notifications
      const combined = [
        ...(portalData.notifications || []).map((n: Notification) => ({ ...n, isAdmin: false })),
        ...(portalData.adminMessages || []).map((a: AdminMessage) => ({ ...a, isAdmin: true, to_all: a.target_type === 'global' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(combined.slice(0, 10));

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

  if (isLoading) {
    return (
      <MemberDashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MemberDashboardLayout>
    );
  }

  return (
    <MemberDashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {language === 'bn' ? 'ব্যক্তিগত পোর্টাল' : 'Personal Portal'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'bn' ? `${memberSession?.member.name} - বিস্তারিত হিসাব` : `${memberSession?.member.name} - Detailed Account`}
          </p>
        </div>

        {/* Meal Breakdown */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-primary" />
              {language === 'bn' ? 'মিল বিস্তারিত' : 'Meal Breakdown'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-4 bg-warning/10 rounded-xl"
              >
                <Coffee className="w-6 h-6 mx-auto text-warning mb-2" />
                <p className="text-sm text-muted-foreground">{language === 'bn' ? 'সকাল' : 'Breakfast'}</p>
                <p className="text-2xl font-bold text-foreground">{mealBreakdown.breakfast}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center p-4 bg-primary/10 rounded-xl"
              >
                <Sun className="w-6 h-6 mx-auto text-primary mb-2" />
                <p className="text-sm text-muted-foreground">{language === 'bn' ? 'দুপুর' : 'Lunch'}</p>
                <p className="text-2xl font-bold text-foreground">{mealBreakdown.lunch}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center p-4 bg-muted rounded-xl"
              >
                <Moon className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{language === 'bn' ? 'রাত' : 'Dinner'}</p>
                <p className="text-2xl font-bold text-foreground">{mealBreakdown.dinner}</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center p-4 bg-success/10 rounded-xl"
              >
                <Utensils className="w-6 h-6 mx-auto text-success mb-2" />
                <p className="text-sm text-muted-foreground">{language === 'bn' ? 'মোট' : 'Total'}</p>
                <p className="text-2xl font-bold text-success">{mealBreakdown.total}</p>
              </motion.div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'bn' ? 'মিল রেট' : 'Meal Rate'}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">৳{mealRate.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Utensils className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'bn' ? 'বাজার অবদান' : 'Bazar Contribution'}
                  </p>
                  <p className="text-2xl font-bold text-primary mt-1">৳{bazarContribution.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'bn' ? 'মোট জমা' : 'Total Deposit'}
                  </p>
                  <p className="text-2xl font-bold text-success mt-1">৳{totalDeposit.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'bn' ? 'ব্যালেন্স' : 'Balance'}
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ৳{Math.abs(balance).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {balance >= 0 
                      ? (language === 'bn' ? 'উদ্বৃত্ত' : 'Surplus')
                      : (language === 'bn' ? 'বকেয়া' : 'Due')}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${balance >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  {balance >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-success" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-destructive" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deposit History */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {language === 'bn' ? 'জমার ইতিহাস' : 'Deposit History'}
            </CardTitle>
            {deposits.length > 5 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/member/deposits')}
                className="text-primary hover:text-primary hover:bg-primary/10"
              >
                {language === 'bn' ? 'সব দেখুন' : 'Show All'}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {deposits.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                {language === 'bn' ? 'কোনো জমা নেই' : 'No deposits yet'}
              </p>
            ) : (
              <div className="space-y-3">
                {deposits.slice(0, 5).map((deposit) => (
                  <div key={deposit.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                    <div>
                      <p className="font-medium text-foreground">৳{Number(deposit.amount).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{deposit.note || '-'}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(deposit.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              {language === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
            </CardTitle>
            {notifications.length > 5 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/member/notifications')}
                className="text-primary hover:text-primary hover:bg-primary/10"
              >
                {language === 'bn' ? 'সব দেখুন' : 'Show All'}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                {language === 'bn' ? 'কোনো নোটিফিকেশন নেই' : 'No notifications'}
              </p>
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 5).map((notif: any) => (
                  <div key={notif.id} className="p-3 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={notif.isAdmin ? 'default' : 'secondary'} className="text-xs">
                        {notif.isAdmin 
                          ? (language === 'bn' ? 'এডমিন' : 'Admin')
                          : (language === 'bn' ? 'ম্যানেজার' : 'Manager')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(notif.created_at).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
                      </span>
                    </div>
                    <p className="text-foreground">{notif.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MemberDashboardLayout>
  );
}
