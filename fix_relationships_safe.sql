-- Fix Duplicate Foreign Key Relationships (SAFE VERSION)
-- Run this in your Supabase SQL Editor to fix the relationship ambiguity

-- First, let's see what foreign key constraints exist
DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_schema = 'public';
    
    RAISE NOTICE 'Found % existing foreign key constraints', constraint_count;
END $$;

-- Drop potentially duplicate foreign key constraints that might be causing issues
DO $$
BEGIN
    -- Drop subcategories constraints
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'subcategories_main_category_id_fkey' AND table_name = 'subcategories') THEN
        ALTER TABLE subcategories DROP CONSTRAINT subcategories_main_category_id_fkey;
        RAISE NOTICE 'Dropped existing subcategories_main_category_id_fkey';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_subcategories_main_category' AND table_name = 'subcategories') THEN
        ALTER TABLE subcategories DROP CONSTRAINT fk_subcategories_main_category;
        RAISE NOTICE 'Dropped existing fk_subcategories_main_category';
    END IF;

    -- Drop products constraints
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'products_main_category_id_fkey' AND table_name = 'products') THEN
        ALTER TABLE products DROP CONSTRAINT products_main_category_id_fkey;
        RAISE NOTICE 'Dropped existing products_main_category_id_fkey';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_products_main_category' AND table_name = 'products') THEN
        ALTER TABLE products DROP CONSTRAINT fk_products_main_category;
        RAISE NOTICE 'Dropped existing fk_products_main_category';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'products_subcategory_id_fkey' AND table_name = 'products') THEN
        ALTER TABLE products DROP CONSTRAINT products_subcategory_id_fkey;
        RAISE NOTICE 'Dropped existing products_subcategory_id_fkey';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_products_subcategory' AND table_name = 'products') THEN
        ALTER TABLE products DROP CONSTRAINT fk_products_subcategory;
        RAISE NOTICE 'Dropped existing fk_products_subcategory';
    END IF;
END $$;

-- Now recreate the foreign key constraints with proper names (only if they don't exist)
DO $$
BEGIN
    -- Subcategories to main_categories
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'subcategories_main_category_id_fkey' AND table_name = 'subcategories') THEN
        ALTER TABLE subcategories 
        ADD CONSTRAINT subcategories_main_category_id_fkey 
        FOREIGN KEY (main_category_id) REFERENCES main_categories(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added subcategories_main_category_id_fkey';
    END IF;

    -- Products to main_categories
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'products_main_category_id_fkey' AND table_name = 'products') THEN
        ALTER TABLE products 
        ADD CONSTRAINT products_main_category_id_fkey 
        FOREIGN KEY (main_category_id) REFERENCES main_categories(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added products_main_category_id_fkey';
    END IF;

    -- Products to subcategories
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'products_subcategory_id_fkey' AND table_name = 'products') THEN
        ALTER TABLE products 
        ADD CONSTRAINT products_subcategory_id_fkey 
        FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added products_subcategory_id_fkey';
    END IF;

    -- Sales constraints
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'sales_created_by_fkey' AND table_name = 'sales') THEN
        ALTER TABLE sales 
        ADD CONSTRAINT sales_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added sales_created_by_fkey';
    END IF;

    -- Sale items constraints
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'sale_items_sale_id_fkey' AND table_name = 'sale_items') THEN
        ALTER TABLE sale_items 
        ADD CONSTRAINT sale_items_sale_id_fkey 
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added sale_items_sale_id_fkey';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'sale_items_product_id_fkey' AND table_name = 'sale_items') THEN
        ALTER TABLE sale_items 
        ADD CONSTRAINT sale_items_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added sale_items_product_id_fkey';
    END IF;

    -- Inventory movements constraints
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'inventory_movements_product_id_fkey' AND table_name = 'inventory_movements') THEN
        ALTER TABLE inventory_movements 
        ADD CONSTRAINT inventory_movements_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added inventory_movements_product_id_fkey';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'inventory_movements_created_by_fkey' AND table_name = 'inventory_movements') THEN
        ALTER TABLE inventory_movements 
        ADD CONSTRAINT inventory_movements_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added inventory_movements_created_by_fkey';
    END IF;

    -- Purchases constraints (only if tables exist)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchases' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'purchases_supplier_id_fkey' AND table_name = 'purchases') THEN
            ALTER TABLE purchases 
            ADD CONSTRAINT purchases_supplier_id_fkey 
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added purchases_supplier_id_fkey';
        ELSE
            RAISE NOTICE 'purchases_supplier_id_fkey already exists';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'purchases_created_by_fkey' AND table_name = 'purchases') THEN
            ALTER TABLE purchases 
            ADD CONSTRAINT purchases_created_by_fkey 
            FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added purchases_created_by_fkey';
        ELSE
            RAISE NOTICE 'purchases_created_by_fkey already exists';
        END IF;
    END IF;

    -- Purchase items constraints (only if tables exist)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_items' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'purchase_items_purchase_id_fkey' AND table_name = 'purchase_items') THEN
            ALTER TABLE purchase_items 
            ADD CONSTRAINT purchase_items_purchase_id_fkey 
            FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added purchase_items_purchase_id_fkey';
        ELSE
            RAISE NOTICE 'purchase_items_purchase_id_fkey already exists';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'purchase_items_product_id_fkey' AND table_name = 'purchase_items') THEN
            ALTER TABLE purchase_items 
            ADD CONSTRAINT purchase_items_product_id_fkey 
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added purchase_items_product_id_fkey';
        ELSE
            RAISE NOTICE 'purchase_items_product_id_fkey already exists';
        END IF;
    END IF;

    -- Suppliers constraints (only if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'suppliers_created_by_fkey' AND table_name = 'suppliers') THEN
            ALTER TABLE suppliers 
            ADD CONSTRAINT suppliers_created_by_fkey 
            FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added suppliers_created_by_fkey';
        ELSE
            RAISE NOTICE 'suppliers_created_by_fkey already exists';
        END IF;
    END IF;

    -- Financial transactions constraints (only if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_transactions' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'financial_transactions_created_by_fkey' AND table_name = 'financial_transactions') THEN
            ALTER TABLE financial_transactions 
            ADD CONSTRAINT financial_transactions_created_by_fkey 
            FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added financial_transactions_created_by_fkey';
        ELSE
            RAISE NOTICE 'financial_transactions_created_by_fkey already exists';
        END IF;
    END IF;
END $$;

-- Verify no duplicate constraints exist
DO $$
DECLARE
    constraint_count INTEGER;
    products_subcategory_count INTEGER;
BEGIN
    -- Check for duplicate foreign key constraints
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_schema = 'public';
    
    RAISE NOTICE 'Total foreign key constraints after cleanup: %', constraint_count;
    
    -- Check specific products-subcategories relationship
    SELECT COUNT(*) INTO products_subcategory_count
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_name = 'products'
    AND constraint_name LIKE '%subcategory%';
    
    IF products_subcategory_count > 1 THEN
        RAISE WARNING 'Still have % subcategory constraints on products table!', products_subcategory_count;
    ELSE
        RAISE NOTICE 'Products-subcategories relationship is clean (%)', products_subcategory_count;
    END IF;
    
    -- Check products-main_categories relationship
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_name = 'products'
    AND constraint_name LIKE '%main_category%';
    
    IF constraint_count > 1 THEN
        RAISE WARNING 'Still have % main_category constraints on products table!', constraint_count;
    ELSE
        RAISE NOTICE 'Products-main_categories relationship is clean (%)', constraint_count;
    END IF;
END $$;

-- Final verification message
DO $$
BEGIN
    RAISE NOTICE '=== Foreign Key Relationships Fixed Safely ===';
    RAISE NOTICE 'The duplicate relationship issue should now be resolved.';
    RAISE NOTICE 'Your Products and Transactions pages should work properly.';
    RAISE NOTICE 'Please refresh your application and test the functionality.';
END $$; 