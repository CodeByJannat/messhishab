import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MemberDashboardLayout } from '@/components/dashboard/MemberDashboardLayout';
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
  Users
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
      
      // Calculate per-head additional cost
      const memberCount = portalData.totalMembers || 1;
      setTotalMembers(memberCount);
      const perHead = memberCount > 0 ? portalData.totalAdditionalCosts / memberCount : 0;
      setPerHeadAdditionalCost(perHead);
      
      // Calculate meal cost
      const calculatedMealCost = portalData.mealBreakdown.total * portalData.mealRate;
      setMealCost(calculatedMealCost);
      
      // Remaining Balance = Total Deposit − (Per-Head Additional Cost + Total Meal Cost)
      const remainingBalance = portalData.totalDeposit - (perHead + calculatedMealCost);
      setBalance(remainingBalance);

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
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'bn' ? `${memberSession?.member.name} - বিস্তারিত হিসাব` : `${memberSession?.member.name} - Detailed Account`}
          </p>
        </div>

        {/* Tabs for Overview and Additional Cost */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Utensils className="w-4 h-4" />
              {language === 'bn' ? 'ওভারভিউ' : 'Overview'}
            </TabsTrigger>
            <TabsTrigger value="additional-cost" className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              {language === 'bn' ? 'অতিরিক্ত খরচ' : 'Additional Cost'}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Meal Breakdown */}
            <Card className="glass-card">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  {language === 'bn' ? 'মিল বিস্তারিত' : 'Meal Breakdown'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center p-3 sm:p-4 bg-warning/10 rounded-xl"
                  >
                    <Coffee className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-warning mb-1 sm:mb-2" />
                    <p className="text-xs sm:text-sm text-muted-foreground">{language === 'bn' ? 'সকাল' : 'Breakfast'}</p>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{mealBreakdown.breakfast}</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center p-3 sm:p-4 bg-primary/10 rounded-xl"
                  >
                    <Sun className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-primary mb-1 sm:mb-2" />
                    <p className="text-xs sm:text-sm text-muted-foreground">{language === 'bn' ? 'দুপুর' : 'Lunch'}</p>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{mealBreakdown.lunch}</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center p-3 sm:p-4 bg-muted rounded-xl"
                  >
                    <Moon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-muted-foreground mb-1 sm:mb-2" />
                    <p className="text-xs sm:text-sm text-muted-foreground">{language === 'bn' ? 'রাত' : 'Dinner'}</p>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{mealBreakdown.dinner}</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center p-3 sm:p-4 bg-success/10 rounded-xl"
                  >
                    <Utensils className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-success mb-1 sm:mb-2" />
                    <p className="text-xs sm:text-sm text-muted-foreground">{language === 'bn' ? 'মোট' : 'Total'}</p>
                    <p className="text-lg sm:text-2xl font-bold text-success">{mealBreakdown.total}</p>
                  </motion.div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="glass-card">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {language === 'bn' ? 'মিল রেট' : 'Meal Rate'}
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-foreground mt-1">৳{mealRate.toFixed(2)}</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {language === 'bn' ? 'বাজার অবদান' : 'Bazar'}
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-primary mt-1">৳{bazarContribution.toFixed(2)}</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {language === 'bn' ? 'মোট জমা' : 'Deposits'}
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-success mt-1">৳{totalDeposit.toFixed(2)}</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                      <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {language === 'bn' ? 'ব্যালেন্স' : 'Balance'}
                      </p>
                      <p className={`text-lg sm:text-2xl font-bold mt-1 ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                        ৳{Math.abs(balance).toFixed(2)}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {balance >= 0 
                          ? (language === 'bn' ? 'উদ্বৃত্ত' : 'Surplus')
                          : (language === 'bn' ? 'বকেয়া' : 'Due')}
                      </p>
                    </div>
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${balance >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                      {balance >= 0 ? (
                        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
                      ) : (
                        <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Balance Calculation Breakdown */}
            <Card className="glass-card border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  {language === 'bn' ? 'ব্যালেন্স হিসাব' : 'Balance Calculation'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">{language === 'bn' ? 'মোট জমা' : 'Total Deposit'}</span>
                    <span className="font-medium text-success">৳{totalDeposit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">{language === 'bn' ? 'মিল খরচ' : 'Meal Cost'} ({mealBreakdown.total} × ৳{mealRate.toFixed(2)})</span>
                    <span className="font-medium text-destructive">- ৳{mealCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">{language === 'bn' ? 'মাথাপিছু অতিরিক্ত খরচ' : 'Per-Head Additional Cost'}</span>
                    <span className="font-medium text-destructive">- ৳{perHeadAdditionalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 bg-muted/50 rounded-lg px-2">
                    <span className="font-semibold">{language === 'bn' ? 'অবশিষ্ট ব্যালেন্স' : 'Remaining Balance'}</span>
                    <span className={`font-bold text-lg ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                      ৳{Math.abs(balance).toFixed(2)} {balance < 0 && (language === 'bn' ? '(বকেয়া)' : '(Due)')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

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
          </TabsContent>

          {/* Additional Cost Tab */}
          <TabsContent value="additional-cost" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Card className="glass-card">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {language === 'bn' ? 'মোট অতিরিক্ত খরচ' : 'Total Additional Cost'}
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-warning mt-1">৳{totalAdditionalCosts.toFixed(2)}</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                      <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {language === 'bn' ? 'মোট মেম্বার' : 'Total Members'}
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-primary mt-1">{totalMembers}</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-destructive/20 bg-destructive/5">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {language === 'bn' ? 'আপনার শেয়ার' : 'Your Share'}
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-destructive mt-1">৳{perHeadAdditionalCost.toFixed(2)}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {language === 'bn' ? 'মাথাপিছু' : 'Per-head'}
                      </p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                      <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Costs Table */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  {language === 'bn' ? 'অতিরিক্ত খরচের তালিকা' : 'Additional Costs List'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {additionalCosts.length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">
                      {language === 'bn' ? 'কোনো অতিরিক্ত খরচ নেই' : 'No additional costs yet'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{language === 'bn' ? 'তারিখ' : 'Date'}</TableHead>
                          <TableHead>{language === 'bn' ? 'বিবরণ' : 'Description'}</TableHead>
                          <TableHead className="text-right">{language === 'bn' ? 'পরিমাণ' : 'Amount'}</TableHead>
                          <TableHead className="text-right">{language === 'bn' ? 'মাথাপিছু' : 'Per-Head'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {additionalCosts.map((cost) => (
                          <TableRow key={cost.id}>
                            <TableCell className="text-sm">
                              {new Date(cost.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
                            </TableCell>
                            <TableCell className="font-medium">{cost.description}</TableCell>
                            <TableCell className="text-right text-warning font-medium">
                              ৳{Number(cost.amount).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-destructive font-medium">
                              ৳{(totalMembers > 0 ? Number(cost.amount) / totalMembers : 0).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Explanation Card */}
            <Card className="glass-card bg-muted/30">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{language === 'bn' ? 'নোট:' : 'Note:'}</strong>{' '}
                  {language === 'bn' 
                    ? 'অতিরিক্ত খরচ (বিদ্যুৎ, গ্যাস, পানি ইত্যাদি) সকল মেম্বারের মধ্যে সমানভাবে ভাগ করা হয়। আপনার শেয়ার আপনার মোট মেস বিল এ যুক্ত হয়।'
                    : 'Additional costs (electricity, gas, water, etc.) are divided equally among all members. Your share is added to your total mess bill.'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MemberDashboardLayout>
  );
}
