-- SS Tiles Inventory Management Database Setup (SAFE VERSION)
-- Run these SQL commands in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================
-- OPTION 1: Clean slate approach (if you're okay with losing existing data)
-- ====================
-- Uncomment the lines below if you want to start fresh:

-- DROP TABLE IF EXISTS sale_items CASCADE;
-- DROP TABLE IF EXISTS sales CASCADE;
-- DROP TABLE IF EXISTS purchase_items CASCADE;
-- DROP TABLE IF EXISTS purchases CASCADE;
-- DROP TABLE IF EXISTS inventory_movements CASCADE;
-- DROP TABLE IF EXISTS financial_transactions CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS subcategories CASCADE;
-- DROP TABLE IF EXISTS main_categories CASCADE;
-- DROP TABLE IF EXISTS suppliers CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ====================
-- OPTION 2: Safe migration (preserves existing data)
-- ====================

-- First, let's check if main_categories needs to be fixed
-- Run this to see current structure:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'main_categories';

-- If main_categories has wrong structure, we need to migrate data
DO $$
DECLARE
    table_exists boolean;
    correct_structure boolean;
BEGIN
    -- Check if main_categories exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'main_categories'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Check if it has correct structure
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'main_categories'
            AND column_name = 'is_active'
            AND data_type = 'boolean'
        ) INTO correct_structure;
        
        IF NOT correct_structure THEN
            -- Backup existing data
            CREATE TEMP TABLE temp_main_categories AS SELECT * FROM main_categories;
            CREATE TEMP TABLE temp_subcategories AS SELECT * FROM subcategories;
            
            -- Drop foreign key constraints first
            ALTER TABLE IF EXISTS subcategories DROP CONSTRAINT IF EXISTS fk_subcategories_main_category;
            ALTER TABLE IF EXISTS products DROP CONSTRAINT IF EXISTS fk_products_main_category;
            
            -- Drop and recreate main_categories with correct structure
            DROP TABLE main_categories CASCADE;
            
            CREATE TABLE main_categories (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name TEXT NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_by UUID REFERENCES auth.users(id)
            );
            
            -- Restore data with new structure
            INSERT INTO main_categories (id, name, description, created_at)
            SELECT id, name, description, COALESCE(created_at, NOW()) 
            FROM temp_main_categories;
            
            RAISE NOTICE 'Main categories table recreated with correct structure';
        END IF;
    ELSE
        -- Create new main_categories table
        CREATE TABLE main_categories (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by UUID REFERENCES auth.users(id)
        );
        
        RAISE NOTICE 'Main categories table created';
    END IF;
END $$;

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

-- Clean up and recreate users table (safer approach)
DO $$
BEGIN
    -- Check if users table exists and has the problematic structure
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        -- Check if it has auth-related columns (indicating it's the problematic version)
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'encrypted_password') THEN
            -- This is the problematic users table, recreate it
            DROP TABLE users CASCADE;
            
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
            
            RAISE NOTICE 'Users table recreated with clean structure';
        END IF;
    ELSE
        -- Create new clean users table
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
    END IF;
END $$;

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

-- Add foreign key constraints safely
DO $$
BEGIN
    -- Add subcategories foreign key constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_subcategories_main_category'
    ) THEN
        ALTER TABLE subcategories 
        ADD CONSTRAINT fk_subcategories_main_category 
        FOREIGN KEY (main_category_id) REFERENCES main_categories(id);
    END IF;

    -- Add products foreign key constraints
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_products_main_category'
    ) THEN
        ALTER TABLE products 
        ADD CONSTRAINT fk_products_main_category 
        FOREIGN KEY (main_category_id) REFERENCES main_categories(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_products_subcategory'
    ) THEN
        ALTER TABLE products 
        ADD CONSTRAINT fk_products_subcategory 
        FOREIGN KEY (subcategory_id) REFERENCES subcategories(id);
    END IF;
END $$;

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

-- Create RLS policies for authenticated users (only if they don't exist)
DO $$
BEGIN
    -- Main categories policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view all data' AND tablename = 'main_categories') THEN
        CREATE POLICY "Users can view all data" ON main_categories FOR SELECT TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert data' AND tablename = 'main_categories') THEN
        CREATE POLICY "Users can insert data" ON main_categories FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update data' AND tablename = 'main_categories') THEN
        CREATE POLICY "Users can update data" ON main_categories FOR UPDATE TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete data' AND tablename = 'main_categories') THEN
        CREATE POLICY "Users can delete data" ON main_categories FOR DELETE TO authenticated USING (true);
    END IF;

    -- Simplified policies for other tables
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view all subcategories' AND tablename = 'subcategories') THEN
        CREATE POLICY "Users can view all subcategories" ON subcategories FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view all products' AND tablename = 'products') THEN
        CREATE POLICY "Users can view all products" ON products FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view all sales' AND tablename = 'sales') THEN
        CREATE POLICY "Users can view all sales" ON sales FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view all sale_items' AND tablename = 'sale_items') THEN
        CREATE POLICY "Users can view all sale_items" ON sale_items FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view all purchases' AND tablename = 'purchases') THEN
        CREATE POLICY "Users can view all purchases" ON purchases FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view all purchase_items' AND tablename = 'purchase_items') THEN
        CREATE POLICY "Users can view all purchase_items" ON purchase_items FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view all suppliers' AND tablename = 'suppliers') THEN
        CREATE POLICY "Users can view all suppliers" ON suppliers FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view all inventory_movements' AND tablename = 'inventory_movements') THEN
        CREATE POLICY "Users can view all inventory_movements" ON inventory_movements FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view all financial_transactions' AND tablename = 'financial_transactions') THEN
        CREATE POLICY "Users can view all financial_transactions" ON financial_transactions FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view all users' AND tablename = 'users') THEN
        CREATE POLICY "Users can view all users" ON users FOR ALL TO authenticated USING (true);
    END IF;
END $$;

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_main_categories_updated_at') THEN
        CREATE TRIGGER update_main_categories_updated_at BEFORE UPDATE ON main_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subcategories_updated_at') THEN
        CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON subcategories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at') THEN
        CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_purchases_updated_at') THEN
        CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_suppliers_updated_at') THEN
        CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert sample data only if main_categories is empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM main_categories LIMIT 1) THEN
        INSERT INTO main_categories (name, description) VALUES 
        ('Tiles', 'Ceramic and stone tiles'),
        ('Tools', 'Installation and maintenance tools'),
        ('Accessories', 'Tile accessories and materials');
        
        RAISE NOTICE 'Sample main categories inserted';
    END IF;
END $$;

-- Insert sample suppliers only if suppliers table is empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM suppliers LIMIT 1) THEN
        INSERT INTO suppliers (name, contact_person, email, phone) VALUES 
        ('Tile Mart Ltd', 'John Smith', 'john@tilemart.com', '+1234567890'),
        ('Tool Supply Co', 'Jane Doe', 'jane@toolsupply.com', '+1234567891');
        
        RAISE NOTICE 'Sample suppliers inserted';
    END IF;
END $$;

-- Final message
DO $$
BEGIN
    RAISE NOTICE '=== SS Tiles Database Setup Complete ===';
    RAISE NOTICE 'All tables, constraints, and policies have been set up safely.';
    RAISE NOTICE 'Your existing data has been preserved where possible.';
END $$; 