-- B2B Orders System - Seed Data
USE b2b_orders;

-- Sample customers
INSERT INTO customers (name, email, phone) VALUES
  ('ACME Corp', 'ops@acme.com', '+1-555-0100'),
  ('Globex Inc', 'orders@globex.com', '+1-555-0101'),
  ('Initech', 'purchasing@initech.com', '+1-555-0102')
ON DUPLICATE KEY UPDATE name = VALUES(name), phone = VALUES(phone);

-- Sample products
INSERT INTO products (sku, name, price_cents, stock) VALUES
  ('SKU-001', 'Widget A', 9999, 100),
  ('SKU-002', 'Widget B', 129900, 50),
  ('SKU-003', 'Gadget X', 49900, 200),
  ('SKU-004', 'Gadget Y', 29900, 75)
ON DUPLICATE KEY UPDATE name = VALUES(name), price_cents = VALUES(price_cents), stock = VALUES(stock);
