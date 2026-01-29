-- Migration 2: Create all admin dashboard tables and RLS policies

-- 1. Create payment_status enum
DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create ticket_status enum
DO $$ BEGIN
  CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Create mess_status enum
DO $$ BEGIN
  CREATE TYPE public.mess_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES public.messes(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  plan_type public.subscription_type NOT NULL DEFAULT 'monthly',
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  bkash_number TEXT,
  status public.payment_status NOT NULL DEFAULT 'pending',
  reject_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create pricing_settings table
CREATE TABLE IF NOT EXISTS public.pricing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_price DECIMAL(10,2) NOT NULL DEFAULT 20,
  yearly_price DECIMAL(10,2) NOT NULL DEFAULT 200,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default pricing if not exists
INSERT INTO public.pricing_settings (monthly_price, yearly_price)
SELECT 20, 200
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_settings LIMIT 1);

-- 7. Create help_desk_tickets table
CREATE TABLE IF NOT EXISTS public.help_desk_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES public.messes(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status public.ticket_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Create help_desk_messages table
CREATE TABLE IF NOT EXISTS public.help_desk_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.help_desk_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('admin', 'manager')),
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Create promotions table
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_name_en TEXT NOT NULL,
  offer_name_bn TEXT NOT NULL,
  coupon_code TEXT,
  cta_text_en TEXT NOT NULL DEFAULT 'Claim Now',
  cta_text_bn TEXT NOT NULL DEFAULT 'এখনই নিন',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Add status and suspend_reason columns to messes table
ALTER TABLE public.messes 
ADD COLUMN IF NOT EXISTS status public.mess_status NOT NULL DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS suspend_reason TEXT;

-- 11. Enable RLS on all new tables
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_desk_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_desk_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- 12. Create RLS policies for payments table
CREATE POLICY "Admins can view all payments"
ON public.payments FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update payments"
ON public.payments FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view own payments"
ON public.payments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.messes 
  WHERE messes.id = payments.mess_id 
  AND messes.manager_id = auth.uid()
));

CREATE POLICY "Managers can insert own payments"
ON public.payments FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.messes 
  WHERE messes.id = payments.mess_id 
  AND messes.manager_id = auth.uid()
));

-- 13. Create RLS policies for coupons table
CREATE POLICY "Admins can manage coupons"
ON public.coupons FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view active coupons"
ON public.coupons FOR SELECT
USING (status = 'active');

-- 14. Create RLS policies for pricing_settings table
CREATE POLICY "Admins can manage pricing"
ON public.pricing_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view pricing"
ON public.pricing_settings FOR SELECT
USING (true);

-- 15. Create RLS policies for help_desk_tickets table
CREATE POLICY "Admins can view all tickets"
ON public.help_desk_tickets FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all tickets"
ON public.help_desk_tickets FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view own tickets"
ON public.help_desk_tickets FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.messes 
  WHERE messes.id = help_desk_tickets.mess_id 
  AND messes.manager_id = auth.uid()
));

CREATE POLICY "Managers can insert own tickets"
ON public.help_desk_tickets FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.messes 
  WHERE messes.id = help_desk_tickets.mess_id 
  AND messes.manager_id = auth.uid()
));

CREATE POLICY "Managers can update own tickets"
ON public.help_desk_tickets FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.messes 
  WHERE messes.id = help_desk_tickets.mess_id 
  AND messes.manager_id = auth.uid()
));

-- 16. Create RLS policies for help_desk_messages table
CREATE POLICY "Admins can view all messages"
ON public.help_desk_messages FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert messages"
ON public.help_desk_messages FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update messages"
ON public.help_desk_messages FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view own ticket messages"
ON public.help_desk_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.help_desk_tickets t
  JOIN public.messes m ON m.id = t.mess_id
  WHERE t.id = help_desk_messages.ticket_id 
  AND m.manager_id = auth.uid()
));

CREATE POLICY "Managers can insert own ticket messages"
ON public.help_desk_messages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.help_desk_tickets t
  JOIN public.messes m ON m.id = t.mess_id
  WHERE t.id = help_desk_messages.ticket_id 
  AND m.manager_id = auth.uid()
));

CREATE POLICY "Managers can update own ticket messages"
ON public.help_desk_messages FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.help_desk_tickets t
  JOIN public.messes m ON m.id = t.mess_id
  WHERE t.id = help_desk_messages.ticket_id 
  AND m.manager_id = auth.uid()
));

-- 17. Create RLS policies for promotions table
CREATE POLICY "Admins can manage promotions"
ON public.promotions FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view active promotions"
ON public.promotions FOR SELECT
USING (is_active = true);

-- 18. Admin can view and update all messes
CREATE POLICY "Admins can view all messes"
ON public.messes FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all messes"
ON public.messes FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- 19. Admin can manage all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all subscriptions"
ON public.subscriptions FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert subscriptions"
ON public.subscriptions FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 20. Create updated_at trigger for help_desk_tickets
CREATE TRIGGER update_help_desk_tickets_updated_at
BEFORE UPDATE ON public.help_desk_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 21. Create updated_at trigger for promotions
CREATE TRIGGER update_promotions_updated_at
BEFORE UPDATE ON public.promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 22. Enable realtime for help desk messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.help_desk_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.help_desk_tickets;