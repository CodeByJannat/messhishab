import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Check, Tag, CreditCard, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface CartSectionProps {
  selectedPlan: 'monthly' | 'yearly';
  couponCode: string;
  appliedCoupon: {
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
  } | null;
  basePrice: number;
  discountAmount: number;
  finalPrice: number;
  onCouponChange: (value: string) => void;
  onApplyCoupon: () => void;
  isApplyingCoupon: boolean;
  onCompletePayment: () => void;
  isProcessing: boolean;
  selectedPaymentMethod: string;
}

export function CartSection({
  selectedPlan,
  couponCode,
  appliedCoupon,
  basePrice,
  discountAmount,
  finalPrice,
  onCouponChange,
  onApplyCoupon,
  isApplyingCoupon,
  onCompletePayment,
  isProcessing,
  selectedPaymentMethod,
}: CartSectionProps) {
  const { language } = useLanguage();

  const planName = selectedPlan === 'yearly' ? 'Yearly Plan' : 'Monthly Plan';
  const planNameBn = selectedPlan === 'yearly' ? 'বার্ষিক প্ল্যান' : 'মাসিক প্ল্যান';
  const period = selectedPlan === 'yearly' ? '/year' : '/month';
  const periodBn = selectedPlan === 'yearly' ? '/বছর' : '/মাস';

  const features = [
    { en: 'All features included', bn: 'সব ফিচার অন্তর্ভুক্ত' },
    { en: 'Unlimited members', bn: 'আনলিমিটেড মেম্বার' },
    { en: 'Auto calculations', bn: 'অটো ক্যালকুলেশন' },
    { en: '24/7 support', bn: '২৪/৭ সাপোর্ট' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card p-6 rounded-2xl sticky top-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-lg text-foreground">
            {language === 'bn' ? 'অর্ডার সারাংশ' : 'Order Summary'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {language === 'bn' ? 'আপনার সিলেক্টেড প্ল্যান' : 'Your selected plan'}
          </p>
        </div>
      </div>

      {/* Cart Item */}
      <div className="p-4 rounded-xl bg-muted/30 border border-border mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-foreground">
              {language === 'bn' ? planNameBn : planName}
            </h3>
            {selectedPlan === 'yearly' && (
              <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary">
                {language === 'bn' ? '২ মাস ফ্রি!' : '2 months free!'}
              </Badge>
            )}
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-foreground">৳{basePrice}</span>
            <span className="text-sm text-muted-foreground">
              {language === 'bn' ? periodBn : period}
            </span>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-primary shrink-0" />
              <span>{language === 'bn' ? feature.bn : feature.en}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Coupon Section */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {language === 'bn' ? 'কুপন কোড' : 'Coupon Code'}
          </span>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder={language === 'bn' ? 'কোড লিখুন' : 'Enter code'}
            value={couponCode}
            onChange={(e) => onCouponChange(e.target.value)}
            className="h-10 rounded-xl"
            disabled={!!appliedCoupon}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={onApplyCoupon}
            disabled={isApplyingCoupon || !couponCode.trim() || !!appliedCoupon}
            className="rounded-xl px-4"
          >
            {isApplyingCoupon ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              language === 'bn' ? 'প্রয়োগ' : 'Apply'
            )}
          </Button>
        </div>
        {appliedCoupon && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 p-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between"
          >
            <span className="text-sm text-primary font-medium">{appliedCoupon.code}</span>
            <Badge variant="secondary">
              {appliedCoupon.discount_type === 'percentage' 
                ? `${appliedCoupon.discount_value}% OFF`
                : `৳${appliedCoupon.discount_value} OFF`
              }
            </Badge>
          </motion.div>
        )}
      </div>

      {/* Price Breakdown */}
      <div className="space-y-3 py-4 border-t border-border">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {language === 'bn' ? 'সাবটোটাল' : 'Subtotal'}
          </span>
          <span className="text-foreground">৳{basePrice}</span>
        </div>
        {appliedCoupon && (
          <div className="flex justify-between text-sm">
            <span className="text-primary">
              {language === 'bn' ? 'ডিসকাউন্ট' : 'Discount'}
            </span>
            <span className="text-primary">-৳{discountAmount.toFixed(0)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold pt-3 border-t border-border">
          <span className="text-foreground">
            {language === 'bn' ? 'মোট' : 'Total'}
          </span>
          <span className="text-primary">৳{finalPrice.toFixed(0)}</span>
        </div>
      </div>

      {/* Complete Payment Button */}
      <Button
        className="w-full h-12 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/30"
        onClick={onCompletePayment}
        disabled={isProcessing || !selectedPaymentMethod}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            {language === 'bn' ? 'প্রসেসিং...' : 'Processing...'}
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-2" />
            {language === 'bn' ? 'পেমেন্ট সম্পন্ন করুন' : 'Complete Payment'}
          </>
        )}
      </Button>

      {/* Security Badge */}
      <div className="mt-4 text-center">
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
          <span>🔒</span>
          {language === 'bn' 
            ? 'সম্পূর্ণ নিরাপদ পেমেন্ট'
            : 'Secure payment guaranteed'}
        </p>
      </div>
    </motion.div>
  );
}
