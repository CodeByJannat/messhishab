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
import { Textarea } from '@/components/ui/textarea';
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

interface Bazar {
  id: string;
  date: string;
  person_name: string;
  items: string | null;
  note: string | null;
  cost: number;
  created_at: string;
}

interface AvailableMonth {
  value: string;
  label: string;
}

export default function BazarPage() {
  const { mess } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const { validateDate, getMaxDate, getMinDate, filterValidMonths } = useDateValidation();
  const { isReadOnly, expiredDaysAgo, readOnlyMonths } = useReadOnly();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [bazars, setBazars] = useState<Bazar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  // Monthly selection
  const [availableMonths, setAvailableMonths] = useState<AvailableMonth[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const [formData, setFormData] = useState({
    personName: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    items: '',
    note: '',
    cost: '',
  });

  useEffect(() => {
    if (mess) {
      fetchMembers();
      fetchAvailableMonths();
    }
  }, [mess]);

  useEffect(() => {
    if (mess && selectedMonth) {
      fetchBazars();
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
        .from('bazars')
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

  const fetchBazars = async () => {
    if (!mess || !selectedMonth) return;
    setIsLoading(true);

    try {
      const startDate = `${selectedMonth}-01`;
      const endDate = format(endOfMonth(parseISO(startDate)), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('bazars')
        .select('*')
        .eq('mess_id', mess.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      setBazars(data || []);
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

  const handleAddBazar = async (e: React.FormEvent) => {
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

    const cost = parseFloat(formData.cost);
    if (isNaN(cost) || cost <= 0) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'সঠিক খরচ দিন' : 'Enter valid cost',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('bazars').insert({
        mess_id: mess.id,
        person_name: formData.personName,
        date: formData.date,
        items: formData.items || null,
        note: formData.note || null,
        cost,
      });

      if (error) throw error;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'বাজার যোগ হয়েছে' : 'Bazar added',
      });

      setIsAddOpen(false);
      setFormData({
        personName: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        items: '',
        note: '',
        cost: '',
      });
      setDateError(null);
      fetchBazars();
      fetchAvailableMonths();
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রुटि' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBazar = async (bazarId: string) => {
    if (!confirm(language === 'bn' ? 'আপনি কি নিশ্চিত?' : 'Are you sure?')) return;

    try {
      const { error } = await supabase.from('bazars').delete().eq('id', bazarId);

      if (error) throw error;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'বাজার মুছে ফেলা হয়েছে' : 'Bazar deleted',
      });

      fetchBazars();
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const totalBazar = bazars.reduce((sum, b) => sum + Number(b.cost), 0);

  // Export handlers
  const handleExportPDF = () => {
    const monthLabel = availableMonths.find(m => m.value === selectedMonth)?.label || selectedMonth;
    exportToPDF({
      title: language === 'bn' ? 'বাজার রিপোর্ট' : 'Bazar Report',
      subtitle: monthLabel,
      fileName: `bazar-${selectedMonth}`,
      language: language as 'en' | 'bn',
      columns: [
        { header: language === 'bn' ? 'তারিখ' : 'Date', key: 'date', width: 15 },
        { header: language === 'bn' ? 'কে করেছে' : 'Person', key: 'person_name', width: 20 },
        { header: language === 'bn' ? 'আইটেম' : 'Items', key: 'items', width: 30 },
        { header: language === 'bn' ? 'খরচ' : 'Cost', key: 'cost', width: 15 },
      ],
      data: [...bazars.map(b => ({ ...b, cost: `৳${Number(b.cost).toFixed(2)}` })), 
        { date: '', person_name: language === 'bn' ? 'মোট' : 'Total', items: '', cost: `৳${totalBazar.toFixed(2)}` }],
    });
  };

  const handleExportExcel = () => {
    const monthLabel = availableMonths.find(m => m.value === selectedMonth)?.label || selectedMonth;
    exportToExcel({
      title: language === 'bn' ? 'বাজার রিপোর্ট' : 'Bazar Report',
      subtitle: monthLabel,
      fileName: `bazar-${selectedMonth}`,
      columns: [
        { header: language === 'bn' ? 'তারিখ' : 'Date', key: 'date', width: 15 },
        { header: language === 'bn' ? 'কে করেছে' : 'Person', key: 'person_name', width: 20 },
        { header: language === 'bn' ? 'আইটেম' : 'Items', key: 'items', width: 30 },
        { header: language === 'bn' ? 'খরচ' : 'Cost', key: 'cost', width: 15 },
      ],
      data: [...bazars, { date: '', person_name: language === 'bn' ? 'মোট' : 'Total', items: '', cost: totalBazar }],
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
              {language === 'bn' ? 'বাজার ম্যানেজমেন্ট' : 'Bazar Management'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'bn' ? 'মোট বাজার: ' : 'Total Bazar: '}
              <span className="font-bold text-foreground">৳{totalBazar.toFixed(2)}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <ExportButton onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} disabled={bazars.length === 0} />
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
                  {language === 'bn' ? 'বাজার যোগ করুন' : 'Add Bazar'}
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {language === 'bn' ? 'নতুন বাজার যোগ করুন' : 'Add New Bazar'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddBazar} className="space-y-4">
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'কে করেছে *' : 'Who did it *'}</Label>
                  <Select
                    value={formData.personName}
                    onValueChange={(value) => setFormData({ ...formData, personName: value })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder={language === 'bn' ? 'সিলেক্ট করুন' : 'Select'} />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.name}>
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
                  <Label>{language === 'bn' ? 'জিনিসপত্র' : 'Items'}</Label>
                  <Textarea
                    value={formData.items}
                    onChange={(e) => setFormData({ ...formData, items: e.target.value })}
                    placeholder={language === 'bn' ? 'চাল, ডাল, তেল...' : 'Rice, lentils, oil...'}
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
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'খরচ (৳) *' : 'Cost (৳) *'}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="0.00"
                    required
                    className="rounded-xl"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting || !formData.personName || !!dateError}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {language === 'bn' ? 'যোগ করুন' : 'Add'}
                  </Button>
                </DialogFooter>
              </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Bazar Table */}
        <Card className="glass-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : bazars.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {language === 'bn' ? 'কোনো বাজার নেই' : 'No bazar records yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'bn' ? 'তারিখ' : 'Date'}</TableHead>
                      <TableHead>{language === 'bn' ? 'কে করেছে' : 'Person'}</TableHead>
                      <TableHead>{language === 'bn' ? 'জিনিসপত্র' : 'Items'}</TableHead>
                      <TableHead className="text-right">{language === 'bn' ? 'খরচ' : 'Cost'}</TableHead>
                      <TableHead className="text-right">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bazars.map((bazar, index) => (
                      <motion.tr
                        key={bazar.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-border"
                      >
                        <TableCell>
                          {new Date(bazar.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
                        </TableCell>
                        <TableCell className="font-medium">{bazar.person_name}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {bazar.items || '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ৳{Number(bazar.cost).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteBazar(bazar.id)}
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
