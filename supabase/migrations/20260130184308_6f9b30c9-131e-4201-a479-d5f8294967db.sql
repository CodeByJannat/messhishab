-- Allow service role to insert member roles (edge function uses service role)
-- The existing RLS doesn't allow INSERT on user_roles, but edge function uses service role which bypasses RLS

-- No changes needed - service role already bypasses RLS
-- Just need to ensure the member portal route works for authenticated members

-- Add comment for documentation
COMMENT ON TABLE public.user_roles IS 'Stores user roles. Managed by triggers (for managers on signup) and edge functions (for members when added by managers).';