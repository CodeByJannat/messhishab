-- Create a function for admins to get user emails
CREATE OR REPLACE FUNCTION public.get_user_emails_for_admin(user_ids uuid[])
RETURNS TABLE(user_id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to call this function
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT p.user_id, p.email
  FROM profiles p
  WHERE p.user_id = ANY(user_ids);
END;
$$;