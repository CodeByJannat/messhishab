import { useEffect, useState } from 'react';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Save, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface Payment {
  id: string;
  mess_id: string;
  amount: number;
  plan_type: 'monthly' | 'yearly';
  payment_method: string;
  transaction_id: string | null;
  bkash_number: string | null;
  coupon_code: string | null;
  discount_amount: number | null;
  status: 'pending' | 'approved' | 'rejected';
  reject_reason: string | null;
  created_at: string;
  mess?: {
    mess_id: string;
    name: string | null;
  };
}

interface Pricing {
  id: string;
  monthly_price: number;
  yearly_price: number;
}

export default function AdminSubscriptionPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [yearlyPrice, setYearlyPrice] = useState('');
  
  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch pricing
      const { data: pricingData } = await supabase
        .from('pricing_settings')
        .select('*')
        .single();
      
      if (pricingData) {
        setPricing(pricingData);
        setMonthlyPrice(String(pricingData.monthly_price));
        setYearlyPrice(String(pricingData.yearly_price));
      }

      // Fetch payments with mess info
      const { data: paymentsData } = await supabase
        .from('payments')
        .select(`
          *,
          mess:messes(mess_id, name)
        `)
        .order('created_at', { ascending: false });
      
      if (paymentsData) {
        setPayments(paymentsData as Payment[]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePricing = async () => {
    if (!pricing) return;
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('pricing_settings')
        .update({
          monthly_price: Number(monthlyPrice),
          yearly_price: Number(yearlyPrice),
          updated_at: new Date().toISOString(),
        })
        .eq('id', pricing.id);

      if (error) throw error;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'মূল্য আপডেট হয়েছে' : 'Pricing updated successfully',
      });
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprovePayment = async (payment: Payment) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-review-payment', {
        body: {
          payment_id: payment.id,
          action: 'approve',
        },
      });

      if (error) throw error;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'পেমেন্ট অনুমোদিত হয়েছে' : 'Payment approved successfully',
      });
      
      fetchData();
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedPayment || !rejectReason.trim()) return;
    
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-review-payment', {
        body: {
          payment_id: selectedPayment.id,
          action: 'reject',
          reject_reason: rejectReason,
        },
      });

      if (error) throw error;

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: language === 'bn' ? 'পেমেন্ট প্রত্যাখ্যাত হয়েছে' : 'Payment rejected',
      });
      
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedPayment(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openRejectModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const approvedPayments = payments.filter(p => p.status === 'approved');
  const rejectedPayments = payments.filter(p => p.status === 'rejected');

  const PaymentTable = ({ items, showActions = false }: { items: Payment[]; showActions?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{language === 'bn' ? 'মেস আইডি' : 'Mess ID'}</TableHead>
          <TableHead>{language === 'bn' ? 'পরিমাণ' : 'Amount'}</TableHead>
          <TableHead>{language === 'bn' ? 'প্ল্যান' : 'Plan'}</TableHead>
          <TableHead>{language === 'bn' ? 'পেমেন্ট মেথড' : 'Method'}</TableHead>
          <TableHead>{language === 'bn' ? 'বিকাশ নাম্বার' : 'bKash No.'}</TableHead>
          <TableHead>{language === 'bn' ? 'TrxID' : 'TrxID'}</TableHead>
          <TableHead>{language === 'bn' ? 'কুপন' : 'Coupon'}</TableHead>
          <TableHead>{language === 'bn' ? 'তারিখ' : 'Date'}</TableHead>
          {showActions && <TableHead>{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</TableHead>}
          {!showActions && items[0]?.status === 'rejected' && (
            <TableHead>{language === 'bn' ? 'কারণ' : 'Reason'}</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showActions ? 9 : 9} className="text-center text-muted-foreground py-8">
              {language === 'bn' ? 'কোনো পেমেন্ট নেই' : 'No payments found'}
            </TableCell>
          </TableRow>
        ) : (
          items.map(payment => (
            <TableRow key={payment.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{payment.mess?.mess_id || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">{payment.mess?.name || ''}</p>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                <div>
                  <p>৳{payment.amount}</p>
                  {payment.discount_amount && payment.discount_amount > 0 && (
                    <p className="text-xs text-success">-৳{payment.discount_amount} discount</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={payment.plan_type === 'yearly' ? 'default' : 'secondary'}>
                  {payment.plan_type === 'yearly' 
                    ? (language === 'bn' ? 'বাৎসরিক' : 'Yearly')
                    : (language === 'bn' ? 'মাসিক' : 'Monthly')
                  }
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {payment.payment_method === 'manual-bkash' 
                    ? (language === 'bn' ? 'ম্যানুয়াল বিকাশ' : 'Manual bKash')
                    : payment.payment_method
                  }
                </span>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {payment.bkash_number || '-'}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {payment.transaction_id || '-'}
              </TableCell>
              <TableCell>
                {payment.coupon_code ? (
                  <Badge variant="outline" className="font-mono text-xs">
                    {payment.coupon_code}
                  </Badge>
                ) : '-'}
              </TableCell>
              <TableCell>{format(new Date(payment.created_at), 'dd/MM/yyyy')}</TableCell>
              {showActions && (
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-success hover:bg-success/90"
                      onClick={() => handleApprovePayment(payment)}
                      disabled={isProcessing}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {language === 'bn' ? 'অনুমোদন' : 'Approve'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openRejectModal(payment)}
                      disabled={isProcessing}
                    >
                      <X className="w-4 h-4 mr-1" />
                      {language === 'bn' ? 'প্রত্যাখ্যান' : 'Reject'}
                    </Button>
                  </div>
                </TableCell>
              )}
              {!showActions && payment.status === 'rejected' && (
                <TableCell className="text-muted-foreground text-sm max-w-[150px] truncate" title={payment.reject_reason || ''}>
                  {payment.reject_reason || '-'}
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <AdminDashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {language === 'bn' ? 'সাবস্ক্রিপশন ম্যানেজমেন্ট' : 'Subscription Management'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'bn' ? 'মূল্য এবং পেমেন্ট পরিচালনা করুন' : 'Manage pricing and payments'}
          </p>
        </div>

        {/* Pricing Editor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>{language === 'bn' ? 'মূল্য সেটিংস' : 'Pricing Settings'}</CardTitle>
              <CardDescription>
                {language === 'bn' ? 'মাসিক এবং বাৎসরিক প্ল্যানের মূল্য পরিবর্তন করুন' : 'Change monthly and yearly plan prices'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'মাসিক মূল্য (৳)' : 'Monthly Price (৳)'}</Label>
                  <Input
                    type="number"
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'বাৎসরিক মূল্য (৳)' : 'Yearly Price (৳)'}</Label>
                  <Input
                    type="number"
                    value={yearlyPrice}
                    onChange={(e) => setYearlyPrice(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <Button
                onClick={handleSavePricing}
                disabled={isSaving}
                className="mt-6 btn-primary-glow"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment History Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>{language === 'bn' ? 'পেমেন্ট হিস্ট্রি' : 'Payment History'}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending">
                <TabsList className="mb-4">
                  <TabsTrigger value="pending" className="relative">
                    {language === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}
                    {pendingPayments.length > 0 && (
                      <span className="ml-2 bg-warning text-warning-foreground text-xs px-2 py-0.5 rounded-full">
                        {pendingPayments.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="approved">
                    {language === 'bn' ? 'অনুমোদিত' : 'Approved'}
                  </TabsTrigger>
                  <TabsTrigger value="rejected">
                    {language === 'bn' ? 'প্রত্যাখ্যাত' : 'Rejected'}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                  <PaymentTable items={pendingPayments} showActions />
                </TabsContent>
                <TabsContent value="approved">
                  <PaymentTable items={approvedPayments} />
                </TabsContent>
                <TabsContent value="rejected">
                  <PaymentTable items={rejectedPayments} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Reject Modal */}
        <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === 'bn' ? 'পেমেন্ট প্রত্যাখ্যান' : 'Reject Payment'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                {language === 'bn' 
                  ? 'প্রত্যাখ্যানের কারণ লিখুন (আবশ্যক)' 
                  : 'Please provide a reason for rejection (required)'
                }
              </p>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={language === 'bn' ? 'কারণ লিখুন...' : 'Enter reason...'}
                className="min-h-[100px]"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectPayment}
                disabled={!rejectReason.trim() || isProcessing}
              >
                {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {language === 'bn' ? 'প্রত্যাখ্যান করুন' : 'Reject Payment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminDashboardLayout>
  );
}
