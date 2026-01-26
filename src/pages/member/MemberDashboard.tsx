import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MemberDashboardLayout } from '@/components/dashboard/MemberDashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Utensils, Wallet, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface MemberStats {
  totalMeals: number;
  totalDeposit: number;
  totalCost: number;
  balance: number;
  mealRate: number;
}

export default function MemberDashboard() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [memberName, setMemberName] = useState('');

  useEffect(() => {
    if (user) {
      fetchMemberStats();
    }
  }, [user]);

  const fetchMemberStats = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Fetch member info
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('id, name, mess_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (memberError) throw memberError;
      setMemberName(memberData.name);

      // Fetch member's meals
      const { data: mealsData } = await supabase
        .from('meals')
        .select('breakfast, lunch, dinner')
        .eq('member_id', memberData.id);

      const totalMeals = mealsData?.reduce(
        (sum, m) => sum + m.breakfast + m.lunch + m.dinner,
        0
      ) || 0;

      // Fetch member's deposits
      const { data: depositsData } = await supabase
        .from('deposits')
        .select('amount')
        .eq('member_id', memberData.id);

      const totalDeposit = depositsData?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

      // Fetch all bazars for meal rate calculation
      const { data: bazarsData } = await supabase
        .from('bazars')
        .select('cost')
        .eq('mess_id', memberData.mess_id);

      const totalBazar = bazarsData?.reduce((sum, b) => sum + Number(b.cost), 0) || 0;

      // Fetch all meals for meal rate calculation
      const { data: allMealsData } = await supabase
        .from('meals')
        .select('breakfast, lunch, dinner')
        .eq('mess_id', memberData.mess_id);

      const allMeals = allMealsData?.reduce(
        (sum, m) => sum + m.breakfast + m.lunch + m.dinner,
        0
      ) || 0;

      const mealRate = allMeals > 0 ? totalBazar / allMeals : 0;
      const totalCost = totalMeals * mealRate;
      const balance = totalDeposit - totalCost;

      setStats({
        totalMeals,
        totalDeposit,
        totalCost,
        balance,
        mealRate,
      });
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
            {language === 'bn' ? `স্বাগতম, ${memberName}!` : `Welcome, ${memberName}!`}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'bn' ? 'আপনার হিসাবের সারসংক্ষেপ' : 'Your account summary'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'bn' ? 'মোট মিল' : 'Total Meals'}
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {stats?.totalMeals || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Utensils className="w-6 h-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'bn' ? 'মোট জমা' : 'Total Deposit'}
                    </p>
                    <p className="text-2xl font-bold text-success mt-1">
                      ৳{stats?.totalDeposit.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'bn' ? 'মোট খরচ' : 'Total Cost'}
                    </p>
                    <p className="text-2xl font-bold text-warning mt-1">
                      ৳{stats?.totalCost.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'bn' ? 'ব্যালেন্স' : 'Balance'}
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${
                      (stats?.balance || 0) >= 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      ৳{Math.abs(stats?.balance || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(stats?.balance || 0) >= 0
                        ? language === 'bn' ? 'উদ্বৃত্ত' : 'Surplus'
                        : language === 'bn' ? 'বকেয়া' : 'Due'}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    (stats?.balance || 0) >= 0 ? 'bg-success/10' : 'bg-destructive/10'
                  }`}>
                    {(stats?.balance || 0) >= 0 ? (
                      <TrendingUp className="w-6 h-6 text-success" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-destructive" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Meal Rate Card */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' ? 'বর্তমান মিল রেট' : 'Current Meal Rate'}
                </p>
                <p className="text-3xl font-bold text-primary mt-1">
                  ৳{stats?.mealRate.toFixed(2) || '0.00'}
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
      </div>
    </MemberDashboardLayout>
  );
}
