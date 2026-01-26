import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
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

export default function BazarPage() {
  const { mess } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [bazars, setBazars] = useState<Bazar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      fetchBazars();
    }
  }, [mess]);

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

  const fetchBazars = async () => {
    if (!mess) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('bazars')
        .select('*')
        .eq('mess_id', mess.id)
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

  const handleAddBazar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mess) return;

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
      fetchBazars();
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {language === 'bn' ? 'বাজার ম্যানেজমেন্ট' : 'Bazar Management'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'bn' ? 'মোট বাজার: ' : 'Total Bazar: '}
              <span className="font-bold text-foreground">৳{totalBazar.toFixed(2)}</span>
            </p>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary-glow">
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
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="rounded-xl"
                  />
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
                  <Button type="submit" disabled={isSubmitting || !formData.personName}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {language === 'bn' ? 'যোগ করুন' : 'Add'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
