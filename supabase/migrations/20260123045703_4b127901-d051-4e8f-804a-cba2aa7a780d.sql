-- Add customer details directly to invoices (remove need for separate customers table reference)
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS customer_phone text,
ADD COLUMN IF NOT EXISTS customer_email text,
ADD COLUMN IF NOT EXISTS customer_address text;

-- Add additional info field to organizations for default invoice text
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS invoice_additional_info text;

-- Add invoice counter to organizations for sequential numbering
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS invoice_counter integer DEFAULT 0;

-- Create function to get next invoice number for an organization
CREATE OR REPLACE FUNCTION public.get_next_invoice_number(org_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num integer;
BEGIN
  -- Increment and get the counter atomically
  UPDATE public.organizations
  SET invoice_counter = COALESCE(invoice_counter, 0) + 1
  WHERE id = org_id
  RETURNING invoice_counter INTO next_num;
  
  -- Return formatted invoice number
  RETURN 'INV-' || LPAD(next_num::text, 4, '0');
END;
$$;