export type PaymentMethod = 'mpesa' | 'cash' | 'bank_transfer' | 'credit';
export type CustomerType = 'wholesale' | 'retail';
export type ProductType = 'bulk' | 'packaged';
export type PurchaseStatus = 'draft' | 'ordered' | 'received' | 'cancelled';
export type SaleStatus = 'draft' | 'posted' | 'cancelled';
export type PaymentStatus = 'paid' | 'partial' | 'credit' | 'unpaid';

export type TaxCategoryCode = 'standard_16' | 'zero_rated_0' | 'exempt';

export interface TaxCategory {
  code: TaxCategoryCode;
  name: string;
  rate_percentage: number;
  description: string;
}

export interface BusinessSettings {
  id: string;
  business_name: string;
  owner_name: string;
  kra_pin: string;
  phone: string;
  email: string;
  physical_address: string;
  county: string;
  currency: string;
  currency_symbol: string;
  is_vat_registered: boolean;
  default_tax_category: TaxCategoryCode;
  receipt_footer_note: string;
  invoice_disclaimer: string;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  tea_grade: string;
  product_type: ProductType;
  package_weight_grams: number; // 1000 for bulk (1kg ref), 250, 500, etc for packaged
  stock_quantity_grams: number; // canonical stock in grams!
  cost_per_kg: number;
  wholesale_price: number;
  retail_price: number;
  reorder_threshold_grams: number;
  tax_category: TaxCategoryCode;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type MovementType = 
  | 'purchase_receive' 
  | 'sale_dispatch' 
  | 'repack_source' 
  | 'repack_dest' 
  | 'adjustment_gain' 
  | 'adjustment_loss' 
  | 'sale_return';

export interface StockMovement {
  id: string;
  product_id: string;
  movement_type: MovementType;
  quantity_grams: number; // positive = added, negative = deducted
  balance_after_grams: number;
  unit_cost: number;
  reference_type: 'purchase' | 'sale' | 'repack' | 'adjustment' | 'return';
  reference_id: string;
  notes?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  customer_type: CustomerType;
  address?: string | null;
  kra_pin?: string | null;
  opening_balance: number;
  current_balance: number;
  credit_limit: number;
  payment_terms_days: number;
  notes?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Supplier {
  id: string;
  name: string;
  company_name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  kra_pin?: string | null;
  opening_balance: number;
  current_balance: number;
  bank_details?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  quantity_units: number;
  quantity_grams: number;
  unit_cost_per_unit: number;
  total_cost: number;
}

export interface Purchase {
  id: string;
  purchase_number: string;
  supplier_id: string;
  status: PurchaseStatus;
  order_date: string;
  received_date?: string | null;
  subtotal: number;
  packaging_costs: number;
  transport_costs: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  payment_status: PaymentStatus;
  notes?: string | null;
  created_at?: string;
  items?: PurchaseItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name_snapshot: string;
  quantity_units: number;
  quantity_grams: number;
  unit_price: number;
  unit_cost_snapshot: number;
  tax_category: TaxCategoryCode;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  line_total: number;
}

export interface Sale {
  id: string;
  invoice_number: string;
  customer_id?: string | null;
  customer_name_snapshot: string;
  customer_type_snapshot: CustomerType;
  pricing_tier: CustomerType;
  status: SaleStatus;
  sale_date: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_reference?: string | null;
  etims_reference?: string | null;
  notes?: string | null;
  posted_at?: string | null;
  created_at?: string;
  items?: SaleItem[];
}

export interface Payment {
  id: string;
  payment_number: string;
  party_type: 'customer' | 'supplier';
  customer_id?: string | null;
  supplier_id?: string | null;
  sale_id?: string | null;
  purchase_id?: string | null;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_code?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface Expense {
  id: string;
  expense_number: string;
  category: string;
  description: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_code?: string | null;
  expense_date: string;
  notes?: string | null;
  created_at?: string;
}

export interface StockConversion {
  id: string;
  conversion_number: string;
  source_product_id: string;
  bulk_grams_deducted: number;
  target_product_id: string;
  packets_produced: number;
  packaging_cost_total: number;
  waste_grams: number;
  notes?: string | null;
  created_at?: string;
}
