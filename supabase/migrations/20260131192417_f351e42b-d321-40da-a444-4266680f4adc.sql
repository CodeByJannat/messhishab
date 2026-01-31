-- Create additional_costs table for utility bills
CREATE TABLE public.additional_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID NOT NULL REFERENCES public.messes(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.additional_costs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Managers can view additional costs"
ON public.additional_costs
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM messes
  WHERE messes.id = additional_costs.mess_id
  AND messes.manager_id = auth.uid()
));

CREATE POLICY "Managers can insert additional costs"
ON public.additional_costs
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM messes
  WHERE messes.id = additional_costs.mess_id
  AND messes.manager_id = auth.uid()
));

CREATE POLICY "Managers can update additional costs"
ON public.additional_costs
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM messes
  WHERE messes.id = additional_costs.mess_id
  AND messes.manager_id = auth.uid()
));

CREATE POLICY "Managers can delete additional costs"
ON public.additional_costs
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM messes
  WHERE messes.id = additional_costs.mess_id
  AND messes.manager_id = auth.uid()
));

-- Members can view additional costs
CREATE POLICY "Members can view additional costs"
ON public.additional_costs
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM members
  WHERE members.mess_id = additional_costs.mess_id
  AND members.user_id = auth.uid()
  AND members.is_active = true
));

-- Create trigger for date validation
CREATE TRIGGER validate_additional_costs_date
BEFORE INSERT OR UPDATE ON additional_costs
FOR EACH ROW EXECUTE FUNCTION validate_entry_date();

-- Create trigger for updated_at
CREATE TRIGGER update_additional_costs_updated_at
BEFORE UPDATE ON additional_costs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();