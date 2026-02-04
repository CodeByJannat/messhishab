import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MemberDashboardLayout } from '@/components/dashboard/MemberDashboardLayout';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MemberPortalSkeleton } from '@/components/ui/loading-skeletons';
import { 
  Utensils, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Sun, 
  Coffee,
  Moon,
  Bell,
  ShoppingCart,
  Calendar,
  ArrowRight,
  Loader2,
  Receipt,
  Users,
  Sparkles
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

interface AdditionalCost {
  id: string;
  date: string;
  description: string;
  amount: number;
}

export default function MemberDashboard() {
  const { memberSession, isAuthenticated, isLoading: authLoading } = useMemberAuth();
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
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>([]);
  const [totalAdditionalCosts, setTotalAdditionalCosts] = useState(0);
  const [perHeadAdditionalCost, setPerHeadAdditionalCost] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const [mealCost, setMealCost] = useState(0);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;
    
    // If not authenticated, redirect to login
    if (!isAuthenticated || !memberSession) {
      navigate('/login');
      return;
    }
    
    fetchPortalData();
  }, [authLoading, isAuthenticated, memberSession, navigate]);

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
      setAdditionalCosts(portalData.additionalCosts || []);
      setTotalAdditionalCosts(portalData.totalAdditionalCosts || 0);
      
      // Use server-calculated values for consistency
      const memberCount = portalData.totalMembers || 1;
      setTotalMembers(memberCount);
      
      // Use pre-calculated per-head additional cost from server
      const perHead = portalData.perHeadAdditionalCost || 0;
      setPerHeadAdditionalCost(perHead);
      
      // Use pre-calculated meal cost from server
      const serverMealCost = portalData.mealCost || (portalData.mealBreakdown.total * portalData.mealRate);
      setMealCost(serverMealCost);
      
      // Use pre-calculated balance from server
      // Balance = Total Deposit − (Per-Head Additional Cost + Total Meal Cost)
      const serverBalance = portalData.balance;
      setBalance(serverBalance);

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

  // Show loading while auth is checking
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated after loading, the useEffect will redirect
  if (!isAuthenticated || !memberSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <MemberDashboardLayout>
        <MemberPortalSkeleton />
      </MemberDashboardLayout>
    );
  }

  return (
    <MemberDashboardLayout>
      <div className="space-y-6 lg:space-y-8">
        {/* Page Header */}
        <DashboardHeader
          title={language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}
          subtitle={`${memberSession?.member.name} - ${language === 'bn' ? 'বিস্তারিত হিসাব' : 'Detailed Account'}`}
        />

        {/* Tabs for Overview and Additional Cost */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="overview" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Utensils className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'bn' ? 'ওভারভিউ' : 'Overview'}</span>
            </TabsTrigger>
            <TabsTrigger value="additional-cost" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'bn' ? 'অতিরিক্ত খরচ' : 'Additional Cost'}</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Meal Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="overflow-hidden border-2 border-primary/10">
                <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Utensils className="w-4 h-4 text-primary" />
                    </div>
                    {language === 'bn' ? 'মিল বিস্তারিত' : 'Meal Breakdown'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { icon: Coffee, label: language === 'bn' ? 'সকাল' : 'Breakfast', value: mealBreakdown.breakfast, color: 'warning' },
                      { icon: Sun, label: language === 'bn' ? 'দুপুর' : 'Lunch', value: mealBreakdown.lunch, color: 'primary' },
                      { icon: Moon, label: language === 'bn' ? 'রাত' : 'Dinner', value: mealBreakdown.dinner, color: 'muted' },
                      { icon: Sparkles, label: language === 'bn' ? 'মোট' : 'Total', value: mealBreakdown.total, color: 'success' },
                    ].map((item, index) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        className={`text-center p-4 rounded-xl bg-${item.color}/10 border border-${item.color}/20 hover:shadow-md transition-shadow`}
                      >
                        <item.icon className={`w-6 h-6 mx-auto text-${item.color} mb-2`} />
                        <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                        <p className={`text-2xl sm:text-3xl font-bold ${item.color === 'success' ? 'text-success' : 'text-foreground'}`}>
                          {item.value}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Financial Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                title={language === 'bn' ? 'মিল রেট' : 'Meal Rate'}
                value={`৳${mealRate.toFixed(2)}`}
                icon={Utensils}
                color="muted"
                delay={0}
              />
              <StatCard
                title={language === 'bn' ? 'বাজার অবদান' : 'Bazar'}
                value={`৳${bazarContribution.toFixed(0)}`}
                icon={ShoppingCart}
                color="primary"
                delay={0.1}
              />
              <StatCard
                title={language === 'bn' ? 'মোট জমা' : 'Deposits'}
                value={`৳${totalDeposit.toFixed(0)}`}
                icon={Wallet}
                color="success"
                delay={0.2}
              />
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className={`group relative overflow-hidden rounded-2xl border-2 p-4 sm:p-5 transition-all duration-300 hover:shadow-lg ${
                  balance >= 0 
                    ? 'border-success/30 bg-success/5' 
                    : 'border-destructive/30 bg-destructive/5'
                }`}
              >
                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                      {language === 'bn' ? 'ব্যালেন্স' : 'Balance'}
                    </p>
                    <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                      ৳{Math.abs(balance).toFixed(0)}
                    </p>
                    <p className={`text-[10px] sm:text-xs font-medium ${balance >= 0 ? 'text-success/80' : 'text-destructive/80'}`}>
                      {balance >= 0 
                        ? (language === 'bn' ? 'উদ্বৃত্ত' : 'Surplus')
                        : (language === 'bn' ? 'বকেয়া' : 'Due')}
                    </p>
                  </div>
                  <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
                    balance >= 0 ? 'bg-success/10' : 'bg-destructive/10'
                  }`}>
                    {balance >= 0 ? (
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
                    ) : (
                      <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Balance Calculation Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <Card className="overflow-hidden border-2 border-primary/10">
                <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-primary" />
                    </div>
                    {language === 'bn' ? 'ব্যালেন্স হিসাব' : 'Balance Calculation'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {[
                      { label: language === 'bn' ? 'মোট জমা' : 'Total Deposit', value: totalDeposit, type: 'positive' },
                      { label: `${language === 'bn' ? 'মিল খরচ' : 'Meal Cost'} (${mealBreakdown.total} × ৳${mealRate.toFixed(2)})`, value: mealCost, type: 'negative' },
                      { label: language === 'bn' ? 'মাথাপিছু অতিরিক্ত খরচ' : 'Per-Head Additional Cost', value: perHeadAdditionalCost, type: 'negative' },
                    ].map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className={`font-medium ${item.type === 'positive' ? 'text-success' : 'text-destructive'}`}>
                          {item.type === 'negative' ? '- ' : ''}৳{item.value.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className={`flex justify-between items-center py-3 rounded-xl px-3 ${
                      balance >= 0 ? 'bg-success/10' : 'bg-destructive/10'
                    }`}>
                      <span className="font-semibold">{language === 'bn' ? 'অবশিষ্ট ব্যালেন্স' : 'Remaining Balance'}</span>
                      <span className={`font-bold text-lg ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                        ৳{Math.abs(balance).toFixed(2)} {balance < 0 && (language === 'bn' ? '(বকেয়া)' : '(Due)')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Deposit History & Notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* Deposit History */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <Card className="h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="w-5 h-5 text-primary" />
                      {language === 'bn' ? 'জমার ইতিহাস' : 'Deposit History'}
                    </CardTitle>
                    {deposits.length > 5 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => navigate('/member/deposits')}
                        className="text-primary hover:text-primary hover:bg-primary/10 text-xs"
                      >
                        {language === 'bn' ? 'সব দেখুন' : 'View All'}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    {deposits.length === 0 ? (
                      <div className="text-center py-8">
                        <Wallet className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {language === 'bn' ? 'কোনো জমা নেই' : 'No deposits yet'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {deposits.slice(0, 5).map((deposit, index) => (
                          <motion.div 
                            key={deposit.id} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + index * 0.05 }}
                            className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 rounded-xl transition-colors"
                          >
                            <div>
                              <p className="font-semibold text-foreground">৳{Number(deposit.amount).toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">{deposit.note || '-'}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(deposit.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Notifications */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <Card className="h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Bell className="w-5 h-5 text-primary" />
                      {language === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8">
                        <Bell className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {language === 'bn' ? 'কোনো নোটিফিকেশন নেই' : 'No notifications'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {notifications.slice(0, 5).map((notif: any, index) => (
                          <motion.div 
                            key={notif.id} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 + index * 0.05 }}
                            className="p-3 bg-muted/30 hover:bg-muted/50 rounded-xl transition-colors"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={notif.isAdmin ? 'default' : 'secondary'} className="text-[10px] px-2 py-0.5">
                                {notif.isAdmin 
                                  ? (language === 'bn' ? 'এডমিন' : 'Admin')
                                  : (language === 'bn' ? 'ম্যানেজার' : 'Manager')}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(notif.created_at).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
                              </span>
                            </div>
                            <p className="text-sm text-foreground line-clamp-2">{notif.message}</p>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Additional Cost Tab */}
          <TabsContent value="additional-cost" className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <StatCard
                title={language === 'bn' ? 'মোট অতিরিক্ত খরচ' : 'Total Additional Cost'}
                value={`৳${totalAdditionalCosts.toFixed(2)}`}
                icon={Receipt}
                color="warning"
                delay={0}
              />
              <StatCard
                title={language === 'bn' ? 'মোট মেম্বার' : 'Total Members'}
                value={totalMembers}
                icon={Users}
                color="primary"
                delay={0.1}
              />
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="group relative overflow-hidden rounded-2xl border-2 border-destructive/30 bg-destructive/5 p-4 sm:p-5"
              >
                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                      {language === 'bn' ? 'আপনার শেয়ার' : 'Your Share'}
                    </p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-destructive">
                      ৳{perHeadAdditionalCost.toFixed(2)}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {language === 'bn' ? 'মাথাপিছু' : 'Per-head'}
                    </p>
                  </div>
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Additional Costs Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Receipt className="w-5 h-5 text-primary" />
                    {language === 'bn' ? 'অতিরিক্ত খরচের তালিকা' : 'Additional Costs List'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {additionalCosts.length === 0 ? (
                    <div className="text-center py-12">
                      <Receipt className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">
                        {language === 'bn' ? 'কোনো অতিরিক্ত খরচ নেই' : 'No additional costs yet'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="font-semibold">{language === 'bn' ? 'তারিখ' : 'Date'}</TableHead>
                            <TableHead className="font-semibold">{language === 'bn' ? 'বিবরণ' : 'Description'}</TableHead>
                            <TableHead className="text-right font-semibold">{language === 'bn' ? 'পরিমাণ' : 'Amount'}</TableHead>
                            <TableHead className="text-right font-semibold">{language === 'bn' ? 'মাথাপিছু' : 'Per-Head'}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {additionalCosts.map((cost, index) => (
                            <motion.tr
                              key={cost.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 + index * 0.05 }}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="text-sm">
                                {new Date(cost.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
                              </TableCell>
                              <TableCell className="font-medium">{cost.description}</TableCell>
                              <TableCell className="text-right text-warning font-semibold">
                                ৳{Number(cost.amount).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right text-destructive font-semibold">
                                ৳{(totalMembers > 0 ? Number(cost.amount) / totalMembers : 0).toFixed(2)}
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Explanation Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">{language === 'bn' ? 'নোট:' : 'Note:'}</strong>{' '}
                    {language === 'bn' 
                      ? 'অতিরিক্ত খরচ (বিদ্যুৎ, গ্যাস, পানি ইত্যাদি) সকল মেম্বারের মধ্যে সমানভাবে ভাগ করা হয়। আপনার শেয়ার আপনার মোট মেস বিল এ যুক্ত হয়।'
                      : 'Additional costs (electricity, gas, water, etc.) are divided equally among all members. Your share is added to your total mess bill.'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </MemberDashboardLayout>
  );
}
