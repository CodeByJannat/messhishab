import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { MessNameSetupModal } from '@/components/dashboard/MessNameSetupModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Copy, Users, Utensils, ShoppingCart, Wallet, TrendingUp, TrendingDown, Eye, EyeOff, Loader2, CheckCircle, XCircle, Calendar } from 'lucide-react';
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
  
  const [showPassword, setShowPassword] = useState(false);
  const [messPassword, setMessPassword] = useState('');
  const [messName, setMessName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
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

  // Check if mess name is not set OR mess_id is still PENDING - show blocking modal
  const showMessNameModal = mess && (!mess.name || mess.mess_id === 'PENDING');

  // Track original values to detect changes
  const [originalPassword, setOriginalPassword] = useState('');
  const [originalName, setOriginalName] = useState('');

  // Determine if there are unsaved changes
  const hasChanges = useMemo(() => {
    return messPassword !== originalPassword || messName !== originalName;
  }, [messPassword, messName, originalPassword, originalName]);

  // Determine subscription status - check if subscription exists, is active, AND not expired
  const isSubscriptionActive = subscription?.status === 'active' && 
    new Date(subscription.end_date) > new Date();

  useEffect(() => {
    if (mess) {
      setMessPassword(mess.mess_password);
      setMessName(mess.name || '');
      setOriginalPassword(mess.mess_password);
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

  const handleUpdateMess = async () => {
    if (!mess) return;

    // Validate inputs
    if (!messPassword.trim()) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'পাসওয়ার্ড খালি রাখা যাবে না' : 'Password cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    if (messPassword.trim().length < 4) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে' : 'Password must be at least 4 characters',
        variant: 'destructive',
      });
      return;
    }

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
      const updateData: { mess_password: string; name: string | null } = {
        mess_password: messPassword.trim(),
        name: messName.trim() || null,
      };

      const { error } = await supabase
        .from('messes')
        .update(updateData)
        .eq('id', mess.id);

      if (error) throw error;

      // Update original values after successful save
      setOriginalPassword(messPassword.trim());
      setOriginalName(messName.trim());

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'মেস তথ্য সফলভাবে আপডেট হয়েছে' : 'Mess info updated successfully',
      });

      setIsEditing(false);
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

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset to original values
    setMessPassword(originalPassword);
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
      {/* Mess Name Setup Modal - Blocking */}
      {showMessNameModal && (
        <MessNameSetupModal isOpen={true} messId={mess.id} />
      )}

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

        {/* Mess Info Card */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span>{language === 'bn' ? 'মেস তথ্য' : 'Mess Info'}</span>
                {/* Subscription Status Badge */}
                {isSubscriptionActive ? (
                  <Badge variant="default" className="bg-success/10 text-success border-success/20 hover:bg-success/20">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {language === 'bn' ? 'সক্রিয়' : 'Active'}
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">
                    <XCircle className="w-3 h-3 mr-1" />
                    {language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'}
                  </Badge>
                )}
              </div>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  {language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    {language === 'bn' ? 'বাতিল' : 'Cancel'}
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleUpdateMess} 
                    disabled={isSaving || !hasChanges}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      language === 'bn' ? 'সেভ' : 'Save'
                    )}
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Mess ID */}
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'মেস আইডি' : 'Mess ID'}</Label>
                <div className="flex gap-2">
                  <Input 
                    value={mess?.mess_id === 'PENDING' ? (language === 'bn' ? 'অপেক্ষমাণ...' : 'Pending...') : (mess?.mess_id || '')} 
                    readOnly 
                    className="rounded-xl bg-muted/50 font-mono" 
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={copyMessId} 
                    className="rounded-xl"
                    disabled={!mess || mess.mess_id === 'PENDING'}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Mess Name */}
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'মেসের নাম' : 'Mess Name'}</Label>
                <Input
                  value={messName}
                  onChange={(e) => setMessName(e.target.value)}
                  readOnly={!isEditing}
                  placeholder={language === 'bn' ? 'মেসের নাম লিখুন' : 'Enter mess name'}
                  className="rounded-xl"
                />
              </div>

              {/* Mess Password */}
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'মেস পাসওয়ার্ড' : 'Mess Password'}</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={messPassword}
                      onChange={(e) => setMessPassword(e.target.value)}
                      readOnly={!isEditing}
                      className="rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Current Month */}
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'বর্তমান মাস' : 'Current Month'}</Label>
                <Input 
                  value={mess?.current_month || ''} 
                  readOnly 
                  className="rounded-xl bg-muted/50" 
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {language === 'bn'
                ? 'মেম্বাররা এই মেস আইডি ও পাসওয়ার্ড দিয়ে লগইন করবে।'
                : 'Members will use this Mess ID and password to login.'}
            </p>
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Meal Rate & Balance */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'bn' ? 'মিল রেট' : 'Meal Rate'}
                  </p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    ৳{stats.mealRate.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'bn' ? 'প্রতি মিল' : 'per meal'}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Utensils className="w-8 h-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'bn' ? 'মোট ব্যালেন্স' : 'Total Balance'}
                  </p>
                  <p className={`text-3xl font-bold mt-1 ${
                    balance > 0 ? 'text-success' : balance < 0 ? 'text-destructive' : 'text-foreground'
                  }`}>
                    ৳{Math.abs(balance).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {balance > 0
                      ? language === 'bn' ? 'উদ্বৃত্ত' : 'Surplus'
                      : balance < 0
                      ? language === 'bn' ? 'ঘাটতি' : 'Deficit'
                      : language === 'bn' ? 'সমান' : 'Balanced'}
                  </p>
                </div>
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                  balance >= 0 ? 'bg-success/10' : 'bg-destructive/10'
                }`}>
                  {balance >= 0 ? (
                    <TrendingUp className="w-8 h-8 text-success" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-destructive" />
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
