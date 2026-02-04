import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useReadOnly } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ReadOnlyBanner } from '@/components/dashboard/ReadOnlyBanner';
import { ExportButton } from '@/components/dashboard/ExportButton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { useDateValidation } from '@/hooks/useDateValidation';
import { exportToPDF, exportToExcel } from '@/lib/exportUtils';
import { Plus, Trash2, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { format, parseISO, endOfMonth } from 'date-fns';
import { motion } from 'framer-motion';

interface Member {
  id: string;
  name: string;
}

interface Deposit {
  id: string;
  member_id: string;
  amount: number;
  date: string;
  note: string | null;
  created_at: string;
}

interface AvailableMonth {
  value: string;
  label: string;
}

export default function DepositsPage() {
  const { mess } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const { validateDate, getMaxDate, getMinDate, filterValidMonths } = useDateValidation();
  const { isReadOnly, expiredDaysAgo, readOnlyMonths } = useReadOnly();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  // Monthly selection
  const [availableMonths, setAvailableMonths] = useState<AvailableMonth[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const [formData, setFormData] = useState({
    memberId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    note: '',
  });

  useEffect(() => {
    if (mess) {
      fetchMembers();
      fetchAvailableMonths();
    }
  }, [mess]);

  useEffect(() => {
    if (mess && selectedMonth) {
      fetchDeposits();
    }
  }, [mess, selectedMonth]);

  const fetchMembers = async () => {
    if (!mess) return;

    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, name')
        .eq('mess_id', mess.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchAvailableMonths = async () => {
    if (!mess) return;

    try {
      const { data } = await supabase
        .from('deposits')
        .select('date')
        .eq('mess_id', mess.id);

      const monthsSet = new Set<string>();
      monthsSet.add(format(new Date(), 'yyyy-MM'));
      
      (data || []).forEach(item => {
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
    } catch (error) {
      console.error('Error fetching months:', error);
    }
  };

  const fetchDeposits = async () => {
    if (!mess || !selectedMonth) return;
    setIsLoading(true);

    try {
      const startDate = `${selectedMonth}-01`;
      const endDate = format(endOfMonth(parseISO(startDate)), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('deposits')
        .select('*')
        .eq('mess_id', mess.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      setDeposits(data || []);
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

  const getMemberName = (memberId: string) => {
    return members.find((m) => m.id === memberId)?.name || '-';
  };

  const handleDateChange = (newDate: string) => {
    setFormData({ ...formData, date: newDate });
    const validation = validateDate(newDate);
    setDateError(validation.error);
  };

  const handleAddDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mess) return;

    // Validate date
    const validation = validateDate(formData.date);
    if (!validation.isValid) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'সঠিক পরিমাণ দিন' : 'Enter valid amount',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('deposits').insert({
        mess_id: mess.id,
        member_id: formData.memberId,
        date: formData.date,
        amount,
        note: formData.note || null,
      });

      if (error) throw error;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'জমা যোগ হয়েছে' : 'Deposit added',
      });

      setIsAddOpen(false);
      setFormData({
        memberId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: '',
        note: '',
      });
      setDateError(null);
      fetchDeposits();
      fetchAvailableMonths();
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDeposit = async (depositId: string) => {
    if (!confirm(language === 'bn' ? 'আপনি কি নিশ্চিত?' : 'Are you sure?')) return;

    try {
      const { error } = await supabase.from('deposits').delete().eq('id', depositId);

      if (error) throw error;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'জমা মুছে ফেলা হয়েছে' : 'Deposit deleted',
      });

      fetchDeposits();
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const totalDeposits = deposits.reduce((sum, d) => sum + Number(d.amount), 0);

  // Export handlers
  const handleExportPDF = () => {
    const monthLabel = availableMonths.find(m => m.value === selectedMonth)?.label || selectedMonth;
    const depositData = deposits.map(d => ({
      date: d.date,
      member: getMemberName(d.member_id),
      amount: `৳${Number(d.amount).toFixed(2)}`,
      note: d.note || '-',
    }));
    exportToPDF({
      title: language === 'bn' ? 'জমা রিপোর্ট' : 'Deposit Report',
      subtitle: monthLabel,
      fileName: `deposits-${selectedMonth}`,
      language: language as 'en' | 'bn',
      columns: [
        { header: language === 'bn' ? 'তারিখ' : 'Date', key: 'date', width: 15 },
        { header: language === 'bn' ? 'মেম্বার' : 'Member', key: 'member', width: 25 },
        { header: language === 'bn' ? 'পরিমাণ' : 'Amount', key: 'amount', width: 15 },
        { header: language === 'bn' ? 'নোট' : 'Note', key: 'note', width: 25 },
      ],
      data: [...depositData, { date: '', member: language === 'bn' ? 'মোট' : 'Total', amount: `৳${totalDeposits.toFixed(2)}`, note: '' }],
    });
  };

  const handleExportExcel = () => {
    const monthLabel = availableMonths.find(m => m.value === selectedMonth)?.label || selectedMonth;
    const depositData = deposits.map(d => ({
      date: d.date,
      member: getMemberName(d.member_id),
      amount: Number(d.amount),
      note: d.note || '',
    }));
    exportToExcel({
      title: language === 'bn' ? 'জমা রিপোর্ট' : 'Deposit Report',
      subtitle: monthLabel,
      fileName: `deposits-${selectedMonth}`,
      columns: [
        { header: language === 'bn' ? 'তারিখ' : 'Date', key: 'date', width: 15 },
        { header: language === 'bn' ? 'মেম্বার' : 'Member', key: 'member', width: 25 },
        { header: language === 'bn' ? 'পরিমাণ' : 'Amount', key: 'amount', width: 15 },
        { header: language === 'bn' ? 'নোট' : 'Note', key: 'note', width: 25 },
      ],
      data: [...depositData, { date: '', member: language === 'bn' ? 'মোট' : 'Total', amount: totalDeposits, note: '' }],
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Read-Only Banner */}
        {isReadOnly && <ReadOnlyBanner expiredDaysAgo={expiredDaysAgo} readOnlyMonths={readOnlyMonths} />}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {language === 'bn' ? 'জমা ম্যানেজমেন্ট' : 'Deposit Management'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'bn' ? 'মোট জমা: ' : 'Total Deposits: '}
              <span className="font-bold text-success">৳{totalDeposits.toFixed(2)}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <ExportButton onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} disabled={deposits.length === 0} />
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

            <Dialog open={isAddOpen} onOpenChange={(open) => {
              setIsAddOpen(open);
              if (!open) {
                setDateError(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button className="btn-primary-glow" disabled={isReadOnly}>
                  <Plus className="w-4 h-4 mr-2" />
                  {language === 'bn' ? 'জমা যোগ করুন' : 'Add Deposit'}
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {language === 'bn' ? 'নতুন জমা যোগ করুন' : 'Add New Deposit'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddDeposit} className="space-y-4">
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'মেম্বার *' : 'Member *'}</Label>
                  <Select
                    value={formData.memberId}
                    onValueChange={(value) => setFormData({ ...formData, memberId: value })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder={language === 'bn' ? 'সিলেক্ট করুন' : 'Select'} />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'তারিখ *' : 'Date *'}</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    max={getMaxDate()}
                    min={getMinDate() || undefined}
                    required
                    className="rounded-xl"
                  />
                  {dateError && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{dateError}</AlertDescription>
                    </Alert>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'পরিমাণ (৳) *' : 'Amount (৳) *'}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'নোট' : 'Note'}</Label>
                  <Input
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder={language === 'bn' ? 'অতিরিক্ত নোট' : 'Additional note'}
                    className="rounded-xl"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting || !formData.memberId || !!dateError}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {language === 'bn' ? 'যোগ করুন' : 'Add'}
                  </Button>
                </DialogFooter>
              </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Deposits Table */}
        <Card className="glass-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : deposits.length === 0 ? (
              <div className="text-center py-12">
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
                      <TableHead>{language === 'bn' ? 'মেম্বার' : 'Member'}</TableHead>
                      <TableHead>{language === 'bn' ? 'নোট' : 'Note'}</TableHead>
                      <TableHead className="text-right">{language === 'bn' ? 'পরিমাণ' : 'Amount'}</TableHead>
                      <TableHead className="text-right">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</TableHead>
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
                        <TableCell className="font-medium">{getMemberName(deposit.member_id)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {deposit.note || '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium text-success">
                          ৳{Number(deposit.amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDeposit(deposit.id)}
                            className="rounded-xl text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>
    </DashboardLayout>
  );
}
