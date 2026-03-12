-- B2B Orders System - Database Schema
-- Used by both customers-api and orders-api (single MySQL instance)
-- With Docker Compose, the database b2b_orders is created by MYSQL_DATABASE. For local MySQL without Docker, create it first: CREATE DATABASE b2b_orders;

USE b2b_orders;

-- Customers (used by customers-api)
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_customers_email (email),
  INDEX idx_customers_deleted_at (deleted_at),
  INDEX idx_customers_name (name)
);

-- Products (used by orders-api)
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  price_cents INT NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_products_sku (sku),
  INDEX idx_products_name (name)
);

-- Orders (used by orders-api)
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  status ENUM('CREATED', 'CONFIRMED', 'CANCELED') NOT NULL DEFAULT 'CREATED',
  total_cents INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  INDEX idx_orders_customer_id (customer_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_created_at (created_at)
);

-- Order items (used by orders-api)
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  qty INT NOT NULL,
  unit_price_cents INT NOT NULL,
  subtotal_cents INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_order_items_order_id (order_id)
);

-- Idempotency keys (used by orders-api for confirm)
CREATE TABLE IF NOT EXISTS idempotency_keys (
  `key` VARCHAR(255) NOT NULL PRIMARY KEY,
  target_type VARCHAR(50) NOT NULL,
  target_id VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  response_body JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  INDEX idx_idempotency_target (target_type, target_id)
);
