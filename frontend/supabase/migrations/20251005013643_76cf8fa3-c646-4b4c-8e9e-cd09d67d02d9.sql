-- Add payment columns to interviews table
ALTER TABLE interviews 
ADD COLUMN payment_status text DEFAULT 'pending',
ADD COLUMN payment_reference text,
ADD COLUMN amount_paid numeric(10,2);

-- Add check constraint for payment status
ALTER TABLE interviews 
ADD CONSTRAINT check_payment_status 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));