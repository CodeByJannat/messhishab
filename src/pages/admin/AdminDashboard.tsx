import { useEffect, useState } from 'react';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatCard, StatCardCompact } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Building2, CheckCircle, XCircle, Ban, CreditCard, Clock, X, TrendingUp, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface MessStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
}

interface PaymentStats {
  approved: number;
  pending: number;
  rejected: number;
}

interface RevenueData {
  period: string;
  revenue: number;
}

export default function AdminDashboard() {
  const { language } = useLanguage();
  const [messStats, setMessStats] = useState<MessStats>({ total: 0, active: 0, inactive: 0, suspended: 0 });
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({ approved: 0, pending: 0, rejected: 0 });
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [revenueFilter, setRevenueFilter] = useState('all');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [revenueFilter]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Fetch mess stats
      const { data: messes } = await supabase
        .from('messes')
        .select('status');
      
      if (messes) {
        const stats: MessStats = {
          total: messes.length,
          active: messes.filter(m => m.status === 'active').length,
          inactive: messes.filter(m => m.status === 'inactive').length,
          suspended: messes.filter(m => m.status === 'suspended').length,
        };
        setMessStats(stats);
      }

      // Fetch payment stats
      const { data: payments } = await supabase
        .from('payments')
        .select('status, amount, created_at');
      
      if (payments) {
        const pStats: PaymentStats = {
          approved: payments.filter(p => p.status === 'approved').length,
          pending: payments.filter(p => p.status === 'pending').length,
          rejected: payments.filter(p => p.status === 'rejected').length,
        };
        setPaymentStats(pStats);

        // Calculate revenue
        const approvedPayments = payments.filter(p => p.status === 'approved');
        const total = approvedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        setTotalRevenue(total);

        // Group revenue by period
        const now = new Date();
        let filteredPayments = approvedPayments;
        
        if (revenueFilter === 'weekly') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filteredPayments = approvedPayments.filter(p => new Date(p.created_at) >= weekAgo);
        } else if (revenueFilter === 'monthly') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filteredPayments = approvedPayments.filter(p => new Date(p.created_at) >= monthAgo);
        } else if (revenueFilter === 'yearly') {
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          filteredPayments = approvedPayments.filter(p => new Date(p.created_at) >= yearAgo);
        }

        // Group by month for chart
        const grouped: { [key: string]: number } = {};
        filteredPayments.forEach(p => {
          const date = new Date(p.created_at);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          grouped[key] = (grouped[key] || 0) + Number(p.amount);
        });

        const chartData = Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([period, revenue]) => ({
            period: language === 'bn' ? period : period,
            revenue,
          }));
        
        setRevenueData(chartData);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <DashboardHeader
          title={language === 'bn' ? 'এডমিন ড্যাশবোর্ড' : 'Admin Dashboard'}
          subtitle={language === 'bn' ? 'সিস্টেম ওভারভিউ এবং পরিসংখ্যান' : 'System overview and statistics'}
        />

        {/* Top Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title={language === 'bn' ? 'মোট মেস' : 'Total Mess'}
            value={messStats.total}
            icon={Building2}
            color="accent"
            delay={0}
          />
          <StatCard
            title={language === 'bn' ? 'সক্রিয়' : 'Active'}
            value={messStats.active}
            icon={CheckCircle}
            color="success"
            delay={0.1}
          />
          <StatCard
            title={language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'}
            value={messStats.inactive}
            icon={XCircle}
            color="warning"
            delay={0.2}
          />
          <StatCard
            title={language === 'bn' ? 'স্থগিত' : 'Suspended'}
            value={messStats.suspended}
            icon={Ban}
            color="destructive"
            delay={0.3}
          />
        </div>

        {/* Payment Status & Revenue Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Payment Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="lg:col-span-1"
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  {language === 'bn' ? 'পেমেন্ট স্ট্যাটাস' : 'Payment Status'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: language === 'bn' ? 'অনুমোদিত' : 'Approved', value: paymentStats.approved, icon: CreditCard, color: 'success' as const },
                  { label: language === 'bn' ? 'অপেক্ষমাণ' : 'Pending', value: paymentStats.pending, icon: Clock, color: 'warning' as const },
                  { label: language === 'bn' ? 'প্রত্যাখ্যাত' : 'Rejected', value: paymentStats.rejected, icon: X, color: 'destructive' as const },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className={`flex items-center justify-between p-3 rounded-xl bg-${item.color}/5 border border-${item.color}/10`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg bg-${item.color}/10 flex items-center justify-center`}>
                        <item.icon className={`w-4 h-4 text-${item.color}`} />
                      </div>
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                    </div>
                    <span className={`text-xl font-bold text-${item.color}`}>{item.value}</span>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Revenue Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="h-full">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2">
                <div>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-success" />
                    {language === 'bn' ? 'রেভিনিউ ওভারভিউ' : 'Revenue Overview'}
                  </CardTitle>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl sm:text-3xl font-bold text-success">৳{totalRevenue.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">{language === 'bn' ? 'মোট' : 'total'}</span>
                  </div>
                </div>
                <Select value={revenueFilter} onValueChange={setRevenueFilter}>
                  <SelectTrigger className="w-full sm:w-36 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'bn' ? 'সব সময়' : 'All Time'}</SelectItem>
                    <SelectItem value="weekly">{language === 'bn' ? 'সাপ্তাহিক' : 'Weekly'}</SelectItem>
                    <SelectItem value="monthly">{language === 'bn' ? 'মাসিক' : 'Monthly'}</SelectItem>
                    <SelectItem value="yearly">{language === 'bn' ? 'বাৎসরিক' : 'Yearly'}</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="pt-4">
                {revenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                      <XAxis 
                        dataKey="period" 
                        className="text-muted-foreground" 
                        tick={{ fontSize: 11 }} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        className="text-muted-foreground" 
                        tick={{ fontSize: 11 }} 
                        width={60}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `৳${value}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.75rem',
                          fontSize: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value: number) => [`৳${value.toLocaleString()}`, language === 'bn' ? 'রেভিনিউ' : 'Revenue']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--success))" 
                        strokeWidth={2}
                        fill="url(#revenueGradient)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">
                        {isLoading 
                          ? (language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...') 
                          : (language === 'bn' ? 'কোনো ডেটা নেই' : 'No data available')
                        }
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
}
