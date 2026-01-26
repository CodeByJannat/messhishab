import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Copy, Users, Utensils, ShoppingCart, Wallet, TrendingUp, TrendingDown, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardStats {
  totalMembers: number;
  totalMeals: number;
  totalBazar: number;
  totalDeposits: number;
  mealRate: number;
}

export default function ManagerDashboard() {
  const { mess, refreshMess } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [messPassword, setMessPassword] = useState('');
  const [messName, setMessName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    totalMeals: 0,
    totalBazar: 0,
    totalDeposits: 0,
    mealRate: 0,
  });

  useEffect(() => {
    if (mess) {
      setMessPassword(mess.mess_password);
      setMessName(mess.name || '');
      fetchStats();
    }
  }, [mess]);

  const fetchStats = async () => {
    if (!mess) return;

    try {
      // Fetch member count
      const { count: memberCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('mess_id', mess.id)
        .eq('is_active', true);

      // Fetch total meals
      const { data: mealsData } = await supabase
        .from('meals')
        .select('breakfast, lunch, dinner')
        .eq('mess_id', mess.id);

      const totalMeals = mealsData?.reduce(
        (sum, meal) => sum + meal.breakfast + meal.lunch + meal.dinner,
        0
      ) || 0;

      // Fetch total bazar
      const { data: bazarData } = await supabase
        .from('bazars')
        .select('cost')
        .eq('mess_id', mess.id);

      const totalBazar = bazarData?.reduce((sum, b) => sum + Number(b.cost), 0) || 0;

      // Fetch total deposits
      const { data: depositData } = await supabase
        .from('deposits')
        .select('amount')
        .eq('mess_id', mess.id);

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

    try {
      const { error } = await supabase
        .from('messes')
        .update({
          mess_password: messPassword,
          name: messName || null,
        })
        .eq('id', mess.id);

      if (error) throw error;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'মেস তথ্য আপডেট হয়েছে' : 'Mess info updated',
      });

      setIsEditing(false);
      refreshMess();
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const copyMessId = () => {
    if (mess) {
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
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'bn' ? 'আপনার মেসের সারসংক্ষেপ' : 'Overview of your mess'}
          </p>
        </div>

        {/* Mess Info Card */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{language === 'bn' ? 'মেস তথ্য' : 'Mess Info'}</span>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  {language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    {language === 'bn' ? 'বাতিল' : 'Cancel'}
                  </Button>
                  <Button size="sm" onClick={handleUpdateMess}>
                    {language === 'bn' ? 'সেভ' : 'Save'}
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Mess ID */}
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'মেস আইডি' : 'Mess ID'}</Label>
                <div className="flex gap-2">
                  <Input value={mess?.mess_id || ''} readOnly className="rounded-xl" />
                  <Button variant="outline" size="icon" onClick={copyMessId} className="rounded-xl">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
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

              {/* Mess Name */}
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'মেসের নাম (ঐচ্ছিক)' : 'Mess Name (Optional)'}</Label>
                <Input
                  value={messName}
                  onChange={(e) => setMessName(e.target.value)}
                  readOnly={!isEditing}
                  placeholder={language === 'bn' ? 'মেসের নাম লিখুন' : 'Enter mess name'}
                  className="rounded-xl"
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
