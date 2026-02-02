-- Replace Razorpay with Cashfree payment gateway columns
ALTER TABLE public.organizations DROP COLUMN IF EXISTS razorpay_key_id;
ALTER TABLE public.organizations DROP COLUMN IF EXISTS razorpay_key_secret;

ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS cashfree_app_id text DEFAULT NULL;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS cashfree_secret_key text DEFAULT NULL;

-- Update payments table to use cashfree instead of razorpay
ALTER TABLE public.payments DROP COLUMN IF EXISTS razorpay_order_id;
ALTER TABLE public.payments DROP COLUMN IF EXISTS razorpay_payment_id;
ALTER TABLE public.payments DROP COLUMN IF EXISTS razorpay_signature;

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS cashfree_order_id text DEFAULT NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS cashfree_payment_id text DEFAULT NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS customer_upi_id text DEFAULT NULL;