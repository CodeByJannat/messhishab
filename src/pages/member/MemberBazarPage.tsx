import { useState, useEffect } from 'react';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MemberDashboardLayout } from '@/components/dashboard/MemberDashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
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
import { Loader2, ShoppingCart, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO, endOfMonth } from 'date-fns';

interface Bazar {
  id: string;
  date: string;
  person_name: string;
  items: string | null;
  cost: number;
}

interface AvailableMonth {
  value: string;
  label: string;
}

export default function MemberBazarPage() {
  const { memberSession } = useMemberAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [allBazars, setAllBazars] = useState<Bazar[]>([]);
  const [filteredBazars, setFilteredBazars] = useState<Bazar[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Monthly selection
  const [availableMonths, setAvailableMonths] = useState<AvailableMonth[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    if (memberSession) {
      fetchBazars();
    }
  }, [memberSession]);

  useEffect(() => {
    filterBazarsByMonth();
  }, [selectedMonth, allBazars]);

  const fetchBazars = async () => {
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

      const bazars = data.data.allBazars || [];
      setAllBazars(bazars);

      // Get available months
      const monthsSet = new Set<string>();
      monthsSet.add(format(new Date(), 'yyyy-MM'));
      
      bazars.forEach((bazar: Bazar) => {
        const month = bazar.date.substring(0, 7);
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

  const filterBazarsByMonth = () => {
    if (!selectedMonth || allBazars.length === 0) {
      setFilteredBazars([]);
      return;
    }

    const startDate = `${selectedMonth}-01`;
    const endDate = format(endOfMonth(parseISO(startDate)), 'yyyy-MM-dd');

    const filtered = allBazars.filter(bazar => 
      bazar.date >= startDate && bazar.date <= endDate
    );

    setFilteredBazars(filtered);
  };

  const totalBazar = filteredBazars.reduce((sum, b) => sum + Number(b.cost), 0);

  return (
    <MemberDashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {language === 'bn' ? 'বাজার রেকর্ড' : 'Bazar Records'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'bn' ? 'মোট বাজার: ' : 'Total Bazar: '}
              <span className="font-bold text-foreground">৳{totalBazar.toFixed(2)}</span>
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

        {/* Bazar Table */}
        <Card className="glass-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredBazars.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {language === 'bn' ? 'এই মাসে কোনো বাজার নেই' : 'No bazar records for this month'}
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBazars.map((bazar, index) => (
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
