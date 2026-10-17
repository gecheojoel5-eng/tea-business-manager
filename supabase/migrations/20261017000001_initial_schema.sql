-- ==============================================================================
-- Tea Business Manager (Kenya) - Initial PostgreSQL / Supabase Schema
-- Designed for single-owner wholesale & retail tea enterprise in Kenya
-- Canonical stock unit: GRAMS (g)
-- Currency: KES (KSh)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BUSINESS SETTINGS TABLE
CREATE TABLE IF NOT EXISTS business_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT NOT NULL DEFAULT 'Simba Tea Leaves Distributors',
    owner_name TEXT NOT NULL DEFAULT 'Tea Business Owner',
    kra_pin TEXT NOT NULL DEFAULT 'P051234567Z',
    phone TEXT NOT NULL DEFAULT '+254 712 345 678',
    email TEXT NOT NULL DEFAULT 'info@simbatea.co.ke',
    physical_address TEXT NOT NULL DEFAULT 'Tea Trade Center, Nyerere Road, Mombasa / Nairobi',
    county TEXT NOT NULL DEFAULT 'Nairobi',
    currency TEXT NOT NULL DEFAULT 'KES',
    currency_symbol TEXT NOT NULL DEFAULT 'KSh',
    is_vat_registered BOOLEAN NOT NULL DEFAULT false,
    default_tax_category TEXT NOT NULL DEFAULT 'standard_16',
    receipt_footer_note TEXT NOT NULL DEFAULT 'Asante kwa kibiashara na sisi! Karibu tena.',
    invoice_disclaimer TEXT NOT NULL DEFAULT 'Internal Sales Document. Official eTIMS QR invoice issued separately upon request.',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2. TAX CATEGORIES
CREATE TABLE IF NOT EXISTS tax_categories (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    rate_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    description TEXT
);

INSERT INTO tax_categories (code, name, rate_percentage, description) VALUES
('standard_16', '16% Standard VAT', 16.00, 'Standard Kenyan Value Added Tax rate'),
('zero_rated_0', '0% Zero-Rated', 0.00, 'Zero-rated goods e.g. qualifying agricultural supplies/exports'),
('exempt', 'Exempt', 0.00, 'Exempt from VAT under Kenyan VAT Act')
ON CONFLICT (code) DO UPDATE SET rate_percentage = EXCLUDED.rate_percentage;

-- 3. PRODUCTS (Canonical Stock stored in Grams)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    brand TEXT NOT NULL DEFAULT 'Kericho Gold',
    tea_grade TEXT NOT NULL, -- BP1, PF1, PD, DUST1, Orthodox Purple, Green Pekoe, Fannings
    product_type TEXT NOT NULL CHECK (product_type IN ('bulk', 'packaged')),
    package_weight_grams INTEGER NOT NULL DEFAULT 1000, -- e.g. 250, 500, 1000 (1 for bulk)
    stock_quantity_grams BIGINT NOT NULL DEFAULT 0 CHECK (stock_quantity_grams >= 0),
    cost_per_kg NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    wholesale_price NUMERIC(12,2) NOT NULL DEFAULT 0.00, -- Wholesale price per packet or per kg
    retail_price NUMERIC(12,2) NOT NULL DEFAULT 0.00, -- Retail price per packet or per kg
    reorder_threshold_grams BIGINT NOT NULL DEFAULT 10000, -- Reorder trigger in grams (e.g. 10 kg)
    tax_category TEXT NOT NULL DEFAULT 'standard_16' REFERENCES tax_categories(code),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);

-- 4. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    customer_type TEXT NOT NULL CHECK (customer_type IN ('wholesale', 'retail')),
    address TEXT,
    kra_pin TEXT,
    opening_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    current_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    credit_limit NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_terms_days INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);

-- 5. SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    company_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    kra_pin TEXT,
    opening_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    current_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    bank_details TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 6. PURCHASES & PURCHASE ITEMS
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_number TEXT UNIQUE NOT NULL, -- e.g. PO-2026-0001
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'ordered', 'received', 'cancelled')),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    received_date DATE,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    packaging_costs NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    transport_costs NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    balance_due NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_status TEXT NOT NULL CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity_units NUMERIC(12,2) NOT NULL DEFAULT 1.00,
    quantity_grams BIGINT NOT NULL DEFAULT 0,
    unit_cost_per_unit NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00
);

-- 7. SALES & SALE ITEMS
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT UNIQUE NOT NULL, -- e.g. INV-2026-0001
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name_snapshot TEXT NOT NULL,
    customer_type_snapshot TEXT NOT NULL,
    pricing_tier TEXT NOT NULL CHECK (pricing_tier IN ('wholesale', 'retail')),
    status TEXT NOT NULL CHECK (status IN ('draft', 'posted', 'cancelled')),
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    balance_due NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'partial', 'credit')),
    payment_method TEXT NOT NULL DEFAULT 'mpesa' CHECK (payment_method IN ('cash', 'mpesa', 'bank_transfer', 'credit')),
    payment_reference TEXT, -- e.g. M-Pesa transaction code
    etims_reference TEXT, -- External eTIMS CU Invoice / Ack No
    notes TEXT,
    posted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name_snapshot TEXT NOT NULL,
    quantity_units NUMERIC(12,2) NOT NULL DEFAULT 1.00,
    quantity_grams BIGINT NOT NULL DEFAULT 0,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    unit_cost_snapshot NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tax_category TEXT NOT NULL DEFAULT 'standard_16' REFERENCES tax_categories(code),
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 16.00,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    line_total NUMERIC(12,2) NOT NULL DEFAULT 0.00
);

-- 8. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_number TEXT UNIQUE NOT NULL, -- PAY-2026-0001
    party_type TEXT NOT NULL CHECK (party_type IN ('customer', 'supplier')),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'mpesa', 'bank_transfer', 'cheque')),
    reference_code TEXT, -- e.g. M-Pesa Code: QBR7764LKJ
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 9. EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_number TEXT UNIQUE NOT NULL, -- EXP-2026-0001
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'mpesa', 'bank_transfer', 'cheque')),
    reference_code TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 10. STOCK CONVERSIONS (REPACKING BULK TEA INTO PACKETS)
CREATE TABLE IF NOT EXISTS stock_conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversion_number TEXT UNIQUE NOT NULL, -- RPK-2026-0001
    source_product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    bulk_grams_deducted BIGINT NOT NULL CHECK (bulk_grams_deducted > 0),
    target_product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    packets_produced INTEGER NOT NULL CHECK (packets_produced > 0),
    packaging_cost_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    waste_grams BIGINT NOT NULL DEFAULT 0 CHECK (waste_grams >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 11. AUDITABLE STOCK MOVEMENTS LEDGER
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    movement_type TEXT NOT NULL CHECK (movement_type IN (
        'purchase_receive',
        'sale_dispatch',
        'repack_source',
        'repack_dest',
        'adjustment_gain',
        'adjustment_loss',
        'sale_return'
    )),
    quantity_grams BIGINT NOT NULL, -- + for additions, - for deductions
    balance_after_grams BIGINT NOT NULL CHECK (balance_after_grams >= 0),
    unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    reference_type TEXT NOT NULL CHECK (reference_type IN ('purchase', 'sale', 'repack', 'adjustment', 'return')),
    reference_id TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at);
