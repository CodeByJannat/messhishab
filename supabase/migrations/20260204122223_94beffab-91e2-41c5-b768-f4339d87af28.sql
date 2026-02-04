-- Add phone column to profiles table for manager contact info
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- Create a database function to get member count for a mess (for admin use)
CREATE OR REPLACE FUNCTION public.get_mess_member_count(mess_uuid uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM members WHERE mess_id = mess_uuid;
$$;