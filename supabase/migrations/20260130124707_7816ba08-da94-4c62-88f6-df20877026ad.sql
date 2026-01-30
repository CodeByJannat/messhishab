-- Create admin_messages table for admin-to-mess messaging
CREATE TABLE public.admin_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('global', 'mess')),
  target_mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- Admins can insert messages
CREATE POLICY "Admins can insert messages"
ON public.admin_messages
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
ON public.admin_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Managers can view messages for their mess or global messages
CREATE POLICY "Managers can view relevant messages"
ON public.admin_messages
FOR SELECT
USING (
  target_type = 'global' 
  OR (
    target_type = 'mess' 
    AND target_mess_id IN (
      SELECT id FROM messes WHERE manager_id = auth.uid()
    )
  )
);

-- Add index for performance
CREATE INDEX idx_admin_messages_target ON public.admin_messages(target_type, target_mess_id);
CREATE INDEX idx_admin_messages_created ON public.admin_messages(created_at DESC);