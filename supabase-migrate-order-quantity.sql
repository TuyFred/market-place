-- Add order quantity for stock calculations
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.orders.quantity IS 'Items ordered; stock on product is reduced by this amount';
