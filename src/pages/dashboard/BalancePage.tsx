import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDateValidation } from '@/hooks/useDateValidation';
import { Eye, Loader2, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO, endOfMonth } from 'date-fns';

interface Member {
  id: string;
  name: string;
}

interface MemberBalance {
  id: string;
  name: string;
  totalMeals: number;
  totalDeposit: number;
  totalCost: number;
  balance: number;
}

interface MemberDetails {
  email: string;
  phone: string;
  roomNumber: string;
}

interface AvailableMonth {
  value: string;
  label: string;
}

export default function BalancePage() {
  const { mess } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const { filterValidMonths } = useDateValidation();
  
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [mealRate, setMealRate] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Monthly selection
  const [availableMonths, setAvailableMonths] = useState<AvailableMonth[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  // Month totals
  const [monthlyTotalBazar, setMonthlyTotalBazar] = useState(0);
  const [monthlyTotalMeals, setMonthlyTotalMeals] = useState(0);
  const [monthlyTotalDeposits, setMonthlyTotalDeposits] = useState(0);
  
  // PIN verification state
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberBalance | null>(null);
  const [memberDetails, setMemberDetails] = useState<MemberDetails | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [isPinVerifying, setIsPinVerifying] = useState(false);

  useEffect(() => {
    if (mess) {
      fetchAvailableMonths();
    }
  }, [mess]);

  useEffect(() => {
    if (mess && selectedMonth) {
      fetchBalances();
    }
  }, [mess, selectedMonth]);

  const fetchAvailableMonths = async () => {
    if (!mess) return;

    try {
      // Get months from meals, bazars, and deposits
      const [mealsRes, bazarsRes, depositsRes] = await Promise.all([
        supabase.from('meals').select('date').eq('mess_id', mess.id),
        supabase.from('bazars').select('date').eq('mess_id', mess.id),
        supabase.from('deposits').select('date').eq('mess_id', mess.id),
      ]);

      const monthsSet = new Set<string>();
      
      // Add current month
      monthsSet.add(format(new Date(), 'yyyy-MM'));
      
      // Add months from data
      [...(mealsRes.data || []), ...(bazarsRes.data || []), ...(depositsRes.data || [])].forEach(item => {
        const month = item.date.substring(0, 7);
        monthsSet.add(month);
      });

      const months = Array.from(monthsSet).sort((a, b) => b.localeCompare(a)).map(month => {
        const date = parseISO(`${month}-01`);
        return {
          value: month,
          label: format(date, language === 'bn' ? 'MMMM yyyy' : 'MMMM yyyy'),
        };
      });

      const validMonths = filterValidMonths(months);
      setAvailableMonths(validMonths);
      
      if (validMonths.length > 0 && !validMonths.find(m => m.value === selectedMonth)) {
        setSelectedMonth(validMonths[0].value);
      }
    } catch (error: any) {
      console.error('Error fetching months:', error);
    }
  };

  const fetchBalances = async () => {
    if (!mess || !selectedMonth) return;
    setIsLoading(true);

    try {
      const startDate = `${selectedMonth}-01`;
      const endDate = format(endOfMonth(parseISO(startDate)), 'yyyy-MM-dd');

      // Fetch members
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('id, name')
        .eq('mess_id', mess.id)
        .eq('is_active', true);

      if (membersError) throw membersError;

      // Fetch meals for selected month
      const { data: meals, error: mealsError } = await supabase
        .from('meals')
        .select('member_id, breakfast, lunch, dinner')
        .eq('mess_id', mess.id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (mealsError) throw mealsError;

      // Fetch bazars for selected month
      const { data: bazars, error: bazarsError } = await supabase
        .from('bazars')
        .select('cost')
        .eq('mess_id', mess.id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (bazarsError) throw bazarsError;

      // Fetch deposits for selected month
      const { data: deposits, error: depositsError } = await supabase
        .from('deposits')
        .select('member_id, amount')
        .eq('mess_id', mess.id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (depositsError) throw depositsError;

      // Calculate monthly totals
      const totalBazar = bazars?.reduce((sum, b) => sum + Number(b.cost), 0) || 0;
      const totalMeals = meals?.reduce(
        (sum, m) => sum + m.breakfast + m.lunch + m.dinner,
        0
      ) || 0;
      const totalDepositsAmount = deposits?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

      setMonthlyTotalBazar(totalBazar);
      setMonthlyTotalMeals(totalMeals);
      setMonthlyTotalDeposits(totalDepositsAmount);

      const calculatedMealRate = totalMeals > 0 ? totalBazar / totalMeals : 0;
      setMealRate(calculatedMealRate);

      // Calculate per-member balances for the month
      const memberBalances: MemberBalance[] = (members || []).map((member) => {
        const memberMeals = meals?.filter((m) => m.member_id === member.id) || [];
        const memberTotalMeals = memberMeals.reduce(
          (sum, m) => sum + m.breakfast + m.lunch + m.dinner,
          0
        );

        const memberDeposits = deposits?.filter((d) => d.member_id === member.id) || [];
        const memberTotalDeposit = memberDeposits.reduce(
          (sum, d) => sum + Number(d.amount),
          0
        );

        const memberTotalCost = memberTotalMeals * calculatedMealRate;
        const balance = memberTotalDeposit - memberTotalCost;

        return {
          id: member.id,
          name: member.name,
          totalMeals: memberTotalMeals,
          totalDeposit: memberTotalDeposit,
          totalCost: memberTotalCost,
          balance,
        };
      });

      setBalances(memberBalances);
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

  const handleVerifyPin = async () => {
    if (!selectedMember) return;
    setIsPinVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-pin', {
        body: {
          memberId: selectedMember.id,
          pin: pinInput,
        },
      });

      if (error) throw error;

      if (data.success) {
        setMemberDetails({
          email: data.email || '',
          phone: data.phone || '',
          roomNumber: data.roomNumber || '',
        });
        setIsPinOpen(false);
        setIsDetailsOpen(true);
        setPinInput('');
      } else {
        toast({
          title: language === 'bn' ? 'ভুল পিন' : 'Wrong PIN',
          description: language === 'bn' ? 'সঠিক পিন দিন' : 'Please enter correct PIN',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsPinVerifying(false);
    }
  };

  const openPinDialog = (member: MemberBalance) => {
    setSelectedMember(member);
    setPinInput('');
    setIsPinOpen(true);
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-success';
    if (balance < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getBalanceIcon = (balance: number) => {
    if (balance > 0) return <TrendingUp className="w-4 h-4 text-success" />;
    if (balance < 0) return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const totalBalance = balances.reduce((sum, m) => sum + m.balance, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {language === 'bn' ? 'ব্যালেন্স ওভারভিউ' : 'Balance Overview'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'bn' ? 'মিল রেট: ' : 'Meal Rate: '}
              <span className="font-bold text-primary">৳{mealRate.toFixed(2)}</span>
              <span className="text-sm ml-1">
                {language === 'bn' ? '/ মিল' : '/ meal'}
              </span>
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

        {/* Monthly Summary Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">{language === 'bn' ? 'মোট মিল' : 'Total Meals'}</p>
              <p className="text-2xl font-bold text-secondary">{monthlyTotalMeals}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">{language === 'bn' ? 'মোট বাজার' : 'Total Bazar'}</p>
              <p className="text-2xl font-bold text-warning">৳{monthlyTotalBazar.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">{language === 'bn' ? 'মোট জমা' : 'Total Deposits'}</p>
              <p className="text-2xl font-bold text-success">৳{monthlyTotalDeposits.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className={`glass-card ${totalBalance >= 0 ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}`}>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">{language === 'bn' ? 'মোট ব্যালেন্স' : 'Total Balance'}</p>
              <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
                ৳{Math.abs(totalBalance).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Balance Table */}
        <Card className="glass-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : balances.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {language === 'bn' ? 'কোনো মেম্বার নেই' : 'No members yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'bn' ? 'মেম্বার' : 'Member'}</TableHead>
                      <TableHead className="text-center">{language === 'bn' ? 'মোট মিল' : 'Total Meals'}</TableHead>
                      <TableHead className="text-right">{language === 'bn' ? 'মোট জমা' : 'Total Deposit'}</TableHead>
                      <TableHead className="text-right">{language === 'bn' ? 'মোট খরচ' : 'Total Cost'}</TableHead>
                      <TableHead className="text-right">{language === 'bn' ? 'ব্যালেন্স' : 'Balance'}</TableHead>
                      <TableHead className="text-right">{language === 'bn' ? 'বিস্তারিত' : 'Details'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balances.map((member, index) => (
                      <motion.tr
                        key={member.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-border"
                      >
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell className="text-center">{member.totalMeals}</TableCell>
                        <TableCell className="text-right">৳{member.totalDeposit.toFixed(2)}</TableCell>
                        <TableCell className="text-right">৳{member.totalCost.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {getBalanceIcon(member.balance)}
                            <span className={`font-bold ${getBalanceColor(member.balance)}`}>
                              ৳{Math.abs(member.balance).toFixed(2)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openPinDialog(member)}
                            className="rounded-xl"
                            title={language === 'bn' ? 'বিস্তারিত দেখুন' : 'View details'}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PIN Verification Dialog */}
        <Dialog open={isPinOpen} onOpenChange={setIsPinOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>
                {language === 'bn' ? 'পিন যাচাই করুন' : 'Verify PIN'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                {language === 'bn'
                  ? `${selectedMember?.name} এর তথ্য দেখতে পিন দিন`
                  : `Enter PIN to view ${selectedMember?.name}'s details`}
              </p>
              <Input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••"
                maxLength={6}
                className="rounded-xl text-center text-2xl tracking-widest"
                autoFocus
              />
              <Button
                onClick={handleVerifyPin}
                disabled={isPinVerifying || pinInput.length < 4}
                className="w-full"
              >
                {isPinVerifying ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {language === 'bn' ? 'যাচাই করুন' : 'Verify'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Member Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedMember?.name} - {language === 'bn' ? 'বিস্তারিত' : 'Details'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'bn' ? 'ইমেইল' : 'Email'}</p>
                  <p className="font-medium">{memberDetails?.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'bn' ? 'ফোন' : 'Phone'}</p>
                  <p className="font-medium">{memberDetails?.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'bn' ? 'রুম নম্বর' : 'Room Number'}</p>
                  <p className="font-medium">{memberDetails?.roomNumber || '-'}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
