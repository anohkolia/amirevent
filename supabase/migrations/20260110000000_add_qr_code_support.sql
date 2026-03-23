-- Add QR code and order number columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS qr_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;

-- Create unique order number function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
         (SELECT string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', (random() * 36)::int + 1, 1), '') FROM generate_series(1, 8));
END;
$$ LANGUAGE plpgsql;

-- Update existing orders with order numbers if needed
UPDATE orders 
SET order_number = generate_order_number()
WHERE order_number IS NULL;

-- Add trigger to auto-generate order number on insert
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number = generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_set_order_number ON orders;
CREATE TRIGGER orders_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Create index for faster order lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_qr_code ON orders(qr_code);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);

