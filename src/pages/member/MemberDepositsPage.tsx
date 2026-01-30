import { useState, useEffect } from 'react';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MemberDashboardLayout } from '@/components/dashboard/MemberDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Loader2, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface Deposit {
  id: string;
  date: string;
  amount: number;
  note: string | null;
}

export default function MemberDepositsPage() {
  const { memberSession } = useMemberAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [totalDeposit, setTotalDeposit] = useState(0);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (memberSession) {
      fetchDeposits();
    }
  }, [memberSession]);

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

      setDeposits(data.data.deposits || []);
      setTotalDeposit(data.data.totalDeposit);
      setBalance(data.data.balance);
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

  return (
    <MemberDashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {language === 'bn' ? 'জমার রেকর্ড' : 'Deposit Records'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'bn' ? 'আপনার জমার বিস্তারিত' : 'Your deposit details'}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'bn' ? 'মোট জমা' : 'Total Deposit'}
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
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : deposits.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {language === 'bn' ? 'কোনো জমা নেই' : 'No deposits yet'}
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
                    {deposits.map((deposit, index) => (
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
