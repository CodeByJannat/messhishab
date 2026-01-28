import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { CreditCard } from 'lucide-react';

// Import payment icons
import bkashIcon from '@/assets/bkash-icon.png';
import sslLogo from '@/assets/ssl-logo.png';

type PaymentMethod = 'bkash' | 'manual-bkash' | 'sslcommerz';

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { mess } = useAuth();
  const { toast } = useToast();

  // Get plan from subscription page state, default to monthly
  const planFromState = (location.state as { plan?: 'monthly' | 'yearly' })?.plan;
  const selectedPlan: 'monthly' | 'yearly' = planFromState || 'monthly';

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

  // Redirect to dashboard if mess name is not set OR mess_id is still PENDING
  useEffect(() => {
    if (mess && (!mess.name || mess.mess_id === 'PENDING')) {
      toast({
        title: language === 'bn' ? 'মেসের নাম প্রয়োজন' : 'Mess Name Required',
        description: language === 'bn' 
          ? 'পেমেন্ট করার আগে মেসের নাম সেট করুন'
          : 'Please set your mess name before making a payment',
        variant: 'destructive',
      });
      navigate('/dashboard');
    }
  }, [mess, navigate, language, toast]);

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

  const activateSubscription = async () => {
    if (!mess) return false;

    try {
      const { data, error } = await supabase.functions.invoke('activate-subscription', {
        body: {
          mess_id: mess.id,
          plan_type: selectedPlan,
          payment_verified: true,
          payment_method: selectedPaymentMethod,
          coupon_code: appliedCoupon?.code || null,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: language === 'bn' ? 'সফল!' : 'Success!',
          description: language === 'bn'
            ? 'আপনার সাবস্ক্রিপশন সক্রিয় হয়েছে!'
            : 'Your subscription has been activated!',
        });
        // Redirect to dashboard after successful activation
        navigate('/dashboard');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Subscription activation error:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message || 'Failed to activate subscription',
        variant: 'destructive',
      });
      return false;
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

        // For manual bKash, we submit for manual verification
        // In production, this would go to a queue for admin review
        // For now, we'll auto-activate (simulating admin approval)
        toast({
          title: language === 'bn' ? 'অনুরোধ পাঠানো হয়েছে' : 'Request Submitted',
          description: language === 'bn'
            ? 'আপনার পেমেন্ট ভেরিফিকেশনের জন্য পাঠানো হয়েছে।'
            : 'Your payment has been submitted for verification.',
        });
        
        // Activate subscription after "verification" 
        // In production, this would happen after admin approval
        await activateSubscription();
        
      } else if (selectedPaymentMethod === 'bkash') {
        // TODO: Integrate with bKash payment gateway
        // After successful gateway callback, call activateSubscription()
        toast({
          title: language === 'bn' ? 'শীঘ্রই আসছে' : 'Coming Soon',
          description: language === 'bn'
            ? 'ডিরেক্ট বিকাশ পেমেন্ট শীঘ্রই চালু হবে। এখন ম্যানুয়াল বিকাশ ব্যবহার করুন।'
            : 'Direct bKash payment coming soon. Please use Manual bKash for now.',
        });
      } else if (selectedPaymentMethod === 'sslcommerz') {
        // TODO: Integrate with SSL Commerz
        // After successful gateway callback, call activateSubscription()
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

  // Use Mess ID as reference for manual bKash
  const messIdReference = mess?.mess_id || '';

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
                    messId={messIdReference}
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
