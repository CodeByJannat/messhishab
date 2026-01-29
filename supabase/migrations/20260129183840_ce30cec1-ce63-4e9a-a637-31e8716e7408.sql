-- Add coupon_code and discount_amount columns to payments table for tracking coupon usage
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS coupon_code text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;