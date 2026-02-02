-- Add default terms field to organizations
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS invoice_terms text;