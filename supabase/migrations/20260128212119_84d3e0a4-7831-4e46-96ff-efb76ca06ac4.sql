-- First drop the existing functions
DROP FUNCTION IF EXISTS public.is_mess_manager(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_user_mess_id(UUID);

-- Create helper function to check if user is the mess manager (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_mess_manager(_mess_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM messes
    WHERE id = _mess_id AND manager_id = _user_id
  );
$$;

-- Create helper function to get user's mess_id (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_mess_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT mess_id FROM members
  WHERE user_id = _user_id AND is_active = true
  LIMIT 1;
$$;

-- Drop existing policies on messes table
DROP POLICY IF EXISTS "Managers can view own mess" ON messes;
DROP POLICY IF EXISTS "Members can view their mess" ON messes;
DROP POLICY IF EXISTS "Managers can insert own mess" ON messes;
DROP POLICY IF EXISTS "Managers can update own mess" ON messes;

-- Recreate messes policies without circular references
CREATE POLICY "Managers can view own mess"
ON messes FOR SELECT
USING (auth.uid() = manager_id);

CREATE POLICY "Members can view their mess"
ON messes FOR SELECT
USING (id = public.get_user_mess_id(auth.uid()));

CREATE POLICY "Managers can insert own mess"
ON messes FOR INSERT
WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Managers can update own mess"
ON messes FOR UPDATE
USING (auth.uid() = manager_id);

-- Drop and recreate members policies using helper function
DROP POLICY IF EXISTS "Managers can view all members" ON members;
DROP POLICY IF EXISTS "Managers can insert members" ON members;
DROP POLICY IF EXISTS "Managers can update members" ON members;
DROP POLICY IF EXISTS "Managers can delete members" ON members;
DROP POLICY IF EXISTS "Members can view own info" ON members;

CREATE POLICY "Managers can view all members"
ON members FOR SELECT
USING (public.is_mess_manager(mess_id, auth.uid()));

CREATE POLICY "Managers can insert members"
ON members FOR INSERT
WITH CHECK (public.is_mess_manager(mess_id, auth.uid()));

CREATE POLICY "Managers can update members"
ON members FOR UPDATE
USING (public.is_mess_manager(mess_id, auth.uid()));

CREATE POLICY "Managers can delete members"
ON members FOR DELETE
USING (public.is_mess_manager(mess_id, auth.uid()));

CREATE POLICY "Members can view own info"
ON members FOR SELECT
USING (auth.uid() = user_id);