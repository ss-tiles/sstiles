# Database Schema Documentation

## Overview
This document outlines the database schema for the SS Tiles Inventory Management System built with Supabase.

## Tables

### 1. app_config
Configuration settings for the application.

| Column Name  | Data Type                | Description |
|--------------|--------------------------|-------------|
| id           | integer                  | Primary key |
| config_key   | text                     | Configuration key name |
| config_value | text                     | Configuration value |
| created_at   | timestamp with time zone | Record creation timestamp |
| updated_at   | timestamp with time zone | Record update timestamp |

**Purpose**: Store application-wide configuration settings like company info, tax rates, etc.

### 2. profiles
User profile information (extends Supabase auth.users).

| Column Name | Data Type                | Description |
|-------------|--------------------------|-------------|
| id          | uuid                     | Primary key (references auth.users.id) |
| name        | text                     | User full name |
| email       | text                     | User email address |
| last_login  | timestamp with time zone | Last login timestamp |
| created_at  | timestamp with time zone | Profile creation timestamp |
| updated_at  | timestamp with time zone | Profile update timestamp |

**Purpose**: Extended user information beyond Supabase auth.

### 3. main_categories
Top-level product categories.

| Column Name | Data Type                | Description |
|-------------|--------------------------|-------------|
| id          | uuid                     | Primary key |
| name        | text                     | Category name |
| description | text                     | Category description |
| is_active   | boolean                  | Whether category is active |
| created_at  | timestamp with time zone | Record creation timestamp |
| updated_at  | timestamp with time zone | Record update timestamp |
| created_by  | uuid                     | User who created the record |

**Purpose**: Organize products into main categories (e.g., Tiles, Tools, Accessories).

### 4. subcategories
Sub-level product categories.

| Column Name      | Data Type                | Description |
|------------------|--------------------------|-------------|
| id               | uuid                     | Primary key |
| main_category_id | uuid                     | Foreign key to main_categories |
| name             | text                     | Subcategory name |
| description      | text                     | Subcategory description |
| attribute_schema | jsonb                    | JSON schema for product attributes |
| created_at       | timestamp with time zone | Record creation timestamp |
| updated_at       | timestamp with time zone | Record update timestamp |
| created_by       | uuid                     | User who created the record |

**Purpose**: Further categorize products within main categories.

### 5. products
Product inventory items.

| Column Name      | Data Type                | Description |
|------------------|--------------------------|-------------|
| id               | uuid                     | Primary key |
| name             | text                     | Product name |
| sku              | text                     | Stock Keeping Unit (unique) |
| main_category_id | uuid                     | Foreign key to main_categories |
| subcategory_id   | uuid                     | Foreign key to subcategories |
| attributes       | jsonb                    | Product-specific attributes |
| quantity         | integer                  | Current stock quantity |
| unit_price       | numeric                  | Price per unit |
| reorder_level    | integer                  | Minimum stock level for reordering |
| supplier         | text                     | Supplier information |
| notes            | text                     | Additional notes |
| created_at       | timestamp with time zone | Record creation timestamp |
| updated_at       | timestamp with time zone | Record update timestamp |
| created_by       | uuid                     | User who created the record |

**Purpose**: Store all product information and current inventory levels.

### 6. sales
Sales transaction records.

| Column Name      | Data Type                | Description |
|------------------|--------------------------|-------------|
| id               | uuid                     | Primary key |
| sale_number      | text                     | Unique sale number |
| customer_name    | text                     | Customer name |
| customer_contact | text                     | Customer contact info |
| total_amount     | numeric                  | Total sale amount |
| payment_method   | text                     | Payment method used |
| payment_status   | text                     | Payment status (paid, pending, etc.) |
| notes            | text                     | Sale notes |
| sale_date        | timestamp with time zone | Date of sale |
| created_at       | timestamp with time zone | Record creation timestamp |
| created_by       | uuid                     | User who created the sale |

**Purpose**: Track all sales transactions.

### 7. sale_items
Individual items within a sale.

| Column Name | Data Type                | Description |
|-------------|--------------------------|-------------|
| id          | uuid                     | Primary key |
| sale_id     | uuid                     | Foreign key to sales |
| product_id  | uuid                     | Foreign key to products |
| quantity    | integer                  | Quantity sold |
| unit_price  | numeric                  | Price per unit at time of sale |
| total_price | numeric                  | Total price for this line item |
| created_at  | timestamp with time zone | Record creation timestamp |

**Purpose**: Track individual products sold in each transaction.

### 8. inventory_movements
Track all inventory movements (in/out).

| Column Name    | Data Type                | Description |
|----------------|--------------------------|-------------|
| id             | uuid                     | Primary key |
| product_id     | uuid                     | Foreign key to products |
| movement_type  | text                     | Type: 'in', 'out', 'adjustment' |
| quantity       | integer                  | Quantity moved (positive/negative) |
| reference_type | text                     | Reference type: 'sale', 'purchase', 'adjustment' |
| reference_id   | uuid                     | Reference to related transaction |
| notes          | text                     | Movement notes |
| movement_date  | timestamp with time zone | Date of movement |
| created_by     | uuid                     | User who created the movement |

**Purpose**: Audit trail for all inventory changes.

## Missing Tables (To Be Created)

### 9. purchases
Purchase orders from suppliers.

### 10. purchase_items
Individual items in purchase orders.

### 11. suppliers
Supplier information.

## Relationships

- `profiles.id` → `auth.users.id` (1:1)
- `subcategories.main_category_id` → `main_categories.id` (N:1)
- `products.main_category_id` → `main_categories.id` (N:1)
- `products.subcategory_id` → `subcategories.id` (N:1)
- `sale_items.sale_id` → `sales.id` (N:1)
- `sale_items.product_id` → `products.id` (N:1)
- `inventory_movements.product_id` → `products.id` (N:1)

## Indexes

Recommended indexes for performance:
- `products.sku` (unique)
- `products.main_category_id`
- `products.subcategory_id`
- `sale_items.sale_id`
- `sale_items.product_id`
- `inventory_movements.product_id`
- `inventory_movements.movement_date` 