-- Create direct_messages table for individual conversations
CREATE TABLE public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES public.messes(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('manager', 'member')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create broadcast_messages table for group messages
CREATE TABLE public.broadcast_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES public.messes(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_direct_messages_mess_id ON public.direct_messages(mess_id);
CREATE INDEX idx_direct_messages_member_id ON public.direct_messages(member_id);
CREATE INDEX idx_direct_messages_created_at ON public.direct_messages(created_at DESC);
CREATE INDEX idx_broadcast_messages_mess_id ON public.broadcast_messages(mess_id);
CREATE INDEX idx_broadcast_messages_created_at ON public.broadcast_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for direct_messages
CREATE POLICY "Managers can view messages for their mess"
ON public.direct_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.messes
  WHERE messes.id = direct_messages.mess_id
  AND messes.manager_id = auth.uid()
));

CREATE POLICY "Managers can insert messages for their mess"
ON public.direct_messages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.messes
  WHERE messes.id = direct_messages.mess_id
  AND messes.manager_id = auth.uid()
));

CREATE POLICY "Managers can update messages for their mess"
ON public.direct_messages FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.messes
  WHERE messes.id = direct_messages.mess_id
  AND messes.manager_id = auth.uid()
));

-- RLS Policies for broadcast_messages
CREATE POLICY "Managers can view broadcasts for their mess"
ON public.broadcast_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.messes
  WHERE messes.id = broadcast_messages.mess_id
  AND messes.manager_id = auth.uid()
));

CREATE POLICY "Managers can insert broadcasts for their mess"
ON public.broadcast_messages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.messes
  WHERE messes.id = broadcast_messages.mess_id
  AND messes.manager_id = auth.uid()
));

CREATE POLICY "Managers can update broadcasts for their mess"
ON public.broadcast_messages FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.messes
  WHERE messes.id = broadcast_messages.mess_id
  AND messes.manager_id = auth.uid()
));

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_messages;