-- Allow admins to view all members
CREATE POLICY "Admins can view all members"
ON public.members
FOR SELECT
USING (has_role(auth.uid(), 'admin'));