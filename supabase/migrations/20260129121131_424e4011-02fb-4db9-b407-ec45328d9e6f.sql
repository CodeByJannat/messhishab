-- Create contact_messages table for storing form submissions
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contact_message_replies table for admin replies
CREATE TABLE public.contact_message_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_message_id UUID NOT NULL REFERENCES public.contact_messages(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL,
  reply_message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on both tables
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_message_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_messages
-- Anyone can insert (public contact form)
CREATE POLICY "Anyone can submit contact messages"
ON public.contact_messages
FOR INSERT
WITH CHECK (true);

-- Only admins can view contact messages
CREATE POLICY "Admins can view all contact messages"
ON public.contact_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Only admins can update contact messages (to change status)
CREATE POLICY "Admins can update contact messages"
ON public.contact_messages
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for contact_message_replies
-- Only admins can insert replies
CREATE POLICY "Admins can insert replies"
ON public.contact_message_replies
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Only admins can view replies
CREATE POLICY "Admins can view replies"
ON public.contact_message_replies
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create indexes for better query performance
CREATE INDEX idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX idx_contact_messages_created_at ON public.contact_messages(created_at DESC);
CREATE INDEX idx_contact_message_replies_message_id ON public.contact_message_replies(contact_message_id);