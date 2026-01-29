import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  usage_limit: number | null;
  used_count: number;
  expiry_date: string | null;
}

interface AppliedCoupon {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  description: string;
}

export function useCoupon() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const validateAndApplyCoupon = async (code: string, basePrice: number): Promise<{
    success: boolean;
    discountAmount: number;
    finalPrice: number;
  }> => {
    if (!code.trim()) {
      return { success: false, discountAmount: 0, finalPrice: basePrice };
    }

    setIsApplying(true);
    try {
      // Fetch coupon from database
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;

      if (!coupon) {
        toast({
          title: language === 'bn' ? 'ত্রুটি' : 'Error',
          description: language === 'bn' ? 'অবৈধ কুপন কোড' : 'Invalid coupon code',
          variant: 'destructive',
        });
        return { success: false, discountAmount: 0, finalPrice: basePrice };
      }

      // Check expiry
      if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
        toast({
          title: language === 'bn' ? 'ত্রুটি' : 'Error',
          description: language === 'bn' ? 'কুপনের মেয়াদ শেষ' : 'Coupon has expired',
          variant: 'destructive',
        });
        return { success: false, discountAmount: 0, finalPrice: basePrice };
      }

      // Check usage limit
      if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
        toast({
          title: language === 'bn' ? 'ত্রুটি' : 'Error',
          description: language === 'bn' ? 'কুপন ব্যবহার সীমা শেষ' : 'Coupon usage limit reached',
          variant: 'destructive',
        });
        return { success: false, discountAmount: 0, finalPrice: basePrice };
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (basePrice * coupon.discount_value) / 100;
      } else {
        discountAmount = Math.min(coupon.discount_value, basePrice);
      }

      const finalPrice = Math.max(0, basePrice - discountAmount);

      // Set applied coupon
      const appliedData: AppliedCoupon = {
        code: coupon.code,
        discount_type: coupon.discount_type as 'percentage' | 'fixed',
        discount_value: Number(coupon.discount_value),
        description: coupon.discount_type === 'percentage'
          ? `${coupon.discount_value}% ${language === 'bn' ? 'ছাড়' : 'off'}`
          : `৳${coupon.discount_value} ${language === 'bn' ? 'ছাড়' : 'off'}`,
      };

      setAppliedCoupon(appliedData);

      toast({
        title: language === 'bn' ? 'সফল!' : 'Success!',
        description: appliedData.description,
      });

      return { success: true, discountAmount, finalPrice };
    } catch (error: any) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error.message || 'Failed to apply coupon',
        variant: 'destructive',
      });
      return { success: false, discountAmount: 0, finalPrice: basePrice };
    } finally {
      setIsApplying(false);
    }
  };

  const clearCoupon = () => {
    setAppliedCoupon(null);
  };

  const calculateDiscount = (basePrice: number): { discountAmount: number; finalPrice: number } => {
    if (!appliedCoupon) {
      return { discountAmount: 0, finalPrice: basePrice };
    }

    let discountAmount = 0;
    if (appliedCoupon.discount_type === 'percentage') {
      discountAmount = (basePrice * appliedCoupon.discount_value) / 100;
    } else {
      discountAmount = Math.min(appliedCoupon.discount_value, basePrice);
    }

    const finalPrice = Math.max(0, basePrice - discountAmount);
    return { discountAmount, finalPrice };
  };

  return {
    appliedCoupon,
    isApplying,
    validateAndApplyCoupon,
    clearCoupon,
    calculateDiscount,
    setAppliedCoupon,
  };
}
