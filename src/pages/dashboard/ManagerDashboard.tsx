import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { InfoCard, HighlightCard } from '@/components/dashboard/InfoCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDateValidation } from '@/hooks/useDateValidation';
import { Copy, Users, Utensils, ShoppingCart, Wallet, TrendingUp, TrendingDown, Loader2, CheckCircle, XCircle, Calendar, Home, Pencil, Check, X, Receipt, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { format, parseISO, endOfMonth } from 'date-fns';

interface DashboardStats {
  totalMembers: number;
  totalMeals: number;
  totalBazar: number;
  totalDeposits: number;
  mealRate: number;
}

interface AvailableMonth {
  value: string;
  label: string;
}

export default function ManagerDashboard() {
  const { mess, subscription, refreshMess } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const { filterValidMonths } = useDateValidation();
  
  const [messName, setMessName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    totalMeals: 0,
    totalBazar: 0,
    totalDeposits: 0,
    mealRate: 0,
  });
  const [totalAdditionalCosts, setTotalAdditionalCosts] = useState(0);
  
  // Monthly selection
  const [availableMonths, setAvailableMonths] = useState<AvailableMonth[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Track original name to detect changes
  const [originalName, setOriginalName] = useState('');

  // Determine if there are unsaved changes
  const hasNameChanges = useMemo(() => {
    return messName !== originalName;
  }, [messName, originalName]);

  // Determine subscription status - check if subscription exists, is active, AND not expired
  const isSubscriptionActive = subscription?.status === 'active' && 
    new Date(subscription.end_date) > new Date();

  useEffect(() => {
    if (mess) {
      setMessName(mess.name || '');
      setOriginalName(mess.name || '');
      fetchAvailableMonths();
    }
  }, [mess]);

  useEffect(() => {
    if (mess && selectedMonth) {
      fetchStats();
    }
  }, [mess, selectedMonth]);

  const fetchAvailableMonths = async () => {
    if (!mess) return;

    try {
      const [mealsRes, bazarsRes, depositsRes] = await Promise.all([
        supabase.from('meals').select('date').eq('mess_id', mess.id),
        supabase.from('bazars').select('date').eq('mess_id', mess.id),
        supabase.from('deposits').select('date').eq('mess_id', mess.id),
      ]);

      const monthsSet = new Set<string>();
      monthsSet.add(format(new Date(), 'yyyy-MM'));
      
      [...(mealsRes.data || []), ...(bazarsRes.data || []), ...(depositsRes.data || [])].forEach(item => {
        monthsSet.add(item.date.substring(0, 7));
      });

      const months = Array.from(monthsSet).sort((a, b) => b.localeCompare(a)).map(month => ({
        value: month,
        label: format(parseISO(`${month}-01`), language === 'bn' ? 'MMMM yyyy' : 'MMMM yyyy'),
      }));

      const validMonths = filterValidMonths(months);
      setAvailableMonths(validMonths);
      
      if (validMonths.length > 0 && !validMonths.find(m => m.value === selectedMonth)) {
        setSelectedMonth(validMonths[0].value);
      }
    } catch (error) {
      console.error('Error fetching months:', error);
    }
  };

  const fetchStats = async () => {
    if (!mess || !selectedMonth) return;

    try {
      const startDate = `${selectedMonth}-01`;
      const endDate = format(endOfMonth(parseISO(startDate)), 'yyyy-MM-dd');

      // Fetch member count
      const { count: memberCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('mess_id', mess.id)
        .eq('is_active', true);

      // Fetch meals for selected month
      const { data: mealsData } = await supabase
        .from('meals')
        .select('breakfast, lunch, dinner')
        .eq('mess_id', mess.id)
        .gte('date', startDate)
        .lte('date', endDate);

      const totalMeals = mealsData?.reduce(
        (sum, meal) => sum + meal.breakfast + meal.lunch + meal.dinner,
        0
      ) || 0;

      // Fetch bazar for selected month
      const { data: bazarData } = await supabase
        .from('bazars')
        .select('cost')
        .eq('mess_id', mess.id)
        .gte('date', startDate)
        .lte('date', endDate);

      const totalBazar = bazarData?.reduce((sum, b) => sum + Number(b.cost), 0) || 0;

      // Fetch deposits for selected month
      const { data: depositData } = await supabase
        .from('deposits')
        .select('amount')
        .eq('mess_id', mess.id)
        .gte('date', startDate)
        .lte('date', endDate);

      const totalDeposits = depositData?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

      // Fetch additional costs for selected month
      const { data: additionalCostsData } = await supabase
        .from('additional_costs')
        .select('amount')
        .eq('mess_id', mess.id)
        .gte('date', startDate)
        .lte('date', endDate);

      const additionalCostsTotal = additionalCostsData?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
      setTotalAdditionalCosts(additionalCostsTotal);

      // Calculate meal rate
      const mealRate = totalMeals > 0 ? totalBazar / totalMeals : 0;

      setStats({
        totalMembers: memberCount || 0,
        totalMeals,
        totalBazar,
        totalDeposits,
        mealRate,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleUpdateMessName = async () => {
    if (!mess) return;

    // Validate mess name
    if (messName.trim() && messName.trim().length < 2) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'মেসের নাম কমপক্ষে ২ অক্ষরের হতে হবে' : 'Mess name must be at least 2 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('messes')
        .update({ name: messName.trim() || null })
        .eq('id', mess.id);

      if (error) throw error;

      setOriginalName(messName.trim());

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'মেসের নাম আপডেট হয়েছে' : 'Mess name updated successfully',
      });

      setIsEditingName(false);
      await refreshMess();
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message || (language === 'bn' ? 'আপডেট করা যায়নি' : 'Failed to update'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setMessName(originalName);
  };

  const copyMessId = () => {
    if (mess && mess.mess_id !== 'PENDING') {
      navigator.clipboard.writeText(mess.mess_id);
      toast({
        title: language === 'bn' ? 'কপি হয়েছে!' : 'Copied!',
        description: mess.mess_id,
      });
    }
  };

  // Remaining Balance = Total Deposit − (Total Bazar Cost + Total Additional Cost)
  const balance = stats.totalDeposits - (stats.totalBazar + totalAdditionalCosts);

  return (
    <DashboardLayout>
      <div className="space-y-6 lg:space-y-8">
        {/* Page Header with Month Selector */}
        <DashboardHeader
          title={language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}
          subtitle={language === 'bn' ? 'আপনার মেসের মাসিক সারসংক্ষেপ' : 'Monthly overview of your mess'}
        >
          <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-1 pr-3">
            <Calendar className="w-4 h-4 text-muted-foreground ml-2" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[160px] sm:w-[180px] border-0 bg-transparent focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder={language === 'bn' ? 'মাস সিলেক্ট করুন' : 'Select month'} />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DashboardHeader>

        {/* Mess Info Card */}
        <InfoCard icon={Home} iconColor="text-primary" variant="gradient">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            {/* Mess ID */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {language === 'bn' ? 'মেস আইডি' : 'Mess ID'}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-mono font-bold text-primary">
                  {mess?.mess_id || '-'}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={copyMessId} 
                  className="h-7 w-7 rounded-lg hover:bg-primary/10"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Mess Name */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {language === 'bn' ? 'মেসের নাম' : 'Mess Name'}
              </p>
              {!isEditingName ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-medium truncate max-w-[120px] sm:max-w-none">
                    {mess?.name || (language === 'bn' ? 'নাম সেট করা হয়নি' : 'Not set')}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsEditingName(true)} 
                    className="h-7 w-7 rounded-lg hover:bg-muted"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Input
                    value={messName}
                    onChange={(e) => setMessName(e.target.value)}
                    placeholder={language === 'bn' ? 'মেসের নাম' : 'Mess name'}
                    className="h-8 rounded-lg text-sm max-w-[120px] sm:max-w-[160px]"
                    autoFocus
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleUpdateMessName} 
                    disabled={isSaving || !hasNameChanges}
                    className="h-7 w-7 rounded-lg text-success hover:bg-success/10"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleCancelEditName}
                    disabled={isSaving}
                    className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-muted"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs text-muted-foreground mb-1">
                {language === 'bn' ? 'স্ট্যাটাস' : 'Status'}
              </p>
              {isSubscriptionActive ? (
                <Badge className="bg-success/10 text-success border-0 font-medium text-xs px-3 py-1">
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  {language === 'bn' ? 'সক্রিয়' : 'Active'}
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-muted text-muted-foreground border-0 font-medium text-xs px-3 py-1">
                  <XCircle className="w-3.5 h-3.5 mr-1.5" />
                  {language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'}
                </Badge>
              )}
            </div>
          </div>
        </InfoCard>

        {/* Subscribe Now CTA for Inactive Messes */}
        {!isSubscriptionActive && (
          <HighlightCard
            title={language === 'bn' ? 'সাবস্ক্রিপশন প্রয়োজন' : 'Subscription Required'}
            description={
              language === 'bn'
                ? 'সমস্ত ফিচার ব্যবহার করতে সাবস্ক্রাইব করুন। মাত্র ২০ টাকা/মাস।'
                : 'Subscribe to access all features. Only ৳20/month.'
            }
            variant="warning"
            action={
              <Link to="/manager/subscription">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 gap-2">
                  <Sparkles className="w-4 h-4" />
                  {language === 'bn' ? 'সাবস্ক্রাইব করুন' : 'Subscribe Now'}
                </Button>
              </Link>
            }
          />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <StatCard
            title={language === 'bn' ? 'মোট মেম্বার' : 'Total Members'}
            value={stats.totalMembers}
            icon={Users}
            color="accent"
            delay={0}
          />
          <StatCard
            title={language === 'bn' ? 'মোট মিল' : 'Total Meals'}
            value={stats.totalMeals}
            icon={Utensils}
            color="secondary"
            delay={0.1}
          />
          <StatCard
            title={language === 'bn' ? 'মোট বাজার' : 'Total Bazar'}
            value={`৳${stats.totalBazar.toFixed(0)}`}
            icon={ShoppingCart}
            color="warning"
            delay={0.2}
          />
          <StatCard
            title={language === 'bn' ? 'মোট জমা' : 'Total Deposits'}
            value={`৳${stats.totalDeposits.toFixed(0)}`}
            icon={Wallet}
            color="success"
            delay={0.3}
          />
          <StatCard
            title={language === 'bn' ? 'অতিরিক্ত খরচ' : 'Additional Cost'}
            value={`৳${totalAdditionalCosts.toFixed(0)}`}
            icon={Receipt}
            color="destructive"
            delay={0.4}
          />
        </div>

        {/* Balance & Meal Rate Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <Card className="h-full overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  {balance >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-success" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-destructive" />
                  )}
                  {language === 'bn' ? 'অবশিষ্ট ব্যালেন্স' : 'Remaining Balance'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl sm:text-4xl font-bold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                      ৳{Math.abs(balance).toFixed(2)}
                    </span>
                    <span className={`text-sm font-medium ${balance >= 0 ? 'text-success/80' : 'text-destructive/80'}`}>
                      {balance >= 0 
                        ? (language === 'bn' ? 'উদ্বৃত্ত' : 'Surplus')
                        : (language === 'bn' ? 'বকেয়া' : 'Due')}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                    <p className="font-medium mb-1">{language === 'bn' ? 'হিসাব:' : 'Calculation:'}</p>
                    <p>৳{stats.totalDeposits.toFixed(0)} - (৳{stats.totalBazar.toFixed(0)} + ৳{totalAdditionalCosts.toFixed(0)})</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Meal Rate Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <Card className="h-full overflow-hidden border-2 border-secondary/20 bg-gradient-to-br from-card via-card to-secondary/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Utensils className="w-5 h-5 text-secondary" />
                  {language === 'bn' ? 'মিল রেট' : 'Meal Rate'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-bold text-secondary">
                      ৳{stats.mealRate.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {language === 'bn' ? 'প্রতি মিল' : 'per meal'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                    <p className="font-medium mb-1">{language === 'bn' ? 'হিসাব:' : 'Calculation:'}</p>
                    <p>৳{stats.totalBazar.toFixed(0)} ÷ {stats.totalMeals} {language === 'bn' ? 'মিল' : 'meals'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {language === 'bn' ? 'দ্রুত কার্যক্রম' : 'Quick Actions'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {[
                  { to: '/manager/members', icon: Users, label: language === 'bn' ? 'মেম্বার' : 'Members', color: 'text-accent' },
                  { to: '/manager/meals', icon: Utensils, label: language === 'bn' ? 'মিল' : 'Meals', color: 'text-secondary' },
                  { to: '/manager/bazar', icon: ShoppingCart, label: language === 'bn' ? 'বাজার' : 'Bazar', color: 'text-warning' },
                  { to: '/manager/deposits', icon: Wallet, label: language === 'bn' ? 'জমা' : 'Deposits', color: 'text-success' },
                ].map((action) => (
                  <Link key={action.to} to={action.to}>
                    <Button
                      variant="outline"
                      className="w-full h-auto py-4 flex-col gap-2 rounded-xl hover:bg-muted/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <action.icon className={`w-5 h-5 ${action.color}`} />
                      <span className="text-xs font-medium">{action.label}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
