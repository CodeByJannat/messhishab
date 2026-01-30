import { useState, useEffect } from 'react';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MemberDashboardLayout } from '@/components/dashboard/MemberDashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
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
import { Loader2, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

interface Bazar {
  id: string;
  date: string;
  person_name: string;
  items: string | null;
  cost: number;
}

export default function MemberBazarPage() {
  const { memberSession } = useMemberAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [bazars, setBazars] = useState<Bazar[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (memberSession) {
      fetchBazars();
    }
  }, [memberSession]);

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

      setBazars(data.data.allBazars || []);
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

  const totalBazar = bazars.reduce((sum, b) => sum + Number(b.cost), 0);

  return (
    <MemberDashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {language === 'bn' ? 'বাজার রেকর্ড' : 'Bazar Records'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'bn' ? 'মোট বাজার: ' : 'Total Bazar: '}
            <span className="font-bold text-foreground">৳{totalBazar.toFixed(2)}</span>
          </p>
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
                <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
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
