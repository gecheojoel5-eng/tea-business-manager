-- ==============================================================================
-- Tea Business Manager (Kenya) - Atomic Business Functions & RLS
-- ==============================================================================

-- 1. FUNCTION: Post Sale Transaction (Atomic deduction, stock ledger, customer balance)
CREATE OR REPLACE FUNCTION post_sale_transaction(
    p_sale_id UUID,
    p_payment_method TEXT DEFAULT 'mpesa',
    p_payment_ref TEXT DEFAULT NULL,
    p_amount_paid NUMERIC DEFAULT 0.00
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_sale RECORD;
    v_item RECORD;
    v_prod RECORD;
    v_new_balance BIGINT;
    v_customer_balance_change NUMERIC := 0.00;
    v_payment_id UUID;
    v_pay_num TEXT;
BEGIN
    -- 1. Fetch and lock sale row
    SELECT * INTO v_sale FROM sales WHERE id = p_sale_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sale not found: %', p_sale_id;
    END IF;

    IF v_sale.status = 'posted' THEN
        RAISE EXCEPTION 'Sale % is already posted and immutable.', v_sale.invoice_number;
    END IF;

    -- 2. Verify and deduct stock for each sale item
    FOR v_item IN SELECT * FROM sale_items WHERE sale_id = p_sale_id LOOP
        SELECT * INTO v_prod FROM products WHERE id = v_item.product_id FOR UPDATE;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product not found for item %', v_item.product_name_snapshot;
        END IF;

        IF v_prod.stock_quantity_grams < v_item.quantity_grams THEN
            RAISE EXCEPTION 'Insufficient stock for product "%" (Available: %g, Required: %g)',
                v_prod.name, v_prod.stock_quantity_grams, v_item.quantity_grams;
        END IF;

        v_new_balance := v_prod.stock_quantity_grams - v_item.quantity_grams;

        -- Update product stock
        UPDATE products
        SET stock_quantity_grams = v_new_balance,
            updated_at = timezone('utc', now())
        WHERE id = v_item.product_id;

        -- Write to auditable stock movements ledger
        INSERT INTO stock_movements (
            product_id,
            movement_type,
            quantity_grams,
            balance_after_grams,
            unit_cost,
            reference_type,
            reference_id,
            notes
        ) VALUES (
            v_item.product_id,
            'sale_dispatch',
            -v_item.quantity_grams,
            v_new_balance,
            v_item.unit_cost_snapshot,
            'sale',
            v_sale.invoice_number,
            'Dispatched for sale ' || v_sale.invoice_number
        );
    END LOOP;

    -- 3. Calculate payments and customer balances
    IF p_amount_paid >= v_sale.total_amount THEN
        UPDATE sales
        SET amount_paid = v_sale.total_amount,
            balance_due = 0.00,
            payment_status = 'paid',
            payment_method = p_payment_method,
            payment_reference = p_payment_ref,
            status = 'posted',
            posted_at = timezone('utc', now()),
            updated_at = timezone('utc', now())
        WHERE id = p_sale_id;
    ELSIF p_amount_paid > 0 THEN
        UPDATE sales
        SET amount_paid = p_amount_paid,
            balance_due = v_sale.total_amount - p_amount_paid,
            payment_status = 'partial',
            payment_method = p_payment_method,
            payment_reference = p_payment_ref,
            status = 'posted',
            posted_at = timezone('utc', now()),
            updated_at = timezone('utc', now())
        WHERE id = p_sale_id;
        v_customer_balance_change := v_sale.total_amount - p_amount_paid;
    ELSE
        UPDATE sales
        SET amount_paid = 0.00,
            balance_due = v_sale.total_amount,
            payment_status = 'credit',
            payment_method = 'credit',
            status = 'posted',
            posted_at = timezone('utc', now()),
            updated_at = timezone('utc', now())
        WHERE id = p_sale_id;
        v_customer_balance_change := v_sale.total_amount;
    END IF;

    -- 4. Record payment if any received
    IF p_amount_paid > 0 THEN
        v_pay_num := 'PAY-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad((floor(random() * 90000) + 10000)::text, 5, '0');
        INSERT INTO payments (
            payment_number,
            party_type,
            customer_id,
            sale_id,
            payment_date,
            amount,
            payment_method,
            reference_code,
            notes
        ) VALUES (
            v_pay_num,
            'customer',
            v_sale.customer_id,
            p_sale_id,
            CURRENT_DATE,
            p_amount_paid,
            p_payment_method,
            p_payment_ref,
            'Payment received on sale ' || v_sale.invoice_number
        );
    END IF;

    -- 5. Update customer balance if on credit or partial
    IF v_sale.customer_id IS NOT NULL AND v_customer_balance_change > 0 THEN
        UPDATE customers
        SET current_balance = current_balance + v_customer_balance_change,
            updated_at = timezone('utc', now())
        WHERE id = v_sale.customer_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'invoice_number', v_sale.invoice_number,
        'message', 'Sale posted successfully. Inventory and ledger updated.'
    );
END;
$$;


-- 2. FUNCTION: Receive Purchase (Increments stock only upon receipt)
CREATE OR REPLACE FUNCTION receive_purchase_transaction(
    p_purchase_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_purch RECORD;
    v_item RECORD;
    v_prod RECORD;
    v_new_balance BIGINT;
BEGIN
    SELECT * INTO v_purch FROM purchases WHERE id = p_purchase_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Purchase not found: %', p_purchase_id;
    END IF;

    IF v_purch.status = 'received' THEN
        RAISE EXCEPTION 'Purchase % has already been received.', v_purch.purchase_number;
    END IF;

    FOR v_item IN SELECT * FROM purchase_items WHERE purchase_id = p_purchase_id LOOP
        SELECT * INTO v_prod FROM products WHERE id = v_item.product_id FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product not found for purchase item %', v_item.id;
        END IF;

        v_new_balance := v_prod.stock_quantity_grams + v_item.quantity_grams;

        -- Update product stock
        UPDATE products
        SET stock_quantity_grams = v_new_balance,
            cost_per_kg = CASE 
                WHEN v_item.quantity_grams > 0 THEN (v_item.total_cost / (v_item.quantity_grams / 1000.0))
                ELSE cost_per_kg 
            END,
            updated_at = timezone('utc', now())
        WHERE id = v_item.product_id;

        -- Record in auditable stock movement ledger
        INSERT INTO stock_movements (
            product_id,
            movement_type,
            quantity_grams,
            balance_after_grams,
            unit_cost,
            reference_type,
            reference_id,
            notes
        ) VALUES (
            v_item.product_id,
            'purchase_receive',
            v_item.quantity_grams,
            v_new_balance,
            v_item.unit_cost_per_unit,
            'purchase',
            v_purch.purchase_number,
            'Goods received from purchase ' || v_purch.purchase_number
        );
    END LOOP;

    -- Update purchase record
    UPDATE purchases
    SET status = 'received',
        received_date = CURRENT_DATE,
        balance_due = total_amount - amount_paid,
        updated_at = timezone('utc', now())
    WHERE id = p_purchase_id;

    -- Update supplier balance if balance due
    IF v_purch.balance_due > 0 THEN
        UPDATE suppliers
        SET current_balance = current_balance + v_purch.balance_due,
            updated_at = timezone('utc', now())
        WHERE id = v_purch.supplier_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'purchase_number', v_purch.purchase_number,
        'message', 'Goods successfully received into inventory.'
    );
END;
$$;


-- 3. FUNCTION: Repack Bulk Tea into Packets (Atomically deduct bulk, credit packets)
CREATE OR REPLACE FUNCTION repack_bulk_tea_transaction(
    p_source_product_id UUID,
    p_bulk_grams_deducted BIGINT,
    p_target_product_id UUID,
    p_packets_produced INTEGER,
    p_packaging_cost NUMERIC DEFAULT 0.00,
    p_waste_grams BIGINT DEFAULT 0,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_source RECORD;
    v_target RECORD;
    v_conversion_num TEXT;
    v_source_new_stock BIGINT;
    v_target_added_grams BIGINT;
    v_target_new_stock BIGINT;
BEGIN
    -- Lock source bulk product
    SELECT * INTO v_source FROM products WHERE id = p_source_product_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Source bulk product not found.';
    END IF;

    IF v_source.stock_quantity_grams < p_bulk_grams_deducted THEN
        RAISE EXCEPTION 'Insufficient bulk tea stock. Available: %g, Requested: %g', 
            v_source.stock_quantity_grams, p_bulk_grams_deducted;
    END IF;

    -- Lock target packaged product
    SELECT * INTO v_target FROM products WHERE id = p_target_product_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target packaged product not found.';
    END IF;

    v_target_added_grams := p_packets_produced * v_target.package_weight_grams;
    
    -- Check that total output does not exceed input
    IF (v_target_added_grams + p_waste_grams) > p_bulk_grams_deducted THEN
        RAISE EXCEPTION 'Total output (%g packets + %g waste) exceeds bulk input (%g).',
            v_target_added_grams, p_waste_grams, p_bulk_grams_deducted;
    END IF;

    v_conversion_num := 'RPK-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad((floor(random() * 9000) + 1000)::text, 4, '0');

    -- 1. Deduct source bulk product
    v_source_new_stock := v_source.stock_quantity_grams - p_bulk_grams_deducted;
    UPDATE products
    SET stock_quantity_grams = v_source_new_stock,
        updated_at = timezone('utc', now())
    WHERE id = p_source_product_id;

    -- 2. Increase target packaged product
    v_target_new_stock := v_target.stock_quantity_grams + v_target_added_grams;
    UPDATE products
    SET stock_quantity_grams = v_target_new_stock,
        updated_at = timezone('utc', now())
    WHERE id = p_target_product_id;

    -- 3. Record conversion record
    INSERT INTO stock_conversions (
        conversion_number,
        source_product_id,
        bulk_grams_deducted,
        target_product_id,
        packets_produced,
        packaging_cost_total,
        waste_grams,
        notes
    ) VALUES (
        v_conversion_num,
        p_source_product_id,
        p_bulk_grams_deducted,
        p_target_product_id,
        p_packets_produced,
        p_packaging_cost,
        p_waste_grams,
        p_notes
    );

    -- 4. Log source deduction in ledger
    INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity_grams,
        balance_after_grams,
        unit_cost,
        reference_type,
        reference_id,
        notes
    ) VALUES (
        p_source_product_id,
        'repack_source',
        -p_bulk_grams_deducted,
        v_source_new_stock,
        v_source.cost_per_kg,
        'repack',
        v_conversion_num,
        'Repacked into ' || p_packets_produced || ' packets of ' || v_target.name
    );

    -- 5. Log destination addition in ledger
    INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity_grams,
        balance_after_grams,
        unit_cost,
        reference_type,
        reference_id,
        notes
    ) VALUES (
        p_target_product_id,
        'repack_dest',
        v_target_added_grams,
        v_target_new_stock,
        v_target.cost_per_kg,
        'repack',
        v_conversion_num,
        'Produced ' || p_packets_produced || ' packets from bulk ' || v_source.name
    );

    RETURN jsonb_build_object(
        'success', true,
        'conversion_number', v_conversion_num,
        'packets_produced', p_packets_produced,
        'message', 'Bulk tea repacked into packets successfully without double-counting.'
    );
END;
$$;


-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (and local anon during development) to manage all records
CREATE POLICY "Allow authenticated read/write on business_settings" ON business_settings FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write on tax_categories" ON tax_categories FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write on products" ON products FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write on customers" ON customers FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write on suppliers" ON suppliers FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write on purchases" ON purchases FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write on purchase_items" ON purchase_items FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write on sales" ON sales FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write on sale_items" ON sale_items FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write on payments" ON payments FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write on expenses" ON expenses FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write on stock_conversions" ON stock_conversions FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read/write on stock_movements" ON stock_movements FOR ALL TO public USING (true) WITH CHECK (true);
