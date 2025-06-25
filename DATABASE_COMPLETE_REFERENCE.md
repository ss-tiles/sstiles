# SS Tiles Inventory Management System - Complete Database Reference

**Project:** SS Tiles Inventory Management System  
**Database:** Supabase PostgreSQL  
**Created:** December 2024  
**Author:** Milind Ranjan  

---

## Table of Contents

1. [Database Overview](#database-overview)
2. [Complete Database Schema](#complete-database-schema)
3. [Table Definitions](#table-definitions)
4. [Relationships & Foreign Keys](#relationships--foreign-keys)
5. [Setup Scripts](#setup-scripts)
6. [TypeScript Types](#typescript-types)
7. [Row Level Security (RLS) Policies](#row-level-security-rls-policies)
8. [Sample Data](#sample-data)
9. [Common Queries](#common-queries)
10. [Migration Scripts](#migration-scripts)

---

## Database Overview

The SS Tiles Inventory Management System uses a Supabase PostgreSQL database with the following core functionality:

- **Product Management**: Categories, subcategories, and products with stock tracking
- **Sales Management**: Complete sales transactions with line items
- **Purchase Management**: Purchase orders and supplier management
- **Inventory Tracking**: Real-time stock movements and audit trails
- **Financial Tracking**: Transaction-level financial records
- **User Management**: Authentication and role-based access

---

## Complete Database Schema

```sql
-- SS Tiles Inventory Management Database Schema
-- Complete table structure with all relationships

-- ============================================================================
-- AUTHENTICATION & USERS
-- ============================================================================

-- Users table (extends Supabase auth.users)
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

-- ============================================================================
-- PRODUCT CATALOG
-- ============================================================================

-- Main categories for products
CREATE TABLE main_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Subcategories under main categories
CREATE TABLE subcategories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    main_category_id UUID REFERENCES main_categories(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Products with complete details
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    description TEXT,
    main_category_id UUID REFERENCES main_categories(id) ON DELETE SET NULL,
    subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    cost_price NUMERIC(10,2) DEFAULT 0,
    quantity INTEGER DEFAULT 0,
    minimum_quantity INTEGER DEFAULT 0,
    maximum_quantity INTEGER,
    unit_of_measure TEXT DEFAULT 'pcs',
    barcode TEXT,
    location TEXT,
    supplier_sku TEXT,
    weight NUMERIC(8,2),
    dimensions TEXT,
    color TEXT,
    size TEXT,
    material TEXT,
    brand TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- SUPPLIER MANAGEMENT
-- ============================================================================

-- Suppliers for purchase management
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'India',
    tax_number TEXT, -- GST number
    payment_terms TEXT,
    credit_limit NUMERIC(10,2),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- PURCHASE MANAGEMENT
-- ============================================================================

-- Purchase orders from suppliers
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_number TEXT UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    total_amount NUMERIC(10,2) DEFAULT 0,
    tax_amount NUMERIC(10,2) DEFAULT 0,
    discount_amount NUMERIC(10,2) DEFAULT 0,
    shipping_amount NUMERIC(10,2) DEFAULT 0,
    net_amount NUMERIC(10,2) DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, received, cancelled, partial
    payment_status TEXT DEFAULT 'unpaid', -- paid, unpaid, partial
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expected_delivery_date TIMESTAMP WITH TIME ZONE,
    received_date TIMESTAMP WITH TIME ZONE,
    invoice_number TEXT,
    reference_number TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Individual items within purchase orders
CREATE TABLE purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_cost NUMERIC(10,2) NOT NULL,
    total_cost NUMERIC(10,2) NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    tax_rate NUMERIC(5,2) DEFAULT 0,
    discount_rate NUMERIC(5,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SALES MANAGEMENT
-- ============================================================================

-- Sales transactions
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_number TEXT UNIQUE NOT NULL,
    customer_name TEXT,
    customer_contact TEXT,
    customer_email TEXT,
    customer_address TEXT,
    total_amount NUMERIC(10,2) DEFAULT 0,
    tax_amount NUMERIC(10,2) DEFAULT 0,
    discount_amount NUMERIC(10,2) DEFAULT 0,
    net_amount NUMERIC(10,2) DEFAULT 0,
    payment_method TEXT DEFAULT 'cash', -- cash, card, upi, bank_transfer, credit
    payment_status TEXT DEFAULT 'completed', -- completed, pending, partial, failed
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invoice_number TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Individual items within sales
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    discount_rate NUMERIC(5,2) DEFAULT 0,
    tax_rate NUMERIC(5,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INVENTORY TRACKING
-- ============================================================================

-- Track all inventory movements for audit trail
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL, -- in, out, adjustment, transfer
    quantity INTEGER NOT NULL, -- positive for in, negative for out
    reference_type TEXT, -- sale, purchase, adjustment, transfer, return
    reference_id UUID, -- reference to sale_id, purchase_id, etc.
    from_location TEXT,
    to_location TEXT,
    unit_cost NUMERIC(10,2),
    total_cost NUMERIC(10,2),
    movement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- FINANCIAL TRACKING
-- ============================================================================

-- Track all financial transactions
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_type TEXT NOT NULL, -- sale, purchase, adjustment, expense, payment, receipt
    reference_type TEXT, -- sale, purchase, manual, payment, receipt
    reference_id UUID, -- reference to sale_id, purchase_id, etc.
    amount NUMERIC(10,2) NOT NULL,
    description TEXT,
    account_type TEXT, -- revenue, expense, asset, liability
    payment_method TEXT, -- cash, card, bank_transfer, cheque, upi
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- CONFIGURATION
-- ============================================================================

-- Application configuration settings
CREATE TABLE app_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    data_type TEXT DEFAULT 'string', -- string, number, boolean, json
    category TEXT DEFAULT 'general',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- User-specific profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    address TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Table Definitions

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User management and authentication | id, name, email, role |
| `main_categories` | Product main categories | id, name, description |
| `subcategories` | Product subcategories | id, name, main_category_id |
| `products` | Product catalog | id, name, sku, price, quantity |
| `suppliers` | Supplier directory | id, name, contact_person, email |
| `purchases` | Purchase orders | id, purchase_number, supplier_id, total_amount |
| `purchase_items` | Purchase order line items | id, purchase_id, product_id, quantity |
| `sales` | Sales transactions | id, sale_number, customer_name, total_amount |
| `sale_items` | Sales line items | id, sale_id, product_id, quantity |
| `inventory_movements` | Stock movement audit trail | id, product_id, movement_type, quantity |
| `financial_transactions` | Financial audit trail | id, transaction_type, amount, reference_id |

### Configuration Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `app_config` | System configuration | key, value, description |
| `profiles` | User profiles | id, full_name, preferences |

---

## Relationships & Foreign Keys

```sql
-- Foreign Key Relationships

-- Subcategories -> Main Categories
ALTER TABLE subcategories 
ADD CONSTRAINT subcategories_main_category_id_fkey 
FOREIGN KEY (main_category_id) REFERENCES main_categories(id) ON DELETE CASCADE;

-- Products -> Categories
ALTER TABLE products 
ADD CONSTRAINT products_main_category_id_fkey 
FOREIGN KEY (main_category_id) REFERENCES main_categories(id) ON DELETE SET NULL;

ALTER TABLE products 
ADD CONSTRAINT products_subcategory_id_fkey 
FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL;

-- Purchases -> Suppliers
ALTER TABLE purchases 
ADD CONSTRAINT purchases_supplier_id_fkey 
FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

-- Purchase Items -> Purchases & Products
ALTER TABLE purchase_items 
ADD CONSTRAINT purchase_items_purchase_id_fkey 
FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE;

ALTER TABLE purchase_items 
ADD CONSTRAINT purchase_items_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Sale Items -> Sales & Products
ALTER TABLE sale_items 
ADD CONSTRAINT sale_items_sale_id_fkey 
FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE;

ALTER TABLE sale_items 
ADD CONSTRAINT sale_items_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Inventory Movements -> Products
ALTER TABLE inventory_movements 
ADD CONSTRAINT inventory_movements_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- All tables -> Users (created_by)
ALTER TABLE main_categories ADD CONSTRAINT main_categories_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE subcategories ADD CONSTRAINT subcategories_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE products ADD CONSTRAINT products_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE suppliers ADD CONSTRAINT suppliers_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE purchases ADD CONSTRAINT purchases_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE sales ADD CONSTRAINT sales_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE inventory_movements ADD CONSTRAINT inventory_movements_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE financial_transactions ADD CONSTRAINT financial_transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
```

---

## Setup Scripts

### 1. Complete Database Setup

```sql
-- database_setup_complete.sql
-- Complete setup script for SS Tiles Inventory Management System

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create all tables (use the schema definition above)
-- ... [All CREATE TABLE statements from schema section] ...

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_main_category ON products(main_category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_number ON sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_name);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchases_number ON purchases(purchase_number);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product_id ON purchase_items(product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON inventory_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date);

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
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_config_updated_at BEFORE UPDATE ON app_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Row Level Security Setup

```sql
-- Enable RLS on all tables
ALTER TABLE main_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view all data" ON main_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert data" ON main_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update data" ON main_categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete data" ON main_categories FOR DELETE TO authenticated USING (true);

-- Apply similar policies to all other tables
-- (Repeat for all tables with appropriate access controls)
```

---

## TypeScript Types

```typescript
// src/types/database.ts
// Complete TypeScript interface definitions

export interface Database {
  public: {
    Tables: {
      main_categories: {
        Row: MainCategory;
        Insert: Omit<MainCategory, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<MainCategory>;
      };
      subcategories: {
        Row: Subcategory;
        Insert: Omit<Subcategory, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Subcategory>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Product>;
      };
      suppliers: {
        Row: Supplier;
        Insert: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Supplier>;
      };
      purchases: {
        Row: Purchase;
        Insert: Omit<Purchase, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Purchase>;
      };
      purchase_items: {
        Row: PurchaseItem;
        Insert: Omit<PurchaseItem, 'id' | 'created_at'>;
        Update: Partial<PurchaseItem>;
      };
      sales: {
        Row: Sale;
        Insert: Omit<Sale, 'id' | 'created_at'>;
        Update: Partial<Sale>;
      };
      sale_items: {
        Row: SaleItem;
        Insert: Omit<SaleItem, 'id' | 'created_at'>;
        Update: Partial<SaleItem>;
      };
      inventory_movements: {
        Row: InventoryMovement;
        Insert: Omit<InventoryMovement, 'id' | 'created_at'>;
        Update: Partial<InventoryMovement>;
      };
      financial_transactions: {
        Row: FinancialTransaction;
        Insert: Omit<FinancialTransaction, 'id' | 'created_at'>;
        Update: Partial<FinancialTransaction>;
      };
      users: {
        Row: User;
        Insert: Omit<User, 'created_at' | 'updated_at'>;
        Update: Partial<User>;
      };
      app_config: {
        Row: AppConfig;
        Insert: Omit<AppConfig, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<AppConfig>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Profile>;
      };
    };
  };
}

// Individual interface definitions
export interface MainCategory {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Subcategory {
  id: string;
  name: string;
  description?: string;
  main_category_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  main_category_id?: string;
  subcategory_id?: string;
  unit_price: number;
  cost_price?: number;
  quantity: number;
  minimum_quantity: number;
  maximum_quantity?: number;
  unit_of_measure: string;
  barcode?: string;
  location?: string;
  supplier_sku?: string;
  weight?: number;
  dimensions?: string;
  color?: string;
  size?: string;
  material?: string;
  brand?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  tax_number?: string;
  payment_terms?: string;
  credit_limit?: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Purchase {
  id: string;
  purchase_number: string;
  supplier_id?: string;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  shipping_amount: number;
  net_amount: number;
  status: 'pending' | 'received' | 'cancelled' | 'partial';
  payment_status: 'paid' | 'unpaid' | 'partial';
  purchase_date: string;
  expected_delivery_date?: string;
  received_date?: string;
  invoice_number?: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  received_quantity: number;
  tax_rate: number;
  discount_rate: number;
  notes?: string;
  created_at: string;
}

export interface Sale {
  id: string;
  sale_number: string;
  customer_name?: string;
  customer_contact?: string;
  customer_email?: string;
  customer_address?: string;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  net_amount: number;
  payment_method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'credit';
  payment_status: 'completed' | 'pending' | 'partial' | 'failed';
  sale_date: string;
  invoice_number?: string;
  notes?: string;
  created_at: string;
  created_by?: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_rate: number;
  tax_rate: number;
  notes?: string;
  created_at: string;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  movement_type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  reference_type?: 'sale' | 'purchase' | 'adjustment' | 'transfer' | 'return' | 'sale_deletion';
  reference_id?: string;
  from_location?: string;
  to_location?: string;
  unit_cost?: number;
  total_cost?: number;
  movement_date: string;
  notes?: string;
  created_at: string;
  created_by?: string;
}

export interface FinancialTransaction {
  id: string;
  transaction_type: 'sale' | 'purchase' | 'adjustment' | 'expense' | 'payment' | 'receipt';
  reference_type?: 'sale' | 'purchase' | 'manual' | 'payment' | 'receipt';
  reference_id?: string;
  amount: number;
  description?: string;
  account_type?: 'revenue' | 'expense' | 'asset' | 'liability';
  payment_method?: 'cash' | 'card' | 'bank_transfer' | 'cheque' | 'upi';
  transaction_date: string;
  created_at: string;
  created_by?: string;
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  role: 'user' | 'admin' | 'manager';
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface AppConfig {
  id: string;
  key: string;
  value?: string;
  description?: string;
  data_type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  address?: string;
  preferences: any;
  created_at: string;
  updated_at: string;
}
```

---

## Sample Data

```sql
-- Sample data for testing and development

-- Main Categories
INSERT INTO main_categories (name, description) VALUES 
('Tiles', 'Ceramic and stone tiles for flooring and walls'),
('Tools', 'Installation and maintenance tools'),
('Accessories', 'Tile accessories and installation materials'),
('Hardware', 'Hardware and fittings');

-- Subcategories (assuming main category IDs)
INSERT INTO subcategories (name, description, main_category_id) 
SELECT 'Floor Tiles', 'Tiles for floor installation', id FROM main_categories WHERE name = 'Tiles'
UNION ALL
SELECT 'Wall Tiles', 'Tiles for wall installation', id FROM main_categories WHERE name = 'Tiles'
UNION ALL
SELECT 'Hand Tools', 'Manual tools for installation', id FROM main_categories WHERE name = 'Tools'
UNION ALL
SELECT 'Power Tools', 'Electric tools for installation', id FROM main_categories WHERE name = 'Tools';

-- Suppliers
INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES 
('Tile Mart Ltd', 'John Smith', 'john@tilemart.com', '+91-9876543210', '123 Business District, Mumbai'),
('Tool Supply Co', 'Jane Doe', 'jane@toolsupply.com', '+91-9876543211', '456 Industrial Area, Delhi'),
('Premium Tiles Inc', 'Mike Johnson', 'mike@premiumtiles.com', '+91-9876543212', '789 Tile Street, Bangalore'),
('Builder Supply', 'Sarah Wilson', 'sarah@buildersupply.com', '+91-9876543213', '321 Construction Road, Chennai');

-- Sample Products
INSERT INTO products (name, sku, description, unit_price, cost_price, quantity, minimum_quantity) VALUES 
('Ceramic Floor Tile 24x24', 'CFT-2424-001', 'Premium ceramic floor tile 24 inch x 24 inch', 125.00, 95.00, 500, 50),
('Vitrified Wall Tile 12x18', 'VWT-1218-002', 'Glossy vitrified wall tile 12 inch x 18 inch', 85.00, 65.00, 300, 30),
('Tile Cutter Professional', 'TCT-PRO-003', 'Professional grade tile cutting tool', 2500.00, 2000.00, 25, 5),
('Tile Adhesive 20kg', 'ADH-20KG-004', 'Premium tile adhesive for ceramic tiles', 450.00, 350.00, 100, 20),
('Tile Spacers 2mm', 'TSP-2MM-005', 'Plastic tile spacers 2mm thickness', 25.00, 18.00, 200, 50);

-- App Configuration
INSERT INTO app_config (key, value, description, category, is_public) VALUES 
('company_name', 'SS Tiles', 'Company name for invoices and reports', 'company', true),
('company_address', 'Your Business Address Here', 'Company address for invoices', 'company', true),
('gst_number', 'YOUR_GST_NUMBER', 'GST registration number', 'company', false),
('default_currency', 'INR', 'Default currency for the application', 'general', true),
('low_stock_threshold', '10', 'Default threshold for low stock alerts', 'inventory', false),
('auto_generate_sku', 'true', 'Automatically generate SKU for new products', 'products', false);
```

---

## Common Queries

### Product & Inventory Queries

```sql
-- Get products with low stock
SELECT p.*, mc.name as main_category_name, sc.name as subcategory_name
FROM products p
LEFT JOIN main_categories mc ON p.main_category_id = mc.id
LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
WHERE p.quantity <= p.minimum_quantity
AND p.is_active = true
ORDER BY p.quantity ASC;

-- Get total inventory value
SELECT 
  SUM(quantity * unit_price) as total_retail_value,
  SUM(quantity * cost_price) as total_cost_value,
  COUNT(*) as total_products
FROM products 
WHERE is_active = true;

-- Product sales performance
SELECT 
  p.name,
  p.sku,
  SUM(si.quantity) as total_sold,
  SUM(si.total_price) as total_revenue,
  AVG(si.unit_price) as avg_selling_price
FROM products p
JOIN sale_items si ON p.id = si.product_id
JOIN sales s ON si.sale_id = s.id
WHERE s.sale_date >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.name, p.sku
ORDER BY total_revenue DESC;
```

### Sales & Revenue Queries

```sql
-- Daily sales summary
SELECT 
  DATE(sale_date) as sale_day,
  COUNT(*) as total_sales,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_order_value
FROM sales
WHERE sale_date >= NOW() - INTERVAL '30 days'
GROUP BY DATE(sale_date)
ORDER BY sale_day DESC;

-- Monthly revenue trend
SELECT 
  DATE_TRUNC('month', sale_date) as month,
  COUNT(*) as total_sales,
  SUM(total_amount) as revenue,
  COUNT(DISTINCT customer_name) as unique_customers
FROM sales
WHERE sale_date >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', sale_date)
ORDER BY month DESC;

-- Top customers by revenue
SELECT 
  customer_name,
  COUNT(*) as total_orders,
  SUM(total_amount) as total_spent,
  AVG(total_amount) as avg_order_value,
  MAX(sale_date) as last_purchase
FROM sales
WHERE customer_name IS NOT NULL
AND sale_date >= NOW() - INTERVAL '12 months'
GROUP BY customer_name
ORDER BY total_spent DESC
LIMIT 20;
```

### Inventory Movement Queries

```sql
-- Stock movement history for a product
SELECT 
  im.*,
  CASE 
    WHEN im.reference_type = 'sale' THEN s.sale_number
    WHEN im.reference_type = 'purchase' THEN p.purchase_number
    ELSE im.reference_id::text
  END as reference_number
FROM inventory_movements im
LEFT JOIN sales s ON im.reference_type = 'sale' AND im.reference_id = s.id::text
LEFT JOIN purchases p ON im.reference_type = 'purchase' AND im.reference_id = p.id::text
WHERE im.product_id = 'PRODUCT_ID_HERE'
ORDER BY im.movement_date DESC;

-- Daily inventory summary
SELECT 
  DATE(movement_date) as movement_day,
  movement_type,
  COUNT(*) as total_movements,
  SUM(ABS(quantity)) as total_quantity
FROM inventory_movements
WHERE movement_date >= NOW() - INTERVAL '30 days'
GROUP BY DATE(movement_date), movement_type
ORDER BY movement_day DESC, movement_type;
```

---

## Migration Scripts

### Fix Relationships (Emergency Script)

```sql
-- fix_relationships_safe.sql
-- Use this script if you encounter relationship ambiguity errors

-- Check existing constraints
SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE table_schema = 'public'
AND table_name IN ('products', 'subcategories', 'purchases', 'sale_items')
ORDER BY table_name, constraint_name;

-- Remove duplicate constraints if they exist
DO $$
BEGIN
    -- Clean up products table constraints
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_products_subcategory' AND table_name = 'products') THEN
        ALTER TABLE products DROP CONSTRAINT fk_products_subcategory;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_products_main_category' AND table_name = 'products') THEN
        ALTER TABLE products DROP CONSTRAINT fk_products_main_category;
    END IF;
    
    -- Recreate with standard names
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'products_subcategory_id_fkey' AND table_name = 'products') THEN
        ALTER TABLE products ADD CONSTRAINT products_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'products_main_category_id_fkey' AND table_name = 'products') THEN
        ALTER TABLE products ADD CONSTRAINT products_main_category_id_fkey FOREIGN KEY (main_category_id) REFERENCES main_categories(id) ON DELETE SET NULL;
    END IF;
END $$;
```

---

## Maintenance Commands

### Regular Maintenance

```sql
-- Vacuum and analyze tables (run periodically)
VACUUM ANALYZE products;
VACUUM ANALYZE sales;
VACUUM ANALYZE sale_items;
VACUUM ANALYZE inventory_movements;
VACUUM ANALYZE financial_transactions;

-- Update product quantities from inventory movements (reconciliation)
UPDATE products SET quantity = (
  SELECT COALESCE(SUM(quantity), 0)
  FROM inventory_movements 
  WHERE product_id = products.id
) WHERE id IN (SELECT DISTINCT product_id FROM inventory_movements);

-- Check data consistency
SELECT 'Products with negative quantity' as issue, COUNT(*) as count
FROM products WHERE quantity < 0
UNION ALL
SELECT 'Sales without items', COUNT(*)
FROM sales s LEFT JOIN sale_items si ON s.id = si.sale_id
WHERE si.id IS NULL
UNION ALL
SELECT 'Orphaned sale items', COUNT(*)
FROM sale_items si LEFT JOIN sales s ON si.sale_id = s.id
WHERE s.id IS NULL;
```

---

## Backup & Restore

```bash
# Backup database (using pg_dump)
pg_dump -h your-supabase-host -U postgres -d postgres --schema=public --data-only > sstiles_data_backup.sql

# Backup schema only
pg_dump -h your-supabase-host -U postgres -d postgres --schema=public --schema-only > sstiles_schema_backup.sql

# Full backup
pg_dump -h your-supabase-host -U postgres -d postgres --schema=public > sstiles_full_backup.sql
```

---

## Contact & Support

**Project Repository**: https://github.com/Milind-Ranjan/sstiles  
**Database Type**: Supabase PostgreSQL  
**Last Updated**: December 2024  

---

*This document contains the complete database reference for the SS Tiles Inventory Management System. Keep this file updated as the schema evolves.* 