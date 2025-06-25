-- Fix Duplicate Foreign Key Relationships
-- Run this in your Supabase SQL Editor to fix the relationship ambiguity

-- First, let's see what foreign key constraints exist
-- Run this to check existing constraints:
-- SELECT constraint_name, table_name, column_name, foreign_table_name, foreign_column_name 
-- FROM information_schema.key_column_usage 
-- WHERE constraint_schema = 'public' 
-- AND referenced_table_name IS NOT NULL;

-- Drop all existing foreign key constraints that might be causing issues
ALTER TABLE subcategories DROP CONSTRAINT IF EXISTS subcategories_main_category_id_fkey;
ALTER TABLE subcategories DROP CONSTRAINT IF EXISTS fk_subcategories_main_category;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_main_category_id_fkey;
ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_main_category;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_subcategory_id_fkey;
ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_subcategory;

ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_created_by_fkey;
ALTER TABLE sale_items DROP CONSTRAINT IF EXISTS sale_items_sale_id_fkey;
ALTER TABLE sale_items DROP CONSTRAINT IF EXISTS sale_items_product_id_fkey;

ALTER TABLE inventory_movements DROP CONSTRAINT IF EXISTS inventory_movements_product_id_fkey;
ALTER TABLE inventory_movements DROP CONSTRAINT IF EXISTS inventory_movements_created_by_fkey;

-- Now recreate the foreign key constraints with proper names (one each)
ALTER TABLE subcategories 
ADD CONSTRAINT subcategories_main_category_id_fkey 
FOREIGN KEY (main_category_id) REFERENCES main_categories(id) ON DELETE CASCADE;

ALTER TABLE products 
ADD CONSTRAINT products_main_category_id_fkey 
FOREIGN KEY (main_category_id) REFERENCES main_categories(id) ON DELETE SET NULL;

ALTER TABLE products 
ADD CONSTRAINT products_subcategory_id_fkey 
FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL;

-- Add missing foreign keys for other tables
ALTER TABLE sales 
ADD CONSTRAINT sales_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE sale_items 
ADD CONSTRAINT sale_items_sale_id_fkey 
FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE;

ALTER TABLE sale_items 
ADD CONSTRAINT sale_items_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE inventory_movements 
ADD CONSTRAINT inventory_movements_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE inventory_movements 
ADD CONSTRAINT inventory_movements_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add foreign keys for new tables
ALTER TABLE purchases 
ADD CONSTRAINT purchases_supplier_id_fkey 
FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

ALTER TABLE purchases 
ADD CONSTRAINT purchases_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE purchase_items 
ADD CONSTRAINT purchase_items_purchase_id_fkey 
FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE;

ALTER TABLE purchase_items 
ADD CONSTRAINT purchase_items_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE suppliers 
ADD CONSTRAINT suppliers_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE financial_transactions 
ADD CONSTRAINT financial_transactions_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Verify no duplicate constraints exist
DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    -- Check for duplicate foreign key constraints
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_schema = 'public';
    
    RAISE NOTICE 'Total foreign key constraints: %', constraint_count;
    
    -- Check specific relationships
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_name = 'products'
    AND constraint_name LIKE '%subcategory%';
    
    IF constraint_count > 1 THEN
        RAISE WARNING 'Multiple subcategory constraints found on products table!';
    ELSE
        RAISE NOTICE 'Products-subcategories relationship is clean';
    END IF;
END $$;

-- Final verification message
DO $$
BEGIN
    RAISE NOTICE '=== Foreign Key Relationships Fixed ===';
    RAISE NOTICE 'The duplicate relationship issue should now be resolved.';
    RAISE NOTICE 'Your Products and Transactions pages should work properly.';
END $$; 