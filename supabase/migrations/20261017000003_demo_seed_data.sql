-- ==============================================================================
-- Tea Business Manager (Kenya) - Demo Seed Data
-- ==============================================================================

-- Clear existing demo records
DELETE FROM stock_movements;
DELETE FROM stock_conversions;
DELETE FROM sale_items;
DELETE FROM sales;
DELETE FROM purchase_items;
DELETE FROM purchases;
DELETE FROM payments;
DELETE FROM expenses;
DELETE FROM products;
DELETE FROM customers;
DELETE FROM suppliers;
DELETE FROM business_settings;

-- 1. BUSINESS SETTINGS
INSERT INTO business_settings (
    id,
    business_name,
    owner_name,
    kra_pin,
    phone,
    email,
    physical_address,
    county,
    currency,
    currency_symbol,
    is_vat_registered,
    default_tax_category,
    receipt_footer_note,
    invoice_disclaimer
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'Simba Tea Leaves Distributors',
    'Josphat Koech',
    'P051234567Z',
    '+254 712 345 678',
    'sales@simbatea.co.ke',
    'Godown 4, Tea Trade Center, Mombasa Road, Nairobi',
    'Nairobi',
    'KES',
    'KSh',
    true,
    'standard_16',
    'Asante kwa kufanya biashara na Simba Tea! Goods once sold cannot be returned without prior inspection.',
    'Internal Sales Document. Official eTIMS QR invoice issued separately upon request.'
);

-- 2. PRODUCTS
-- Grams is canonical stock unit
INSERT INTO products (
    id,
    sku,
    name,
    brand,
    tea_grade,
    product_type,
    package_weight_grams,
    stock_quantity_grams,
    cost_per_kg,
    wholesale_price,
    retail_price,
    reorder_threshold_grams,
    tax_category,
    is_active
) VALUES 
-- Bulk teas (package_weight_grams = 1000 for 1kg unit calculations, stock in grams)
('p0000000-0000-0000-0000-000000000001', 'TEA-BLK-BP1', 'Kericho Pure BP1 Bulk Leaves', 'Simba Tea', 'BP1 (Broken Pekoe 1)', 'bulk', 1000, 480000, 320.00, 420.00, 480.00, 50000, 'standard_16', true),
('p0000000-0000-0000-0000-000000000002', 'TEA-BLK-PF1', 'Nandi Hills PF1 Quick Brew Bulk', 'Simba Tea', 'PF1 (Pekoe Fannings 1)', 'bulk', 1000, 310000, 290.00, 390.00, 450.00, 40000, 'standard_16', true),
('p0000000-0000-0000-0000-000000000003', 'TEA-BLK-DUST', 'Bomet Gold Dust Bulk Grade', 'Simba Tea', 'Dust 1 (D1)', 'bulk', 1000, 195000, 240.00, 320.00, 380.00, 30000, 'standard_16', true),

-- Packaged teas (stored in packets, stock_quantity_grams = packet_count * package_weight_grams)
('p0000000-0000-0000-0000-000000000004', 'TEA-PKG-BP1-500G', 'Simba Premium BP1 Pouch 500g', 'Simba Tea', 'BP1 (Broken Pekoe 1)', 'packaged', 500, 75000, 175.00, 230.00, 270.00, 15000, 'standard_16', true),
('p0000000-0000-0000-0000-000000000005', 'TEA-PKG-BP1-250G', 'Simba Premium BP1 Pouch 250g', 'Simba Tea', 'BP1 (Broken Pekoe 1)', 'packaged', 250, 45000, 90.00, 120.00, 145.00, 10000, 'standard_16', true),
('p0000000-0000-0000-0000-000000000006', 'TEA-PKG-PF1-500G', 'Simba Chai Halisi PF1 500g', 'Simba Tea', 'PF1 (Pekoe Fannings 1)', 'packaged', 500, 52000, 160.00, 210.00, 250.00, 12000, 'standard_16', true),
('p0000000-0000-0000-0000-000000000007', 'TEA-PKG-PF1-1KG', 'Simba Catering PF1 Bag 1kg', 'Simba Tea', 'PF1 (Pekoe Fannings 1)', 'packaged', 1000, 38000, 310.00, 410.00, 470.00, 10000, 'standard_16', true),
('p0000000-0000-0000-0000-000000000008', 'TEA-PKG-PURP-100G', 'Highlands Orthodox Purple Tea 100g', 'Simba Tea', 'Purple Orthodox', 'packaged', 100, 1800, 180.00, 280.00, 350.00, 5000, 'standard_16', true);

-- 3. CUSTOMERS
INSERT INTO customers (
    id,
    name,
    phone,
    email,
    customer_type,
    address,
    kra_pin,
    opening_balance,
    current_balance,
    credit_limit,
    payment_terms_days,
    notes,
    is_active
) VALUES
('c0000000-0000-0000-0000-000000000001', 'Nairobi Chai Wholesalers Ltd', '+254 722 112 233', 'info@nairobichai.co.ke', 'wholesale', '1st Avenue, Eastleigh, Nairobi', 'P051987654X', 0.00, 45000.00, 200000.00, 14, 'Major distributor in Eastleigh. Pays via Bank Transfer or M-Pesa Paybill.', true),
('c0000000-0000-0000-0000-000000000002', 'Rift Valley Supermarkets', '+254 733 445 566', 'procurement@rvsupermarkets.co.ke', 'wholesale', 'Kenyatta Avenue, Nakuru', 'P052887766Y', 0.00, 0.00, 150000.00, 30, 'Supermarket chain with 3 branches in Nakuru.', true),
('c0000000-0000-0000-0000-000000000003', 'Mama Wanjiku General Shop', '+254 710 998 877', NULL, 'retail', 'Stall 14, Kawangware Market, Nairobi', NULL, 0.00, 2500.00, 10000.00, 7, 'Retail kiosk owner, orders 250g and 500g pouches weekly.', true),
('c0000000-0000-0000-0000-000000000004', 'Highlands Terrace Restaurant', '+254 721 556 677', 'accounts@highlandsterrace.co.ke', 'retail', 'Parklands, Nairobi', 'P053112233M', 0.00, 0.00, 25000.00, 7, 'Consistently buys 1kg catering bags for breakfast tea.', true);

-- 4. SUPPLIERS
INSERT INTO suppliers (
    id,
    name,
    company_name,
    phone,
    email,
    address,
    kra_pin,
    opening_balance,
    current_balance,
    bank_details,
    notes,
    is_active
) VALUES
('s0000000-0000-0000-0000-000000000001', 'Kipkemboi Ruto', 'Kericho Highlands Tea Factory Ltd', '+254 720 123 456', 'supply@kerichoteafactory.co.ke', 'P.O. Box 45, Kericho', 'P051000111A', 0.00, 64000.00, 'KCB Bank, Kericho Branch, Acc: 1102938475', 'Primary supplier of auction-grade BP1 and PF1 bulk tea.', true),
('s0000000-0000-0000-0000-000000000002', 'Grace Mutheu', 'Crown Poly & Packaging Ltd', '+254 733 987 654', 'sales@crownpackaging.co.ke', 'Commercial Street, Industrial Area, Nairobi', 'P051222333B', 0.00, 0.00, 'Equity Bank, Industrial Area Branch, Acc: 0180293847', 'Supplies branded 250g, 500g and 1kg food-grade tea foil pouches.', true);

-- 5. PURCHASES & PURCHASE ITEMS
INSERT INTO purchases (
    id,
    purchase_number,
    supplier_id,
    status,
    order_date,
    received_date,
    subtotal,
    packaging_costs,
    transport_costs,
    total_amount,
    amount_paid,
    balance_due,
    payment_status,
    notes
) VALUES (
    'po000000-0000-0000-0000-000000000001',
    'PO-2026-0001',
    's0000000-0000-0000-0000-000000000001',
    'received',
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE - INTERVAL '8 days',
    160000.00,
    0.00,
    4000.00,
    164000.00,
    100000.00,
    64000.00,
    'partial',
    'Initial bulk shipment of Kericho BP1 (500kg)'
);

INSERT INTO purchase_items (
    id,
    purchase_id,
    product_id,
    quantity_units,
    quantity_grams,
    unit_cost_per_unit,
    total_cost
) VALUES (
    'pi000000-0000-0000-0000-000000000001',
    'po000000-0000-0000-0000-000000000001',
    'p0000000-0000-0000-0000-000000000001',
    500.00,
    500000,
    320.00,
    160000.00
);

-- 6. SALES & SALE ITEMS
INSERT INTO sales (
    id,
    invoice_number,
    customer_id,
    customer_name_snapshot,
    customer_type_snapshot,
    pricing_tier,
    status,
    sale_date,
    subtotal,
    discount_amount,
    tax_amount,
    total_amount,
    amount_paid,
    balance_due,
    payment_status,
    payment_method,
    payment_reference,
    etims_reference,
    notes,
    posted_at
) VALUES 
(
    'so000000-0000-0000-0000-000000000001',
    'INV-2026-0001',
    'c0000000-0000-0000-0000-000000000001',
    'Nairobi Chai Wholesalers Ltd',
    'wholesale',
    'wholesale',
    'posted',
    CURRENT_DATE - INTERVAL '3 days',
    42000.00,
    0.00,
    6720.00,
    48720.00,
    48720.00,
    0.00,
    'paid',
    'bank_transfer',
    'KCB-TXN-9840293',
    'eTIMS-2026-000192',
    'Bulk BP1 wholesale order (100kg)',
    timezone('utc', now() - INTERVAL '3 days')
),
(
    'so000000-0000-0000-0000-000000000002',
    'INV-2026-0002',
    'c0000000-0000-0000-0000-000000000001',
    'Nairobi Chai Wholesalers Ltd',
    'wholesale',
    'wholesale',
    'posted',
    CURRENT_DATE - INTERVAL '1 days',
    45000.00,
    0.00,
    0.00,
    45000.00,
    0.00,
    45000.00,
    'credit',
    'credit',
    NULL,
    NULL,
    'Dispatched on 14-day credit terms.',
    timezone('utc', now() - INTERVAL '1 days')
),
(
    'so000000-0000-0000-0000-000000000003',
    'INV-2026-0003',
    'c0000000-0000-0000-0000-000000000003',
    'Mama Wanjiku General Shop',
    'retail',
    'retail',
    'posted',
    CURRENT_DATE,
    6500.00,
    100.00,
    1024.00,
    7424.00,
    4924.00,
    2500.00,
    'partial',
    'mpesa',
    'RJK89721LQ',
    NULL,
    'Paid deposit via M-Pesa, balance due end of week.',
    timezone('utc', now())
);

-- Sale Items
INSERT INTO sale_items (
    id,
    sale_id,
    product_id,
    product_name_snapshot,
    quantity_units,
    quantity_grams,
    unit_price,
    unit_cost_snapshot,
    tax_category,
    tax_rate,
    tax_amount,
    discount_amount,
    line_total
) VALUES
(
    'si000000-0000-0000-0000-000000000001',
    'so000000-0000-0000-0000-000000000001',
    'p0000000-0000-0000-0000-000000000001',
    'Kericho Pure BP1 Bulk Leaves',
    100.00,
    100000,
    420.00,
    320.00,
    'standard_16',
    16.00,
    6720.00,
    0.00,
    48720.00
),
(
    'si000000-0000-0000-0000-000000000002',
    'so000000-0000-0000-0000-000000000002',
    'p0000000-0000-0000-0000-000000000004',
    'Simba Premium BP1 Pouch 500g',
    150.00,
    75000,
    230.00,
    175.00,
    'zero_rated_0',
    0.00,
    0.00,
    0.00,
    45000.00
),
(
    'si000000-0000-0000-0000-000000000003',
    'so000000-0000-0000-0000-000000000003',
    'p0000000-0000-0000-0000-000000000005',
    'Simba Premium BP1 Pouch 250g',
    40.00,
    10000,
    145.00,
    90.00,
    'standard_16',
    16.00,
    928.00,
    100.00,
    6628.00
);

-- 7. PAYMENTS
INSERT INTO payments (
    id,
    payment_number,
    party_type,
    customer_id,
    sale_id,
    payment_date,
    amount,
    payment_method,
    reference_code,
    notes
) VALUES
(
    'py000000-0000-0000-0000-000000000001',
    'PAY-2026-0001',
    'customer',
    'c0000000-0000-0000-0000-000000000001',
    'so000000-0000-0000-0000-000000000001',
    CURRENT_DATE - INTERVAL '3 days',
    48720.00,
    'bank_transfer',
    'KCB-TXN-9840293',
    'Full settlement for INV-2026-0001'
),
(
    'py000000-0000-0000-0000-000000000002',
    'PAY-2026-0002',
    'customer',
    'c0000000-0000-0000-0000-000000000003',
    'so000000-0000-0000-0000-000000000003',
    CURRENT_DATE,
    4924.00,
    'mpesa',
    'RJK89721LQ',
    'M-Pesa payment on INV-2026-0003'
);

-- 8. EXPENSES
INSERT INTO expenses (
    id,
    expense_number,
    category,
    description,
    amount,
    payment_method,
    reference_code,
    expense_date,
    notes
) VALUES
('ex000000-0000-0000-0000-000000000001', 'EXP-2026-0001', 'Transport & Logistics', 'Transport of 500kg bulk tea from Kericho to Nairobi warehouse via SGR cargo', 8500.00, 'mpesa', 'QBR44829KJ', CURRENT_DATE - INTERVAL '7 days', 'Truck delivery from ICD Embakasi to godown'),
('ex000000-0000-0000-0000-000000000002', 'EXP-2026-0002', 'Packaging & Pouches', 'Purchased 1,000 branded zip-lock moisture barrier tea pouches (500g)', 14000.00, 'bank_transfer', 'NCBA-983214', CURRENT_DATE - INTERVAL '5 days', 'Crown Poly & Packaging Ltd'),
('ex000000-0000-0000-0000-000000000003', 'EXP-2026-0003', 'Casual Labour', 'Daily wages for 2 casual workers repacking and heat-sealing tea pouches', 3200.00, 'mpesa', 'QCP991823H', CURRENT_DATE - INTERVAL '2 days', '2 days packing work'),
('ex000000-0000-0000-0000-000000000004', 'EXP-2026-0004', 'Warehouse Rent', 'Monthly godown storage rental share', 25000.00, 'bank_transfer', 'COOP-449102', CURRENT_DATE - INTERVAL '15 days', 'Mombasa Road warehouse');

-- 9. AUDITABLE STOCK MOVEMENTS LOG
INSERT INTO stock_movements (
    id,
    product_id,
    movement_type,
    quantity_grams,
    balance_after_grams,
    unit_cost,
    reference_type,
    reference_id,
    notes,
    created_at
) VALUES
(
    'sm000000-0000-0000-0000-000000000001',
    'p0000000-0000-0000-0000-000000000001',
    'purchase_receive',
    500000,
    580000,
    320.00,
    'purchase',
    'PO-2026-0001',
    'Goods received from Kericho Highlands Tea Factory (500 kg)',
    timezone('utc', now() - INTERVAL '8 days')
),
(
    'sm000000-0000-0000-0000-000000000002',
    'p0000000-0000-0000-0000-000000000001',
    'sale_dispatch',
    -100000,
    480000,
    320.00,
    'sale',
    'INV-2026-0001',
    'Dispatched 100 kg bulk tea to Nairobi Chai Wholesalers',
    timezone('utc', now() - INTERVAL '3 days')
);
