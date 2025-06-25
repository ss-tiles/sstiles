# SS Tiles Inventory Management - Setup Guide

## 🚀 Database Setup

### Step 1: Run Database Migrations
1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to**: SQL Editor
3. **Copy and paste** the contents of `database_setup.sql`
4. **Execute the script**

### Step 2: Verify Tables Created
After running the script, verify these tables exist:
- ✅ `main_categories` (fixed structure)
- ✅ `subcategories`
- ✅ `products`
- ✅ `suppliers` (new)
- ✅ `purchases` (new)
- ✅ `purchase_items` (new)
- ✅ `sales`
- ✅ `sale_items`
- ✅ `inventory_movements`
- ✅ `financial_transactions` (new)
- ✅ `users` (cleaned up)
- ✅ `profiles`

## 🔧 New Features Added

### 1. Purchase Order Management
- **Location**: `/purchases`
- **Features**:
  - Create/edit purchase orders
  - Track supplier information
  - Monitor order status (pending, received, cancelled)
  - Payment status tracking
  - Auto-generated PO numbers

### 2. Supplier Management
- **Location**: `/suppliers`
- **Features**:
  - Add/edit supplier details
  - Contact information management
  - Tax number and payment terms
  - Active/inactive status
  - Complete supplier directory

### 3. Enhanced Financial Tracking
- **New Table**: `financial_transactions`
- **Purpose**: Track all financial movements
- **Integration**: Automatically logs sales and purchases

### 4. Improved Inventory Management
- **Enhanced**: `inventory_movements` table
- **Features**: Better tracking of stock changes
- **References**: Links to sales, purchases, adjustments

## 📱 Frontend Updates

### New Pages Added:
1. **Purchases Page** (`/purchases`)
   - Material-UI components
   - CRUD operations for purchase orders
   - Supplier integration
   - Status management

2. **Suppliers Page** (`/suppliers`)
   - Complete supplier management
   - Contact information
   - Active/inactive toggling

### Navigation Updates:
- Added "Purchases" menu item
- Added "Suppliers" menu item
- Updated sidebar with new icons

## 🔗 Database Relationships

```
suppliers -> purchases (1:N)
purchases -> purchase_items (1:N)
purchase_items -> products (N:1)
products -> inventory_movements (1:N)
sales -> sale_items (1:N)
sale_items -> products (N:1)
main_categories -> subcategories (1:N)
main_categories -> products (1:N)
subcategories -> products (1:N)
```

## 🛠️ TypeScript Integration

### New Types Available:
```typescript
import { 
  Purchase, 
  PurchaseInsert, 
  Supplier, 
  SupplierInsert,
  FinancialTransaction 
} from './types/database';
```

### Enhanced Supabase Client:
- Fully typed with database schema
- Type-safe queries and operations
- IntelliSense support

## 📋 Sample Data

The setup script includes sample data:
- **Main Categories**: Tiles, Tools, Accessories
- **Suppliers**: Tile Mart Ltd, Tool Supply Co

## 🚨 Important Notes

### Before Running Setup:
1. **Backup existing data** if you have any
2. The script will **drop and recreate** the `main_categories` table
3. The script will **drop and recreate** the `users` table

### Row Level Security (RLS):
- All tables have RLS enabled
- Policies allow authenticated users full access
- Modify policies for production use

### Indexes:
- Performance indexes added for common queries
- Foreign key constraints established
- Triggers for `updated_at` columns

## 🎯 Next Steps

### 1. Test the Application:
```bash
npm start
```

### 2. Add Sample Data:
- Create some suppliers
- Add purchase orders
- Test the workflow

### 3. Customize for Your Business:
- Modify categories and subcategories
- Adjust product attributes schema
- Configure payment terms

### 4. Production Considerations:
- Review and tighten RLS policies
- Set up proper user roles
- Configure backup strategies
- Monitor performance

## 📞 Support

If you encounter any issues:
1. Check browser console for errors
2. Verify Supabase connection
3. Ensure all environment variables are set
4. Check table permissions in Supabase

## 🔄 Workflow Example

1. **Add Suppliers** → Go to `/suppliers`
2. **Create Purchase Orders** → Go to `/purchases`
3. **Receive Inventory** → Update purchase status
4. **Sell Products** → Use existing `/transactions`
5. **Track Movement** → Automatic via `inventory_movements`
6. **Monitor Finances** → Via `financial_transactions`

Your inventory management system is now ready with complete purchase order and supplier management capabilities! 🎉 