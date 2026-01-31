-- Create table for storing OTP codes
CREATE TABLE public.email_otps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_email_otps_email ON public.email_otps (email);
CREATE INDEX idx_email_otps_expires_at ON public.email_otps (expires_at);

-- Enable RLS
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;

-- Allow insert from anon (for registration)
CREATE POLICY "Allow insert for anon" 
ON public.email_otps 
FOR INSERT 
WITH CHECK (true);

-- Allow select for verification
CREATE POLICY "Allow select for verification" 
ON public.email_otps 
FOR SELECT 
USING (true);

-- Allow update for marking as verified
CREATE POLICY "Allow update for verification" 
ON public.email_otps 
FOR UPDATE 
USING (true);

-- Allow delete for cleanup
CREATE POLICY "Allow delete for cleanup" 
ON public.email_otps 
FOR DELETE 
USING (true);

-- Create function to cleanup expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM public.email_otps WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;