-- Create role enum for user types
CREATE TYPE public.user_role AS ENUM ('manager', 'member');

-- Create subscription type enum
CREATE TYPE public.subscription_type AS ENUM ('monthly', 'yearly');

-- Create subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'cancelled');

-- Create profiles table for user information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL DEFAULT 'manager',
    UNIQUE (user_id, role)
);

-- Create messes table
CREATE TABLE public.messes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mess_id TEXT UNIQUE NOT NULL,
    manager_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    mess_password TEXT NOT NULL DEFAULT 'mess123',
    name TEXT,
    current_month TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL UNIQUE,
    type subscription_type NOT NULL DEFAULT 'monthly',
    status subscription_status NOT NULL DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    coupon_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create members table (encrypted PII)
CREATE TABLE public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email_encrypted TEXT,
    phone_encrypted TEXT,
    room_number_encrypted TEXT,
    pin_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meals table
CREATE TABLE public.meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    breakfast INTEGER NOT NULL DEFAULT 0,
    lunch INTEGER NOT NULL DEFAULT 0,
    dinner INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (member_id, date)
);

-- Create bazars table
CREATE TABLE public.bazars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    person_name TEXT NOT NULL,
    items TEXT,
    note TEXT,
    cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deposits table
CREATE TABLE public.deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
    from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    to_member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    to_all BOOLEAN NOT NULL DEFAULT false,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create monthly_archives table
CREATE TABLE public.monthly_archives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
    month TEXT NOT NULL,
    total_meals INTEGER NOT NULL DEFAULT 0,
    total_bazar DECIMAL(10, 2) NOT NULL DEFAULT 0,
    meal_rate DECIMAL(10, 4) NOT NULL DEFAULT 0,
    members_data JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pin_access_logs table for security
CREATE TABLE public.pin_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
    accessed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    success BOOLEAN NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bazars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_access_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function for role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's mess_id
CREATE OR REPLACE FUNCTION public.get_user_mess_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.messes WHERE manager_id = _user_id
  UNION
  SELECT mess_id FROM public.members WHERE user_id = _user_id AND is_active = true
  LIMIT 1
$$;

-- Function to check if user is manager of a mess
CREATE OR REPLACE FUNCTION public.is_mess_manager(_user_id UUID, _mess_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.messes
    WHERE id = _mess_id AND manager_id = _user_id
  )
$$;

-- Function to generate unique mess ID
CREATE OR REPLACE FUNCTION public.generate_mess_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id TEXT;
  counter INTEGER := 0;
BEGIN
  LOOP
    new_id := 'MESS-' || upper(substr(md5(random()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.messes WHERE mess_id = new_id);
    counter := counter + 1;
    IF counter > 100 THEN
      RAISE EXCEPTION 'Could not generate unique mess ID';
    END IF;
  END LOOP;
  RETURN new_id;
END;
$$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_messes_updated_at BEFORE UPDATE ON public.messes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON public.meals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bazars_updated_at BEFORE UPDATE ON public.bazars FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Profiles: Users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Roles: Users can view their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Messes: Managers can CRUD their own mess
CREATE POLICY "Managers can view own mess" ON public.messes FOR SELECT USING (auth.uid() = manager_id);
CREATE POLICY "Managers can update own mess" ON public.messes FOR UPDATE USING (auth.uid() = manager_id);
CREATE POLICY "Managers can insert own mess" ON public.messes FOR INSERT WITH CHECK (auth.uid() = manager_id);

-- Members can view their mess basic info
CREATE POLICY "Members can view their mess" ON public.messes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.members WHERE mess_id = messes.id AND user_id = auth.uid() AND is_active = true)
);

-- Subscriptions: Manager can view/manage
CREATE POLICY "Managers can view subscriptions" ON public.subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.messes WHERE id = subscriptions.mess_id AND manager_id = auth.uid())
);
CREATE POLICY "Managers can update subscriptions" ON public.subscriptions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.messes WHERE id = subscriptions.mess_id AND manager_id = auth.uid())
);
CREATE POLICY "Managers can insert subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.messes WHERE id = subscriptions.mess_id AND manager_id = auth.uid())
);

-- Members: Managers can CRUD, members can only view their own basic info
CREATE POLICY "Managers can view all members" ON public.members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.messes WHERE id = members.mess_id AND manager_id = auth.uid())
);
CREATE POLICY "Managers can insert members" ON public.members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.messes WHERE id = members.mess_id AND manager_id = auth.uid())
);
CREATE POLICY "Managers can update members" ON public.members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.messes WHERE id = members.mess_id AND manager_id = auth.uid())
);
CREATE POLICY "Managers can delete members" ON public.members FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.messes WHERE id = members.mess_id AND manager_id = auth.uid())
);
CREATE POLICY "Members can view own info" ON public.members FOR SELECT USING (auth.uid() = user_id);

-- Meals: Managers can CRUD, members can view own
CREATE POLICY "Managers can view all meals" ON public.meals FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.messes WHERE id = meals.mess_id AND manager_id = auth.uid())
);
CREATE POLICY "Managers can insert meals" ON public.meals FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.messes WHERE id = meals.mess_id AND manager_id = auth.uid())
);
CREATE POLICY "Managers can update meals" ON public.meals FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.messes WHERE id = meals.mess_id AND manager_id = auth.uid())
);
CREATE POLICY "Managers can delete meals" ON public.meals FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.messes WHERE id = meals.mess_id AND manager_id = auth.uid())
);
CREATE POLICY "Members can view own meals" ON public.meals FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.members WHERE id = meals.member_id AND user_id = auth.uid())
);

-- Bazars: Managers can CRUD, members can view all in their mess
CREATE POLICY "Managers can view all bazars" ON public.bazars FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.messes WHERE id = bazars.mess_id AND manager_id = auth.uid())
);
CREATE POLICY "Managers can insert bazars" ON public.bazars FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.messes WHERE id = bazars.mess_id AND manager_id = auth.uid())
);
CREATE POLICY "Managers can update bazars" ON public.bazars FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.messes WHERE id = bazars.mess_id AND manager_id = auth.uid())
);
CREATE POLICY "Managers can delete bazars" ON public.bazars FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.messes WHERE id = bazars.mess_id AND manager_id = auth.uid())
);
CREATE POLICY "Members can view bazars" ON public.bazars FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.members WHERE mess_id = bazars.mess_id AND user_id = auth.uid() AND is_active = true)
);

-- Deposits: Managers can CRUD, members can view own
CREATE POLICY "Managers can view all deposits" ON public.deposits FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.messes WHERE id = deposits.mess_id AND manager_id = auth.uid())
);
CREATE POLICY "Managers can insert deposits" ON public.deposits FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.messes WHERE id = deposits.mess_id AND manager_id = auth.uid())
);
CREATE POLICY "Managers can update deposits" ON public.deposits FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.messes WHERE id = deposits.mess_id AND manager_id = auth.uid())
);
CREATE POLICY "Managers can delete deposits" ON public.deposits FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.messes WHERE id = deposits.mess_id AND manager_id = auth.uid())
);
CREATE POLICY "Members can view own deposits" ON public.deposits FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.members WHERE id = deposits.member_id AND user_id = auth.uid())
);

-- Notifications: Managers can CRUD, members can view their own
CREATE POLICY "Managers can view all notifications" ON public.notifications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.messes WHERE id = notifications.mess_id AND manager_id = auth.uid())
);
CREATE POLICY "Managers can insert notifications" ON public.notifications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.messes WHERE id = notifications.mess_id AND manager_id = auth.uid())
);
CREATE POLICY "Members can view own notifications" ON public.notifications FOR SELECT USING (
  (to_all = true AND EXISTS (SELECT 1 FROM public.members WHERE mess_id = notifications.mess_id AND user_id = auth.uid() AND is_active = true))
  OR
  EXISTS (SELECT 1 FROM public.members WHERE id = notifications.to_member_id AND user_id = auth.uid())
);
CREATE POLICY "Members can insert notifications to manager" ON public.notifications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.members WHERE mess_id = notifications.mess_id AND user_id = auth.uid() AND is_active = true)
);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.members WHERE id = notifications.to_member_id AND user_id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM public.messes WHERE id = notifications.mess_id AND manager_id = auth.uid())
);

-- Monthly Archives: Managers can view, system inserts
CREATE POLICY "Managers can view archives" ON public.monthly_archives FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.messes WHERE id = monthly_archives.mess_id AND manager_id = auth.uid())
);

-- PIN Access Logs: Managers can view
CREATE POLICY "Managers can view pin logs" ON public.pin_access_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.members m JOIN public.messes ms ON m.mess_id = ms.id WHERE m.id = pin_access_logs.member_id AND ms.manager_id = auth.uid())
);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_mess_id TEXT;
  new_mess_uuid UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Create manager role (all new users are managers by default)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'manager');
  
  -- Generate unique mess ID
  new_mess_id := public.generate_mess_id();
  
  -- Create mess for the manager
  INSERT INTO public.messes (mess_id, manager_id)
  VALUES (new_mess_id, NEW.id)
  RETURNING id INTO new_mess_uuid;
  
  -- Create initial subscription (30 days trial)
  INSERT INTO public.subscriptions (mess_id, type, status, end_date)
  VALUES (new_mess_uuid, 'monthly', 'active', now() + INTERVAL '30 days');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;