import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
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
import { Copy, Users, Utensils, ShoppingCart, Wallet, TrendingUp, TrendingDown, Loader2, CheckCircle, XCircle, Calendar, Home, Pencil, Check, X } from 'lucide-react';
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

  const statCards = [
    {
      title: language === 'bn' ? 'মোট মেম্বার' : 'Total Members',
      value: stats.totalMembers,
      icon: Users,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: language === 'bn' ? 'মোট মিল' : 'Total Meals',
      value: stats.totalMeals,
      icon: Utensils,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      title: language === 'bn' ? 'মোট বাজার' : 'Total Bazar',
      value: `৳${stats.totalBazar.toFixed(2)}`,
      icon: ShoppingCart,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: language === 'bn' ? 'মোট জমা' : 'Total Deposits',
      value: `৳${stats.totalDeposits.toFixed(2)}`,
      icon: Wallet,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  const balance = stats.totalDeposits - stats.totalBazar;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'bn' ? 'আপনার মেসের মাসিক সারসংক্ষেপ' : 'Monthly overview of your mess'}
            </p>
          </div>
          
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px] rounded-xl">
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
        </div>

        {/* Mess Info Card - Clean & Compact */}
        <Card className="border bg-card/50 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              {/* Icon */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
                <Home className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              
              {/* Info Grid */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Mess ID */}
                <div className="text-center sm:text-left">
                  <p className="text-xs text-muted-foreground mb-1">
                    {language === 'bn' ? 'মেস আইডি' : 'Mess ID'}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    <span className="text-sm sm:text-lg font-mono font-bold text-primary">
                      {mess?.mess_id || '-'}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={copyMessId} 
                      className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg hover:bg-primary/10"
                    >
                      <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Mess Name */}
                <div className="text-center sm:text-left">
                  <p className="text-xs text-muted-foreground mb-1">
                    {language === 'bn' ? 'মেসের নাম' : 'Mess Name'}
                  </p>
                  {!isEditingName ? (
                    <div className="flex items-center justify-center sm:justify-start gap-1.5">
                      <span className="text-sm sm:text-base font-medium truncate max-w-[100px] sm:max-w-none">
                        {mess?.name || (language === 'bn' ? 'নাম সেট করা হয়নি' : 'Not set')}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setIsEditingName(true)} 
                        className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg hover:bg-muted shrink-0"
                      >
                        <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center sm:justify-start gap-1.5">
                      <Input
                        value={messName}
                        onChange={(e) => setMessName(e.target.value)}
                        placeholder={language === 'bn' ? 'মেসের নাম' : 'Mess name'}
                        className="h-7 sm:h-8 rounded-lg text-xs sm:text-sm max-w-[100px] sm:max-w-[160px]"
                        autoFocus
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleUpdateMessName} 
                        disabled={isSaving || !hasNameChanges}
                        className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg text-success hover:bg-success/10 shrink-0"
                      >
                        {isSaving ? <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" /> : <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleCancelEditName}
                        disabled={isSaving}
                        className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg text-muted-foreground hover:bg-muted shrink-0"
                      >
                        <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="col-span-2 sm:col-span-1 text-center sm:text-left">
                  <p className="text-xs text-muted-foreground mb-1">
                    {language === 'bn' ? 'স্ট্যাটাস' : 'Status'}
                  </p>
                  {isSubscriptionActive ? (
                    <Badge className="bg-success/10 text-success border-0 font-medium text-xs">
                      <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
                      {language === 'bn' ? 'সক্রিয়' : 'Active'}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground border-0 font-medium text-xs">
                      <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
                      {language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscribe Now CTA for Inactive Messes */}
        {!isSubscriptionActive && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card border-warning/30 bg-warning/5 p-6 rounded-2xl"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-semibold text-foreground">
                  {language === 'bn' ? 'সাবস্ক্রিপশন প্রয়োজন' : 'Subscription Required'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === 'bn'
                    ? 'সমস্ত ফিচার ব্যবহার করতে সাবস্ক্রাইব করুন। মাত্র ২০ টাকা/মাস।'
                    : 'Subscribe to access all features. Only ৳20/month.'}
                </p>
              </div>
              <Link to="/manager/subscription">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6">
                  {language === 'bn' ? 'সাবস্ক্রাইব করুন' : 'Subscribe Now'}
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="glass-card">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.title}</p>
                      <p className="text-lg sm:text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    </div>
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.bgColor} flex items-center justify-center shrink-0`}>
                      <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Meal Rate & Balance */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Card className="glass-card">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {language === 'bn' ? 'মিল রেট' : 'Meal Rate'}
                  </p>
                  <p className="text-xl sm:text-3xl font-bold text-foreground mt-1">
                    ৳{stats.mealRate.toFixed(2)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    {language === 'bn' ? 'প্রতি মিল' : 'per meal'}
                  </p>
                </div>
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Utensils className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {language === 'bn' ? 'মোট ব্যালেন্স' : 'Balance'}
                  </p>
                  <p className={`text-xl sm:text-3xl font-bold mt-1 ${
                    balance > 0 ? 'text-success' : balance < 0 ? 'text-destructive' : 'text-foreground'
                  }`}>
                    ৳{Math.abs(balance).toFixed(2)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    {balance > 0
                      ? language === 'bn' ? 'উদ্বৃত্ত' : 'Surplus'
                      : balance < 0
                      ? language === 'bn' ? 'ঘাটতি' : 'Deficit'
                      : language === 'bn' ? 'সমান' : 'Balanced'}
                  </p>
                </div>
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shrink-0 ${
                  balance >= 0 ? 'bg-success/10' : 'bg-destructive/10'
                }`}>
                  {balance >= 0 ? (
                    <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-success" />
                  ) : (
                    <TrendingDown className="w-6 h-6 sm:w-8 sm:h-8 text-destructive" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
