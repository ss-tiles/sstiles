export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      app_config: {
        Row: {
          id: number
          config_key: string
          config_value: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          config_key: string
          config_value: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          config_key?: string
          config_value?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string | null
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      main_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      subcategories: {
        Row: {
          id: string
          main_category_id: string
          name: string
          description: string | null
          attribute_schema: Json | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          main_category_id: string
          name: string
          description?: string | null
          attribute_schema?: Json | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          main_category_id?: string
          name?: string
          description?: string | null
          attribute_schema?: Json | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      products: {
        Row: {
          id: string
          name: string
          sku: string
          main_category_id: string
          subcategory_id: string | null
          attributes: Json | null
          quantity: number
          unit_price: number
          reorder_level: number | null
          supplier: string | null
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          sku: string
          main_category_id: string
          subcategory_id?: string | null
          attributes?: Json | null
          quantity?: number
          unit_price: number
          reorder_level?: number | null
          supplier?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          sku?: string
          main_category_id?: string
          subcategory_id?: string | null
          attributes?: Json | null
          quantity?: number
          unit_price?: number
          reorder_level?: number | null
          supplier?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      suppliers: {
        Row: {
          id: string
          name: string
          contact_person: string | null
          email: string | null
          phone: string | null
          address: string | null
          tax_number: string | null
          payment_terms: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          tax_number?: string | null
          payment_terms?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          tax_number?: string | null
          payment_terms?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      purchases: {
        Row: {
          id: string
          purchase_number: string
          supplier_id: string | null
          total_amount: number
          tax_amount: number
          discount_amount: number
          net_amount: number
          status: string
          payment_status: string
          purchase_date: string
          expected_delivery_date: string | null
          received_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          purchase_number: string
          supplier_id?: string | null
          total_amount?: number
          tax_amount?: number
          discount_amount?: number
          net_amount?: number
          status?: string
          payment_status?: string
          purchase_date?: string
          expected_delivery_date?: string | null
          received_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          purchase_number?: string
          supplier_id?: string | null
          total_amount?: number
          tax_amount?: number
          discount_amount?: number
          net_amount?: number
          status?: string
          payment_status?: string
          purchase_date?: string
          expected_delivery_date?: string | null
          received_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      purchase_items: {
        Row: {
          id: string
          purchase_id: string
          product_id: string | null
          quantity: number
          unit_cost: number
          total_cost: number
          received_quantity: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          purchase_id: string
          product_id?: string | null
          quantity: number
          unit_cost: number
          total_cost: number
          received_quantity?: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          purchase_id?: string
          product_id?: string | null
          quantity?: number
          unit_cost?: number
          total_cost?: number
          received_quantity?: number
          notes?: string | null
          created_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          sale_number: string
          customer_name: string | null
          customer_contact: string | null
          total_amount: number
          payment_method: string | null
          payment_status: string | null
          notes: string | null
          sale_date: string
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          sale_number: string
          customer_name?: string | null
          customer_contact?: string | null
          total_amount: number
          payment_method?: string | null
          payment_status?: string | null
          notes?: string | null
          sale_date?: string
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          sale_number?: string
          customer_name?: string | null
          customer_contact?: string | null
          total_amount?: number
          payment_method?: string | null
          payment_status?: string | null
          notes?: string | null
          sale_date?: string
          created_at?: string
          created_by?: string | null
        }
      }
      sale_items: {
        Row: {
          id: string
          sale_id: string
          product_id: string | null
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          sale_id: string
          product_id?: string | null
          quantity: number
          unit_price: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          sale_id?: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
        }
      }
      inventory_movements: {
        Row: {
          id: string
          product_id: string
          movement_type: string
          quantity: number
          reference_type: string | null
          reference_id: string | null
          notes: string | null
          movement_date: string
          created_by: string | null
        }
        Insert: {
          id?: string
          product_id: string
          movement_type: string
          quantity: number
          reference_type?: string | null
          reference_id?: string | null
          notes?: string | null
          movement_date?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          movement_type?: string
          quantity?: number
          reference_type?: string | null
          reference_id?: string | null
          notes?: string | null
          movement_date?: string
          created_by?: string | null
        }
      }
      financial_transactions: {
        Row: {
          id: string
          transaction_type: string
          reference_type: string | null
          reference_id: string | null
          amount: number
          description: string | null
          transaction_date: string
          payment_method: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          transaction_type: string
          reference_type?: string | null
          reference_id?: string | null
          amount: number
          description?: string | null
          transaction_date?: string
          payment_method?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          transaction_type?: string
          reference_type?: string | null
          reference_id?: string | null
          amount?: number
          description?: string | null
          transaction_date?: string
          payment_method?: string | null
          created_at?: string
          created_by?: string | null
        }
      }
      users: {
        Row: {
          id: string
          name: string | null
          email: string | null
          role: string
          is_active: boolean
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          role?: string
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          role?: string
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type MainCategory = Database['public']['Tables']['main_categories']['Row']
export type Subcategory = Database['public']['Tables']['subcategories']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Supplier = Database['public']['Tables']['suppliers']['Row']
export type Purchase = Database['public']['Tables']['purchases']['Row']
export type PurchaseItem = Database['public']['Tables']['purchase_items']['Row']
export type Sale = Database['public']['Tables']['sales']['Row']
export type SaleItem = Database['public']['Tables']['sale_items']['Row']
export type InventoryMovement = Database['public']['Tables']['inventory_movements']['Row']
export type FinancialTransaction = Database['public']['Tables']['financial_transactions']['Row']
export type User = Database['public']['Tables']['users']['Row']

// Insert types
export type MainCategoryInsert = Database['public']['Tables']['main_categories']['Insert']
export type SubcategoryInsert = Database['public']['Tables']['subcategories']['Insert']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type SupplierInsert = Database['public']['Tables']['suppliers']['Insert']
export type PurchaseInsert = Database['public']['Tables']['purchases']['Insert']
export type PurchaseItemInsert = Database['public']['Tables']['purchase_items']['Insert']
export type SaleInsert = Database['public']['Tables']['sales']['Insert']
export type SaleItemInsert = Database['public']['Tables']['sale_items']['Insert']
export type InventoryMovementInsert = Database['public']['Tables']['inventory_movements']['Insert']
export type FinancialTransactionInsert = Database['public']['Tables']['financial_transactions']['Insert']

// Update types
export type MainCategoryUpdate = Database['public']['Tables']['main_categories']['Update']
export type SubcategoryUpdate = Database['public']['Tables']['subcategories']['Update']
export type ProductUpdate = Database['public']['Tables']['products']['Update']
export type SupplierUpdate = Database['public']['Tables']['suppliers']['Update']
export type PurchaseUpdate = Database['public']['Tables']['purchases']['Update']
export type PurchaseItemUpdate = Database['public']['Tables']['purchase_items']['Update']
export type SaleUpdate = Database['public']['Tables']['sales']['Update']
export type SaleItemUpdate = Database['public']['Tables']['sale_items']['Update']
export type InventoryMovementUpdate = Database['public']['Tables']['inventory_movements']['Update']
export type FinancialTransactionUpdate = Database['public']['Tables']['financial_transactions']['Update'] 