import { useState, useEffect } from 'react';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MemberDashboardLayout } from '@/components/dashboard/MemberDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { MemberDepositsSkeleton } from '@/components/ui/loading-skeletons';
import { Wallet, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO, endOfMonth } from 'date-fns';

interface Deposit {
  id: string;
  date: string;
  amount: number;
  note: string | null;
}

interface AvailableMonth {
  value: string;
  label: string;
}

export default function MemberDepositsPage() {
  const { memberSession } = useMemberAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [allDeposits, setAllDeposits] = useState<Deposit[]>([]);
  const [filteredDeposits, setFilteredDeposits] = useState<Deposit[]>([]);
  const [totalDeposit, setTotalDeposit] = useState(0);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Monthly selection
  const [availableMonths, setAvailableMonths] = useState<AvailableMonth[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    if (memberSession) {
      fetchDeposits();
    }
  }, [memberSession]);

  useEffect(() => {
    filterDepositsByMonth();
  }, [selectedMonth, allDeposits]);

  const fetchDeposits = async () => {
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

      const deposits = data.data.deposits || [];
      setAllDeposits(deposits);
      setBalance(data.data.balance);

      // Get available months
      const monthsSet = new Set<string>();
      monthsSet.add(format(new Date(), 'yyyy-MM'));
      
      deposits.forEach((deposit: Deposit) => {
        const month = deposit.date.substring(0, 7);
        monthsSet.add(month);
      });

      const months = Array.from(monthsSet).sort((a, b) => b.localeCompare(a)).map(month => {
        const date = parseISO(`${month}-01`);
        return {
          value: month,
          label: format(date, language === 'bn' ? 'MMMM yyyy' : 'MMMM yyyy'),
        };
      });

      setAvailableMonths(months);
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

  const filterDepositsByMonth = () => {
    if (!selectedMonth || allDeposits.length === 0) {
      setFilteredDeposits([]);
      setTotalDeposit(0);
      return;
    }

    const startDate = `${selectedMonth}-01`;
    const endDate = format(endOfMonth(parseISO(startDate)), 'yyyy-MM-dd');

    const filtered = allDeposits.filter(deposit => 
      deposit.date >= startDate && deposit.date <= endDate
    );

    setFilteredDeposits(filtered);
    setTotalDeposit(filtered.reduce((sum, d) => sum + Number(d.amount), 0));
  };

  if (isLoading) {
    return (
      <MemberDashboardLayout>
        <MemberDepositsSkeleton />
      </MemberDashboardLayout>
    );
  }

  return (
    <MemberDashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {language === 'bn' ? 'জমার রেকর্ড' : 'Deposit Records'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'bn' ? 'আপনার জমার বিস্তারিত' : 'Your deposit details'}
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

        {/* Summary Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'bn' ? 'এই মাসে জমা' : 'This Month Deposit'}
                  </p>
                  <p className="text-3xl font-bold text-success mt-1">৳{totalDeposit.toFixed(2)}</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-success/10 flex items-center justify-center">
                  <Wallet className="w-7 h-7 text-success" />
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
                  <p className={`text-3xl font-bold mt-1 ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ৳{Math.abs(balance).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {balance >= 0 
                      ? (language === 'bn' ? 'উদ্বৃত্ত' : 'Surplus')
                      : (language === 'bn' ? 'বকেয়া' : 'Due')}
                  </p>
                </div>
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${balance >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  {balance >= 0 ? (
                    <TrendingUp className="w-7 h-7 text-success" />
                  ) : (
                    <TrendingDown className="w-7 h-7 text-destructive" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deposits Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              {language === 'bn' ? 'জমার ইতিহাস' : 'Deposit History'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredDeposits.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {language === 'bn' ? 'এই মাসে কোনো জমা নেই' : 'No deposits for this month'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'bn' ? 'তারিখ' : 'Date'}</TableHead>
                      <TableHead>{language === 'bn' ? 'টাকা' : 'Amount'}</TableHead>
                      <TableHead>{language === 'bn' ? 'নোট' : 'Note'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeposits.map((deposit, index) => (
                      <motion.tr
                        key={deposit.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-border"
                      >
                        <TableCell>
                          {new Date(deposit.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
                        </TableCell>
                        <TableCell className="font-medium text-success">
                          ৳{Number(deposit.amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {deposit.note || '-'}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MemberDashboardLayout>
  );
}
