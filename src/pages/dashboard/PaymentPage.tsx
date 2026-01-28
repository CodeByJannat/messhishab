import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PaymentMethodCard } from '@/components/payment/PaymentMethodCard';
import { BkashPaymentContent } from '@/components/payment/BkashPaymentContent';
import { ManualBkashContent } from '@/components/payment/ManualBkashContent';
import { SSLCommerzContent } from '@/components/payment/SSLCommerzContent';
import { CartSection } from '@/components/payment/CartSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Wallet } from 'lucide-react';

// Import payment icons
import bkashIcon from '@/assets/bkash-icon.png';
import sslLogo from '@/assets/ssl-logo.png';

type PaymentMethod = 'bkash' | 'manual-bkash' | 'sslcommerz';

export default function PaymentPage() {
  const { language } = useLanguage();
  const { mess, subscription } = useAuth();
  const { toast } = useToast();

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('bkash');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount_percent: number;
  } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Manual bKash form state
  const [manualBkashNumber, setManualBkashNumber] = useState('');
  const [manualTrxId, setManualTrxId] = useState('');

  const basePrice = selectedPlan === 'yearly' ? 200 : 20;
  const discountAmount = appliedCoupon ? (basePrice * appliedCoupon.discount_percent) / 100 : 0;
  const finalPrice = basePrice - discountAmount;

  const paymentMethods = [
    {
      id: 'bkash' as PaymentMethod,
      name: 'bKash Payment',
      nameBn: 'বিকাশ পেমেন্ট',
      icon: bkashIcon,
    },
    {
      id: 'manual-bkash' as PaymentMethod,
      name: 'Manual bKash',
      nameBn: 'ম্যানুয়াল বিকাশ',
      icon: bkashIcon,
    },
    {
      id: 'sslcommerz' as PaymentMethod,
      name: 'SSL Commerz',
      nameBn: 'SSL Commerz',
      icon: sslLogo,
    },
  ];

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsApplyingCoupon(true);
    try {
      const { data, error } = await supabase.functions.invoke('apply-coupon', {
        body: { coupon_code: couponCode, subscription_type: selectedPlan },
      });

      if (error) throw error;

      if (data.success) {
        setAppliedCoupon({
          code: data.coupon.code,
          discount_percent: data.coupon.discount_percent,
        });
        toast({
          title: language === 'bn' ? 'সফল!' : 'Success!',
          description: data.coupon.description,
        });
      }
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message || 'Invalid coupon code',
        variant: 'destructive',
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleCompletePayment = async () => {
    setIsProcessing(true);

    try {
      if (selectedPaymentMethod === 'manual-bkash') {
        // Validate manual bKash fields
        if (!manualBkashNumber.trim() || !manualTrxId.trim()) {
          toast({
            title: language === 'bn' ? 'ত্রুটি' : 'Error',
            description: language === 'bn'
              ? 'বিকাশ নাম্বার এবং TrxID দিন'
              : 'Please provide bKash number and TrxID',
            variant: 'destructive',
          });
          setIsProcessing(false);
          return;
        }

        // TODO: Process manual bKash payment
        toast({
          title: language === 'bn' ? 'অনুরোধ পাঠানো হয়েছে' : 'Request Submitted',
          description: language === 'bn'
            ? 'আপনার পেমেন্ট ভেরিফিকেশনের জন্য পাঠানো হয়েছে। ২৪ ঘন্টার মধ্যে একটিভ হবে।'
            : 'Your payment has been submitted for verification. It will be activated within 24 hours.',
        });
      } else if (selectedPaymentMethod === 'bkash') {
        // TODO: Integrate with bKash payment gateway
        toast({
          title: language === 'bn' ? 'শীঘ্রই আসছে' : 'Coming Soon',
          description: language === 'bn'
            ? 'ডিরেক্ট বিকাশ পেমেন্ট শীঘ্রই চালু হবে। এখন ম্যানুয়াল বিকাশ ব্যবহার করুন।'
            : 'Direct bKash payment coming soon. Please use Manual bKash for now.',
        });
      } else if (selectedPaymentMethod === 'sslcommerz') {
        // TODO: Integrate with SSL Commerz
        toast({
          title: language === 'bn' ? 'শীঘ্রই আসছে' : 'Coming Soon',
          description: language === 'bn'
            ? 'SSL Commerz পেমেন্ট শীঘ্রই চালু হবে।'
            : 'SSL Commerz payment coming soon.',
        });
      }
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message || 'Payment failed',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {language === 'bn' ? 'পেমেন্ট' : 'Payment'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'bn'
              ? 'আপনার সাবস্ক্রিপশনের জন্য পেমেন্ট করুন'
              : 'Complete payment for your subscription'}
          </p>
        </div>

        {/* Plan Selection Tabs */}
        <Tabs
          value={selectedPlan}
          onValueChange={(value) => setSelectedPlan(value as 'monthly' | 'yearly')}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2 h-12 p-1 bg-muted/50 rounded-xl">
            <TabsTrigger
              value="monthly"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Wallet className="w-4 h-4 mr-2" />
              {language === 'bn' ? 'মাসিক (৳২০)' : 'Monthly (৳20)'}
            </TabsTrigger>
            <TabsTrigger
              value="yearly"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm relative"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {language === 'bn' ? 'বার্ষিক (৳২০০)' : 'Yearly (৳200)'}
              <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-full">
                {language === 'bn' ? 'সেভ ১৭%' : 'Save 17%'}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Payment Method Section - Left */}
          <div className="lg:col-span-3 space-y-6">
            {/* Payment Method Selection */}
            <div className="glass-card p-6 rounded-2xl">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                {language === 'bn' ? 'পেমেন্ট মেথড নির্বাচন করুন' : 'Select Payment Method'}
              </h2>

              <div className="grid gap-3">
                {paymentMethods.map((method) => (
                  <PaymentMethodCard
                    key={method.id}
                    id={method.id}
                    name={method.name}
                    nameBn={method.nameBn}
                    icon={method.icon}
                    isSelected={selectedPaymentMethod === method.id}
                    onSelect={() => setSelectedPaymentMethod(method.id)}
                    language={language}
                  />
                ))}
              </div>
            </div>

            {/* Conditional Content Based on Selected Payment Method */}
            <div className="glass-card p-6 rounded-2xl">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                {selectedPaymentMethod === 'bkash' && (language === 'bn' ? 'বিকাশ পেমেন্ট নির্দেশনা' : 'bKash Payment Instructions')}
                {selectedPaymentMethod === 'manual-bkash' && (language === 'bn' ? 'ম্যানুয়াল বিকাশ পেমেন্ট' : 'Manual bKash Payment')}
                {selectedPaymentMethod === 'sslcommerz' && (language === 'bn' ? 'SSL Commerz পেমেন্ট' : 'SSL Commerz Payment')}
              </h2>

              <AnimatePresence mode="wait">
                {selectedPaymentMethod === 'bkash' && (
                  <BkashPaymentContent key="bkash" />
                )}
                {selectedPaymentMethod === 'manual-bkash' && (
                  <ManualBkashContent
                    key="manual-bkash"
                    totalAmount={finalPrice}
                    messName={mess?.name || 'MessHishab'}
                    bkashNumber={manualBkashNumber}
                    trxId={manualTrxId}
                    onBkashNumberChange={setManualBkashNumber}
                    onTrxIdChange={setManualTrxId}
                  />
                )}
                {selectedPaymentMethod === 'sslcommerz' && (
                  <SSLCommerzContent key="sslcommerz" />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Cart Section - Right */}
          <div className="lg:col-span-2">
            <CartSection
              selectedPlan={selectedPlan}
              couponCode={couponCode}
              appliedCoupon={appliedCoupon}
              onCouponChange={setCouponCode}
              onApplyCoupon={handleApplyCoupon}
              isApplyingCoupon={isApplyingCoupon}
              onCompletePayment={handleCompletePayment}
              isProcessing={isProcessing}
              selectedPaymentMethod={selectedPaymentMethod}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
