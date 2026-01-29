import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { History, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface Payment {
  id: string;
  amount: number;
  plan_type: 'monthly' | 'yearly';
  payment_method: string;
  bkash_number: string | null;
  transaction_id: string | null;
  coupon_code: string | null;
  discount_amount: number | null;
  status: 'pending' | 'approved' | 'rejected';
  reject_reason: string | null;
  created_at: string;
}

const ITEMS_PER_PAGE = 10;

export default function PaymentHistoryPage() {
  const { language } = useLanguage();
  const { mess } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (mess?.id) {
      fetchPayments();
    }
  }, [mess?.id, currentPage]);

  const fetchPayments = async () => {
    if (!mess?.id) return;
    
    setIsLoading(true);
    try {
      // Get total count
      const { count } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('mess_id', mess.id);
      
      setTotalCount(count || 0);

      // Get paginated data
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('mess_id', mess.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-success/20 text-success border-success/30">
            {language === 'bn' ? 'অনুমোদিত' : 'Approved'}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-warning/20 text-warning border-warning/30">
            {language === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-destructive/20 text-destructive border-destructive/30">
            {language === 'bn' ? 'প্রত্যাখ্যাত' : 'Rejected'}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'manual-bkash':
        return language === 'bn' ? 'ম্যানুয়াল বিকাশ' : 'Manual bKash';
      case 'bkash':
        return language === 'bn' ? 'বিকাশ' : 'bKash';
      case 'sslcommerz':
        return 'SSL Commerz';
      default:
        return method;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <History className="w-6 h-6 text-primary" />
            {language === 'bn' ? 'পেমেন্ট হিস্ট্রি' : 'Payment History'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'bn'
              ? 'আপনার সকল পেমেন্টের তালিকা দেখুন'
              : 'View all your payment records'}
          </p>
        </div>

        {/* Payment Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">
                {language === 'bn' ? 'পেমেন্ট রেকর্ড' : 'Payment Records'}
                {totalCount > 0 && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({totalCount} {language === 'bn' ? 'টি' : 'total'})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{language === 'bn' ? 'কোনো পেমেন্ট রেকর্ড নেই' : 'No payment records found'}</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{language === 'bn' ? 'তারিখ' : 'Date'}</TableHead>
                          <TableHead>{language === 'bn' ? 'পেমেন্ট মেথড' : 'Payment Method'}</TableHead>
                          <TableHead>{language === 'bn' ? 'বিকাশ নাম্বার' : 'bKash Number'}</TableHead>
                          <TableHead>{language === 'bn' ? 'TrxID' : 'TrxID'}</TableHead>
                          <TableHead>{language === 'bn' ? 'কুপন' : 'Coupon'}</TableHead>
                          <TableHead>{language === 'bn' ? 'পরিমাণ' : 'Amount'}</TableHead>
                          <TableHead>{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              {format(new Date(payment.created_at), 'dd/MM/yyyy')}
                              <br />
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(payment.created_at), 'hh:mm a')}
                              </span>
                            </TableCell>
                            <TableCell>{getPaymentMethodLabel(payment.payment_method)}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {payment.bkash_number || '-'}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {payment.transaction_id || '-'}
                            </TableCell>
                            <TableCell>
                              {payment.coupon_code ? (
                                <div>
                                  <Badge variant="outline" className="font-mono">
                                    {payment.coupon_code}
                                  </Badge>
                                  {payment.discount_amount && payment.discount_amount > 0 && (
                                    <p className="text-xs text-success mt-1">
                                      -{language === 'bn' ? '৳' : '৳'}{payment.discount_amount}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell className="font-semibold">৳{payment.amount}</TableCell>
                            <TableCell>
                              {getStatusBadge(payment.status)}
                              {payment.status === 'rejected' && payment.reject_reason && (
                                <p className="text-xs text-muted-foreground mt-1 max-w-[150px] truncate" title={payment.reject_reason}>
                                  {payment.reject_reason}
                                </p>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        {language === 'bn' 
                          ? `পৃষ্ঠা ${currentPage} / ${totalPages}`
                          : `Page ${currentPage} of ${totalPages}`
                        }
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          {language === 'bn' ? 'আগে' : 'Previous'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          {language === 'bn' ? 'পরে' : 'Next'}
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
