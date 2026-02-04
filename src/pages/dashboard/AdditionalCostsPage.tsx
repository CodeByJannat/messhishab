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
import { Plus, Trash2, Loader2, AlertCircle, Receipt, Calendar, Users } from 'lucide-react';
import { format, parseISO, endOfMonth } from 'date-fns';
import { motion } from 'framer-motion';

interface AdditionalCost {
  id: string;
  date: string;
  description: string;
  amount: number;
  note: string | null;
  created_at: string;
}

interface AvailableMonth {
  value: string;
  label: string;
}

export default function AdditionalCostsPage() {
  const { mess } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const { validateDate, getMaxDate, getMinDate, filterValidMonths } = useDateValidation();
  const { isReadOnly, expiredDaysAgo, readOnlyMonths } = useReadOnly();
  
  const [costs, setCosts] = useState<AdditionalCost[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  // Monthly selection
  const [availableMonths, setAvailableMonths] = useState<AvailableMonth[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const [formData, setFormData] = useState({
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    note: '',
  });

  useEffect(() => {
    if (mess) {
      fetchAvailableMonths();
      fetchMemberCount();
    }
  }, [mess]);

  useEffect(() => {
    if (mess && selectedMonth) {
      fetchCosts();
    }
  }, [mess, selectedMonth]);

  const fetchMemberCount = async () => {
    if (!mess) return;

    try {
      const { count, error } = await supabase
        .from('members')
        .select('id', { count: 'exact', head: true })
        .eq('mess_id', mess.id)
        .eq('is_active', true);

      if (!error) {
        setMemberCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching member count:', error);
    }
  };

  const fetchAvailableMonths = async () => {
    if (!mess) return;

    try {
      const { data: costsData } = await supabase
        .from('additional_costs')
        .select('date')
        .eq('mess_id', mess.id);

      const monthsSet = new Set<string>();
      monthsSet.add(format(new Date(), 'yyyy-MM'));
      
      (costsData || []).forEach(item => {
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

  const fetchCosts = async () => {
    if (!mess || !selectedMonth) return;
    setIsLoading(true);

    try {
      const startDate = `${selectedMonth}-01`;
      const endDate = format(endOfMonth(parseISO(startDate)), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('additional_costs')
        .select('*')
        .eq('mess_id', mess.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      setCosts(data || []);
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

  const handleDateChange = (newDate: string) => {
    setFormData({ ...formData, date: newDate });
    const validation = validateDate(newDate);
    setDateError(validation.error);
  };

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mess) return;

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
      const { error } = await supabase.from('additional_costs').insert({
        mess_id: mess.id,
        description: formData.description.trim(),
        date: formData.date,
        amount,
        note: formData.note || null,
      });

      if (error) throw error;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'খরচ যোগ হয়েছে' : 'Cost added',
      });

      setIsAddOpen(false);
      setFormData({
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: '',
        note: '',
      });
      setDateError(null);
      fetchCosts();
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

  const handleDeleteCost = async (costId: string) => {
    if (!confirm(language === 'bn' ? 'আপনি কি নিশ্চিত?' : 'Are you sure?')) return;

    try {
      const { error } = await supabase.from('additional_costs').delete().eq('id', costId);

      if (error) throw error;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'খরচ মুছে ফেলা হয়েছে' : 'Cost deleted',
      });

      fetchCosts();
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const totalCost = costs.reduce((sum, c) => sum + Number(c.amount), 0);
  const avgCostPerMember = memberCount > 0 ? totalCost / memberCount : 0;

  // Export handlers - PDF uses English only (jsPDF doesn't support Bengali fonts)
  const handleExportPDF = () => {
    const monthDate = parseISO(`${selectedMonth}-01`);
    const monthLabel = format(monthDate, 'MMMM yyyy');
    exportToPDF({
      title: 'Additional Costs Report',
      subtitle: monthLabel,
      messName: mess?.name || 'Mess',
      fileName: `additional-costs-${selectedMonth}`,
      columns: [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Description', key: 'description', width: 30 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Note', key: 'note', width: 25 },
      ],
      data: [
        ...costs.map(c => ({ ...c, amount: `${Number(c.amount).toFixed(2)} Tk`, note: c.note || '-' })),
        { date: '', description: 'Total', amount: `${totalCost.toFixed(2)} Tk`, note: '' },
        { date: '', description: 'Avg per member', amount: `${avgCostPerMember.toFixed(2)} Tk`, note: '' },
      ],
    });
  };

  const handleExportExcel = () => {
    const monthLabel = availableMonths.find(m => m.value === selectedMonth)?.label || selectedMonth;
    exportToExcel({
      title: language === 'bn' ? 'অতিরিক্ত খরচ রিপোর্ট' : 'Additional Costs Report',
      subtitle: monthLabel,
      messName: mess?.name || (language === 'bn' ? 'মেস' : 'Mess'),
      fileName: `additional-costs-${selectedMonth}`,
      columns: [
        { header: language === 'bn' ? 'তারিখ' : 'Date', key: 'date', width: 15 },
        { header: language === 'bn' ? 'বিবরণ' : 'Description', key: 'description', width: 30 },
        { header: language === 'bn' ? 'পরিমাণ' : 'Amount', key: 'amount', width: 15 },
        { header: language === 'bn' ? 'নোট' : 'Note', key: 'note', width: 25 },
      ],
      data: [
        ...costs.map(c => ({ ...c, note: c.note || '' })),
        { date: '', description: language === 'bn' ? 'মোট' : 'Total', amount: totalCost, note: '' },
        { date: '', description: language === 'bn' ? 'জনপ্রতি গড়' : 'Avg per member', amount: avgCostPerMember, note: '' },
      ],
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
              {language === 'bn' ? 'অতিরিক্ত খরচ' : 'Additional Costs'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'bn' ? 'ইউটিলিটি বিল ও অন্যান্য খরচ' : 'Utility bills & other expenses'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <ExportButton onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} disabled={costs.length === 0} />
            
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
              if (!open) setDateError(null);
            }}>
              <DialogTrigger asChild>
                <Button className="btn-primary-glow" disabled={isReadOnly}>
                  <Plus className="w-4 h-4 mr-2" />
                  {language === 'bn' ? 'খরচ যোগ করুন' : 'Add Cost'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {language === 'bn' ? 'নতুন খরচ যোগ করুন' : 'Add New Cost'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddCost} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{language === 'bn' ? 'বিবরণ *' : 'Description *'}</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={language === 'bn' ? 'যেমন: বিদ্যুৎ বিল, গ্যাস বিল' : 'e.g. Electricity bill, Gas bill'}
                      required
                      className="rounded-xl"
                    />
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
                    <Button type="submit" disabled={isSubmitting || !formData.description || !!dateError}>
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {language === 'bn' ? 'যোগ করুন' : 'Add'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <Receipt className="w-6 h-6 mx-auto text-warning mb-2" />
              <p className="text-sm text-muted-foreground">{language === 'bn' ? 'মোট অতিরিক্ত খরচ' : 'Total Additional Cost'}</p>
              <p className="text-2xl font-bold text-warning">৳{totalCost.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 mx-auto text-primary mb-2" />
              <p className="text-sm text-muted-foreground">{language === 'bn' ? 'মেম্বার সংখ্যা' : 'Member Count'}</p>
              <p className="text-2xl font-bold text-primary">{memberCount}</p>
            </CardContent>
          </Card>
          <Card className="glass-card sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4 text-center">
              <Receipt className="w-6 h-6 mx-auto text-success mb-2" />
              <p className="text-sm text-muted-foreground">{language === 'bn' ? 'গড় খরচ / মেম্বার' : 'Avg Cost / Member'}</p>
              <p className="text-2xl font-bold text-success">৳{avgCostPerMember.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Costs Table */}
        <Card className="glass-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : costs.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {language === 'bn' ? 'কোনো অতিরিক্ত খরচ নেই' : 'No additional costs yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'bn' ? 'তারিখ' : 'Date'}</TableHead>
                      <TableHead>{language === 'bn' ? 'বিবরণ' : 'Description'}</TableHead>
                      <TableHead>{language === 'bn' ? 'নোট' : 'Note'}</TableHead>
                      <TableHead className="text-right">{language === 'bn' ? 'পরিমাণ' : 'Amount'}</TableHead>
                      <TableHead className="text-right">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costs.map((cost, index) => (
                      <motion.tr
                        key={cost.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-border"
                      >
                        <TableCell>
                          {new Date(cost.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
                        </TableCell>
                        <TableCell className="font-medium">{cost.description}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {cost.note || '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium text-warning">
                          ৳{Number(cost.amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCost(cost.id)}
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
