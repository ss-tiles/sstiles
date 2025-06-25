-- SS Tiles Inventory Management Database Setup
-- Run these SQL commands in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fix main_categories table (if it has wrong structure)
-- First, backup any existing data if needed, then recreate the table

DROP TABLE IF EXISTS main_categories CASCADE;

CREATE TABLE main_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_number TEXT,
    payment_terms TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_number TEXT UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    total_amount NUMERIC(10,2) DEFAULT 0,
    tax_amount NUMERIC(10,2) DEFAULT 0,
    discount_amount NUMERIC(10,2) DEFAULT 0,
    net_amount NUMERIC(10,2) DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, received, cancelled
    payment_status TEXT DEFAULT 'unpaid', -- paid, unpaid, partial
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expected_delivery_date TIMESTAMP WITH TIME ZONE,
    received_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create purchase_items table
CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_cost NUMERIC(10,2) NOT NULL,
    total_cost NUMERIC(10,2) NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create or update the users table to be cleaner (remove duplicate auth fields)
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    role TEXT DEFAULT 'user', -- user, admin, manager
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create financial_transactions table for better financial tracking
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_type TEXT NOT NULL, -- sale, purchase, adjustment, expense
    reference_type TEXT, -- sale, purchase, manual
    reference_id UUID, -- reference to sale_id, purchase_id, etc.
    amount NUMERIC(10,2) NOT NULL,
    description TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_method TEXT, -- cash, card, bank_transfer, cheque
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_main_category ON products(main_category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product_id ON purchase_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON inventory_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date);

-- Add foreign key constraints if they don't exist
ALTER TABLE subcategories 
ADD CONSTRAINT fk_subcategories_main_category 
FOREIGN KEY (main_category_id) REFERENCES main_categories(id);

ALTER TABLE products 
ADD CONSTRAINT fk_products_main_category 
FOREIGN KEY (main_category_id) REFERENCES main_categories(id);

ALTER TABLE products 
ADD CONSTRAINT fk_products_subcategory 
FOREIGN KEY (subcategory_id) REFERENCES subcategories(id);

-- Enable Row Level Security (RLS)
ALTER TABLE main_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Users can view all data" ON main_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert data" ON main_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update data" ON main_categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete data" ON main_categories FOR DELETE TO authenticated USING (true);

-- Repeat similar policies for other tables (simplified for brevity)
CREATE POLICY "Users can view all subcategories" ON subcategories FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can view all products" ON products FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can view all sales" ON sales FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can view all sale_items" ON sale_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can view all purchases" ON purchases FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can view all purchase_items" ON purchase_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can view all suppliers" ON suppliers FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can view all inventory_movements" ON inventory_movements FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can view all financial_transactions" ON financial_transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can view all users" ON users FOR ALL TO authenticated USING (true);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_main_categories_updated_at BEFORE UPDATE ON main_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON subcategories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO main_categories (name, description) VALUES 
('Tiles', 'Ceramic and stone tiles'),
('Tools', 'Installation and maintenance tools'),
('Accessories', 'Tile accessories and materials');

INSERT INTO suppliers (name, contact_person, email, phone) VALUES 
('Tile Mart Ltd', 'John Smith', 'john@tilemart.com', '+1234567890'),
('Tool Supply Co', 'Jane Doe', 'jane@toolsupply.com', '+1234567891');

-- Note: Run this script in your Supabase SQL Editor
-- Make sure to backup your existing data before running DROP statements 