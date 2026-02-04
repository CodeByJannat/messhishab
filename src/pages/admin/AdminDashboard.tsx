import { useEffect, useState } from 'react';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Building2, CheckCircle, XCircle, Ban, CreditCard, Clock, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

  const messCards = [
    { label: language === 'bn' ? 'মোট মেস' : 'Total Mess', value: messStats.total, icon: Building2, color: 'bg-accent' },
    { label: language === 'bn' ? 'সক্রিয়' : 'Active', value: messStats.active, icon: CheckCircle, color: 'bg-success' },
    { label: language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive', value: messStats.inactive, icon: XCircle, color: 'bg-warning' },
    { label: language === 'bn' ? 'স্থগিত' : 'Suspended', value: messStats.suspended, icon: Ban, color: 'bg-destructive' },
  ];

  const paymentCards = [
    { label: language === 'bn' ? 'অনুমোদিত' : 'Approved', value: paymentStats.approved, icon: CreditCard, color: 'bg-success' },
    { label: language === 'bn' ? 'অপেক্ষমাণ' : 'Pending', value: paymentStats.pending, icon: Clock, color: 'bg-warning' },
    { label: language === 'bn' ? 'প্রত্যাখ্যাত' : 'Rejected', value: paymentStats.rejected, icon: X, color: 'bg-destructive' },
  ];

  return (
    <AdminDashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {language === 'bn' ? 'এডমিন ড্যাশবোর্ড' : 'Admin Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'bn' ? 'সিস্টেম ওভারভিউ এবং পরিসংখ্যান' : 'System overview and statistics'}
          </p>
        </div>

        {/* Mess Status Cards */}
        <div>
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground">
            {language === 'bn' ? 'মেস স্ট্যাটাস' : 'Mess Status'}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {messCards.map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass-card">
                  <CardContent className="p-4 sm:pt-6">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{card.label}</p>
                        <p className="text-xl sm:text-3xl font-bold text-foreground">{card.value}</p>
                      </div>
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${card.color} flex items-center justify-center shrink-0`}>
                        <card.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Payment Status Cards */}
        <div>
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground">
            {language === 'bn' ? 'পেমেন্ট স্ট্যাটাস' : 'Payment Status'}
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {paymentCards.map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Card className="glass-card">
                  <CardContent className="p-3 sm:pt-6">
                    <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2">
                      <div className="text-center sm:text-left order-2 sm:order-1">
                        <p className="text-[10px] sm:text-sm text-muted-foreground">{card.label}</p>
                        <p className="text-lg sm:text-3xl font-bold text-foreground">{card.value}</p>
                      </div>
                      <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-xl ${card.color} flex items-center justify-center order-1 sm:order-2`}>
                        <card.icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Revenue Overview */}
        <Card className="glass-card">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 pb-2 sm:pb-4">
            <div>
              <CardTitle className="text-base sm:text-lg">{language === 'bn' ? 'রেভিনিউ ওভারভিউ' : 'Revenue Overview'}</CardTitle>
              <p className="text-xl sm:text-2xl font-bold text-success mt-1 sm:mt-2">৳{totalRevenue.toLocaleString()}</p>
            </div>
            <Select value={revenueFilter} onValueChange={setRevenueFilter}>
              <SelectTrigger className="w-full sm:w-40">
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
          <CardContent className="px-2 sm:px-6">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="period" className="text-muted-foreground" tick={{ fontSize: 10 }} />
                  <YAxis className="text-muted-foreground" tick={{ fontSize: 10 }} width={50} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`৳${value.toLocaleString()}`, language === 'bn' ? 'রেভিনিউ' : 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                {isLoading 
                  ? (language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...') 
                  : (language === 'bn' ? 'কোনো ডেটা নেই' : 'No data available')
                }
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
}
