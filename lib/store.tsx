'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  BusinessSettings,
  Product,
  Customer,
  Supplier,
  Purchase,
  PurchaseItem,
  Sale,
  SaleItem,
  Payment,
  Expense,
  StockMovement,
  StockConversion,
} from './types';
import {
  INITIAL_SETTINGS,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_PURCHASES,
  INITIAL_SALES,
  INITIAL_PAYMENTS,
  INITIAL_EXPENSES,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_CONVERSIONS,
} from './mockData';
import { isSupabaseConfigured, supabase } from './supabaseClient';

interface StoreContextType {
  settings: BusinessSettings;
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  purchases: Purchase[];
  sales: Sale[];
  payments: Payment[];
  expenses: Expense[];
  stockMovements: StockMovement[];
  stockConversions: StockConversion[];
  isSupabaseLive: boolean;
  isLoading: boolean;
  
  // Business Actions
  postSale: (saleData: Omit<Sale, 'id' | 'invoice_number' | 'status' | 'posted_at' | 'created_at' | 'items'> & { items: Omit<SaleItem, 'id' | 'sale_id'>[] }) => Promise<{ success: boolean; error?: string; invoiceNumber?: string }>;
  receivePurchase: (purchaseId: string) => Promise<{ success: boolean; error?: string }>;
  createPurchase: (purchaseData: Omit<Purchase, 'id' | 'purchase_number' | 'status' | 'received_date' | 'items'>, items: Omit<PurchaseItem, 'id' | 'purchase_id'>[]) => Promise<{ success: boolean; error?: string }>;
  repackBulkTea: (
    sourceProductId: string,
    bulkGramsDeducted: number,
    targetProductId: string,
    packetsProduced: number,
    packagingCost: number,
    wasteGrams: number,
    notes?: string
  ) => Promise<{ success: boolean; error?: string }>;
  adjustStock: (productId: string, adjustmentGrams: number, reason: string) => Promise<{ success: boolean; error?: string }>;
  recordPayment: (payment: Omit<Payment, 'id' | 'payment_number' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  recordExpense: (expense: Omit<Expense, 'id' | 'expense_number' | 'created_at'>) => Promise<{ success: boolean; error?: string }>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<{ success: boolean; error?: string }>;
  addCustomer: (customer: Omit<Customer, 'id' | 'current_balance'>) => Promise<{ success: boolean; error?: string }>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<{ success: boolean; error?: string }>;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'current_balance'>) => Promise<{ success: boolean; error?: string }>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<{ success: boolean; error?: string }>;
  updateSettings: (updates: Partial<BusinessSettings>) => Promise<{ success: boolean; error?: string }>;
  resetToDemoData: () => void;
  exportDataAsJson: () => string;
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEYS = {
  SETTINGS: 'chai_tea_settings_v1',
  PRODUCTS: 'chai_tea_products_v1',
  CUSTOMERS: 'chai_tea_customers_v1',
  SUPPLIERS: 'chai_tea_suppliers_v1',
  PURCHASES: 'chai_tea_purchases_v1',
  SALES: 'chai_tea_sales_v1',
  PAYMENTS: 'chai_tea_payments_v1',
  EXPENSES: 'chai_tea_expenses_v1',
  MOVEMENTS: 'chai_tea_movements_v1',
  CONVERSIONS: 'chai_tea_conversions_v1',
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<BusinessSettings>(INITIAL_SETTINGS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [purchases, setPurchases] = useState<Purchase[]>(INITIAL_PURCHASES);
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(INITIAL_STOCK_MOVEMENTS);
  const [stockConversions, setStockConversions] = useState<StockConversion[]>(INITIAL_CONVERSIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseLive, setIsSupabaseLive] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      // Check if Supabase is connected
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: remoteSettings, error } = await supabase
            .from('business_settings')
            .select('*')
            .limit(1)
            .single();

          if (!error && remoteSettings) {
            setIsSupabaseLive(true);
            setSettings(remoteSettings);

            // Fetch live tables
            const [
              { data: pList },
              { data: cList },
              { data: sList },
              { data: purList },
              { data: salList },
              { data: payList },
              { data: expList },
              { data: movList },
              { data: convList },
            ] = await Promise.all([
              supabase.from('products').select('*').order('name'),
              supabase.from('customers').select('*').order('name'),
              supabase.from('suppliers').select('*').order('company_name'),
              supabase.from('purchases').select('*, items:purchase_items(*)').order('created_at', { ascending: false }),
              supabase.from('sales').select('*, items:sale_items(*)').order('created_at', { ascending: false }),
              supabase.from('payments').select('*').order('created_at', { ascending: false }),
              supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
              supabase.from('stock_movements').select('*').order('created_at', { ascending: false }),
              supabase.from('stock_conversions').select('*').order('created_at', { ascending: false }),
            ]);

            if (pList) setProducts(pList);
            if (cList) setCustomers(cList);
            if (sList) setSuppliers(sList);
            if (purList) setPurchases(purList);
            if (salList) setSales(salList);
            if (payList) setPayments(payList);
            if (expList) setExpenses(expList);
            if (movList) setStockMovements(movList);
            if (convList) setStockConversions(convList);

            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Supabase fetch failed, falling back to local storage:', err);
        }
      }

      // Local storage fallback for instant, robust offline & demo use
      try {
        const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        const storedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
        const storedCustomers = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
        const storedSuppliers = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
        const storedPurchases = localStorage.getItem(STORAGE_KEYS.PURCHASES);
        const storedSales = localStorage.getItem(STORAGE_KEYS.SALES);
        const storedPayments = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
        const storedExpenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
        const storedMovements = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
        const storedConversions = localStorage.getItem(STORAGE_KEYS.CONVERSIONS);

        if (storedSettings) setSettings(JSON.parse(storedSettings));
        if (storedProducts) setProducts(JSON.parse(storedProducts));
        if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
        if (storedSuppliers) setSuppliers(JSON.parse(storedSuppliers));
        if (storedPurchases) setPurchases(JSON.parse(storedPurchases));
        if (storedSales) setSales(JSON.parse(storedSales));
        if (storedPayments) setPayments(JSON.parse(storedPayments));
        if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
        if (storedMovements) setStockMovements(JSON.parse(storedMovements));
        if (storedConversions) setStockConversions(JSON.parse(storedConversions));
      } catch (e) {
        console.error('Failed to parse local storage:', e);
      }

      setIsLoading(false);
    }

    loadData();
  }, []);

  // Sync to local storage
  const syncToLocal = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage quota or access error:', e);
    }
  };

  const updateSettings = async (updates: Partial<BusinessSettings>) => {
    const updated = { ...settings, ...updates, updated_at: new Date().toISOString() };
    setSettings(updated);
    syncToLocal(STORAGE_KEYS.SETTINGS, updated);

    if (isSupabaseLive && supabase) {
      await supabase.from('business_settings').update(updates).eq('id', settings.id);
    }
    return { success: true };
  };

  const addProduct = async (productData: Omit<Product, 'id'>) => {
    const id = `p_${Date.now()}`;
    const newProduct: Product = { ...productData, id };
    const updatedList = [newProduct, ...products];
    setProducts(updatedList);
    syncToLocal(STORAGE_KEYS.PRODUCTS, updatedList);

    if (newProduct.stock_quantity_grams > 0) {
      // Record initial stock opening balance in movements
      const movId = `sm_${Date.now()}`;
      const newMovement: StockMovement = {
        id: movId,
        product_id: id,
        movement_type: 'adjustment_gain',
        quantity_grams: newProduct.stock_quantity_grams,
        balance_after_grams: newProduct.stock_quantity_grams,
        unit_cost: newProduct.cost_per_kg,
        reference_type: 'adjustment',
        reference_id: 'INITIAL_STOCK',
        notes: 'Initial product opening stock balance',
        created_at: new Date().toISOString(),
      };
      const updatedMovements = [newMovement, ...stockMovements];
      setStockMovements(updatedMovements);
      syncToLocal(STORAGE_KEYS.MOVEMENTS, updatedMovements);
    }

    if (isSupabaseLive && supabase) {
      await supabase.from('products').insert([newProduct]);
    }
    return { success: true };
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const updatedList = products.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setProducts(updatedList);
    syncToLocal(STORAGE_KEYS.PRODUCTS, updatedList);

    if (isSupabaseLive && supabase) {
      await supabase.from('products').update(updates).eq('id', id);
    }
    return { success: true };
  };

  const adjustStock = async (productId: string, adjustmentGrams: number, reason: string) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return { success: false, error: 'Product not found.' };

    const newStock = targetProduct.stock_quantity_grams + adjustmentGrams;
    if (newStock < 0) {
      return { success: false, error: `Cannot reduce stock below zero. Current: ${targetProduct.stock_quantity_grams}g.` };
    }

    const movementType = adjustmentGrams >= 0 ? 'adjustment_gain' : 'adjustment_loss';
    const movId = `sm_${Date.now()}`;
    const newMovement: StockMovement = {
      id: movId,
      product_id: productId,
      movement_type: movementType,
      quantity_grams: adjustmentGrams,
      balance_after_grams: newStock,
      unit_cost: targetProduct.cost_per_kg,
      reference_type: 'adjustment',
      reference_id: `ADJ-${Date.now()}`,
      notes: reason || 'Manual stock count adjustment',
      created_at: new Date().toISOString(),
    };

    const updatedProducts = products.map((p) =>
      p.id === productId ? { ...p, stock_quantity_grams: newStock } : p
    );
    const updatedMovements = [newMovement, ...stockMovements];

    setProducts(updatedProducts);
    setStockMovements(updatedMovements);
    syncToLocal(STORAGE_KEYS.PRODUCTS, updatedProducts);
    syncToLocal(STORAGE_KEYS.MOVEMENTS, updatedMovements);

    if (isSupabaseLive && supabase) {
      await supabase.from('products').update({ stock_quantity_grams: newStock }).eq('id', productId);
      await supabase.from('stock_movements').insert([newMovement]);
    }

    return { success: true };
  };

  const repackBulkTea = async (
    sourceProductId: string,
    bulkGramsDeducted: number,
    targetProductId: string,
    packetsProduced: number,
    packagingCost: number,
    wasteGrams: number,
    notes?: string
  ) => {
    const sourceProd = products.find((p) => p.id === sourceProductId);
    const targetProd = products.find((p) => p.id === targetProductId);

    if (!sourceProd || !targetProd) {
      return { success: false, error: 'Source or target product not found.' };
    }

    if (sourceProd.stock_quantity_grams < bulkGramsDeducted) {
      return {
        success: false,
        error: `Insufficient bulk tea stock. Available: ${sourceProd.stock_quantity_grams}g, Requested: ${bulkGramsDeducted}g`,
      };
    }

    const outputGrams = packetsProduced * targetProd.package_weight_grams;
    if (outputGrams + wasteGrams > bulkGramsDeducted) {
      return {
        success: false,
        error: `Total produced (${outputGrams}g) plus waste (${wasteGrams}g) exceeds bulk deducted (${bulkGramsDeducted}g).`,
      };
    }

    const convNumber = `RPK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const convId = `conv_${Date.now()}`;

    const newSourceStock = sourceProd.stock_quantity_grams - bulkGramsDeducted;
    const newTargetStock = targetProd.stock_quantity_grams + outputGrams;

    const newConversion: StockConversion = {
      id: convId,
      conversion_number: convNumber,
      source_product_id: sourceProductId,
      bulk_grams_deducted: bulkGramsDeducted,
      target_product_id: targetProductId,
      packets_produced: packetsProduced,
      packaging_cost_total: packagingCost,
      waste_grams: wasteGrams,
      notes: notes || `Repacked ${bulkGramsDeducted}g bulk into ${packetsProduced} packets of ${targetProd.name}`,
      created_at: new Date().toISOString(),
    };

    const mov1: StockMovement = {
      id: `sm_${Date.now()}_1`,
      product_id: sourceProductId,
      movement_type: 'repack_source',
      quantity_grams: -bulkGramsDeducted,
      balance_after_grams: newSourceStock,
      unit_cost: sourceProd.cost_per_kg,
      reference_type: 'repack',
      reference_id: convNumber,
      notes: `Repacked into ${packetsProduced} packets of ${targetProd.name}`,
      created_at: new Date().toISOString(),
    };

    const mov2: StockMovement = {
      id: `sm_${Date.now()}_2`,
      product_id: targetProductId,
      movement_type: 'repack_dest',
      quantity_grams: outputGrams,
      balance_after_grams: newTargetStock,
      unit_cost: targetProd.cost_per_kg,
      reference_type: 'repack',
      reference_id: convNumber,
      notes: `Produced ${packetsProduced} packets from bulk ${sourceProd.name}`,
      created_at: new Date().toISOString(),
    };

    const updatedProducts = products.map((p) => {
      if (p.id === sourceProductId) return { ...p, stock_quantity_grams: newSourceStock };
      if (p.id === targetProductId) return { ...p, stock_quantity_grams: newTargetStock };
      return p;
    });

    const updatedMovements = [mov1, mov2, ...stockMovements];
    const updatedConversions = [newConversion, ...stockConversions];

    // If packaging cost > 0, log it as an expense automatically
    let updatedExpenses = expenses;
    if (packagingCost > 0) {
      const expId = `ex_${Date.now()}`;
      const newExpense: Expense = {
        id: expId,
        expense_number: `EXP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        category: 'Packaging & Pouches',
        description: `Packaging materials for conversion ${convNumber} (${packetsProduced} pkts)`,
        amount: packagingCost,
        payment_method: 'cash',
        reference_code: convNumber,
        expense_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
      };
      updatedExpenses = [newExpense, ...expenses];
      setExpenses(updatedExpenses);
      syncToLocal(STORAGE_KEYS.EXPENSES, updatedExpenses);
    }

    setProducts(updatedProducts);
    setStockMovements(updatedMovements);
    setStockConversions(updatedConversions);

    syncToLocal(STORAGE_KEYS.PRODUCTS, updatedProducts);
    syncToLocal(STORAGE_KEYS.MOVEMENTS, updatedMovements);
    syncToLocal(STORAGE_KEYS.CONVERSIONS, updatedConversions);

    return { success: true };
  };

  const postSale = async (
    saleData: Omit<Sale, 'id' | 'invoice_number' | 'status' | 'posted_at' | 'created_at' | 'items'> & { items: Omit<SaleItem, 'id' | 'sale_id'>[] }
  ) => {
    // 1. Verify stock availability for all items to prevent negative stock
    for (const item of saleData.items) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) {
        return { success: false, error: `Product not found: ${item.product_name_snapshot}` };
      }
      if (product.stock_quantity_grams < item.quantity_grams) {
        return {
          success: false,
          error: `Insufficient stock for "${product.name}". Available: ${product.stock_quantity_grams}g, Required: ${item.quantity_grams}g`,
        };
      }
    }

    const nextInvoiceNum = `INV-${new Date().getFullYear()}-${String(sales.length + 1).padStart(4, '0')}`;
    const saleId = `sale_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const createdSaleItems: SaleItem[] = saleData.items.map((item, idx) => ({
      ...item,
      id: `si_${Date.now()}_${idx}`,
      sale_id: saleId,
    }));

    // Deduct stock and build movement records
    const newMovements: StockMovement[] = [];
    const productUpdatesMap: Record<string, number> = {};

    for (const item of saleData.items) {
      const product = products.find((p) => p.id === item.product_id)!;
      const currentGrams = productUpdatesMap[item.product_id] ?? product.stock_quantity_grams;
      const newStockGrams = currentGrams - item.quantity_grams;
      productUpdatesMap[item.product_id] = newStockGrams;

      newMovements.push({
        id: `sm_${Date.now()}_${item.product_id}`,
        product_id: item.product_id,
        movement_type: 'sale_dispatch',
        quantity_grams: -item.quantity_grams,
        balance_after_grams: newStockGrams,
        unit_cost: item.unit_cost_snapshot,
        reference_type: 'sale',
        reference_id: nextInvoiceNum,
        notes: `Dispatched on invoice ${nextInvoiceNum}`,
        created_at: nowIso,
      });
    }

    const updatedProducts = products.map((p) => {
      if (productUpdatesMap[p.id] !== undefined) {
        return { ...p, stock_quantity_grams: productUpdatesMap[p.id] };
      }
      return p;
    });

    const newSale: Sale = {
      ...saleData,
      id: saleId,
      invoice_number: nextInvoiceNum,
      status: 'posted',
      posted_at: nowIso,
      created_at: nowIso,
      items: createdSaleItems,
    };

    // If payment was made at checkout, record payment transaction
    let updatedPayments = payments;
    if (saleData.amount_paid > 0) {
      const payNumber = `PAY-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const newPayment: Payment = {
        id: `pay_${Date.now()}`,
        payment_number: payNumber,
        party_type: 'customer',
        customer_id: saleData.customer_id,
        sale_id: saleId,
        payment_date: saleData.sale_date,
        amount: saleData.amount_paid,
        payment_method: saleData.payment_method,
        reference_code: saleData.payment_reference,
        notes: `Payment received at checkout for invoice ${nextInvoiceNum}`,
        created_at: nowIso,
      };
      updatedPayments = [newPayment, ...payments];
      setPayments(updatedPayments);
      syncToLocal(STORAGE_KEYS.PAYMENTS, updatedPayments);
    }

    // Update customer balance if on credit or partial
    let updatedCustomers = customers;
    if (saleData.customer_id && saleData.balance_due > 0) {
      updatedCustomers = customers.map((c) =>
        c.id === saleData.customer_id
          ? { ...c, current_balance: c.current_balance + saleData.balance_due }
          : c
      );
      setCustomers(updatedCustomers);
      syncToLocal(STORAGE_KEYS.CUSTOMERS, updatedCustomers);
    }

    const updatedSales = [newSale, ...sales];
    const updatedMovements = [...newMovements, ...stockMovements];

    setSales(updatedSales);
    setProducts(updatedProducts);
    setStockMovements(updatedMovements);

    syncToLocal(STORAGE_KEYS.SALES, updatedSales);
    syncToLocal(STORAGE_KEYS.PRODUCTS, updatedProducts);
    syncToLocal(STORAGE_KEYS.MOVEMENTS, updatedMovements);

    return { success: true, invoiceNumber: nextInvoiceNum };
  };

  const createPurchase = async (
    purchaseData: Omit<Purchase, 'id' | 'purchase_number' | 'status' | 'received_date' | 'items'>,
    items: Omit<PurchaseItem, 'id' | 'purchase_id'>[]
  ) => {
    const purchaseId = `po_${Date.now()}`;
    const purchaseNumber = `PO-${new Date().getFullYear()}-${String(purchases.length + 1).padStart(4, '0')}`;
    const nowIso = new Date().toISOString();

    const createdItems: PurchaseItem[] = items.map((it, idx) => ({
      ...it,
      id: `pi_${Date.now()}_${idx}`,
      purchase_id: purchaseId,
    }));

    const newPurchase: Purchase = {
      ...purchaseData,
      id: purchaseId,
      purchase_number: purchaseNumber,
      status: 'ordered',
      received_date: null,
      created_at: nowIso,
      items: createdItems,
    };

    const updatedPurchases = [newPurchase, ...purchases];
    setPurchases(updatedPurchases);
    syncToLocal(STORAGE_KEYS.PURCHASES, updatedPurchases);

    return { success: true };
  };

  const receivePurchase = async (purchaseId: string) => {
    const purchase = purchases.find((p) => p.id === purchaseId);
    if (!purchase) return { success: false, error: 'Purchase not found.' };
    if (purchase.status === 'received') return { success: false, error: 'Purchase already received.' };

    const nowIso = new Date().toISOString();
    const todayStr = new Date().toISOString().split('T')[0];

    const newMovements: StockMovement[] = [];
    const productUpdatesMap: Record<string, { stock: number; cost: number }> = {};

    for (const item of purchase.items || []) {
      const prod = products.find((p) => p.id === item.product_id);
      if (!prod) continue;

      const currentStock = productUpdatesMap[item.product_id]?.stock ?? prod.stock_quantity_grams;
      const newStock = currentStock + item.quantity_grams;
      const calculatedCostPerKg = item.quantity_grams > 0 ? (item.total_cost / (item.quantity_grams / 1000)) : prod.cost_per_kg;

      productUpdatesMap[item.product_id] = { stock: newStock, cost: calculatedCostPerKg };

      newMovements.push({
        id: `sm_${Date.now()}_${item.product_id}`,
        product_id: item.product_id,
        movement_type: 'purchase_receive',
        quantity_grams: item.quantity_grams,
        balance_after_grams: newStock,
        unit_cost: item.unit_cost_per_unit,
        reference_type: 'purchase',
        reference_id: purchase.purchase_number,
        notes: `Goods received from PO ${purchase.purchase_number}`,
        created_at: nowIso,
      });
    }

    const updatedProducts = products.map((p) => {
      if (productUpdatesMap[p.id]) {
        return {
          ...p,
          stock_quantity_grams: productUpdatesMap[p.id].stock,
          cost_per_kg: productUpdatesMap[p.id].cost,
        };
      }
      return p;
    });

    const updatedPurchases = purchases.map((p) =>
      p.id === purchaseId
        ? { ...p, status: 'received' as const, received_date: todayStr }
        : p
    );

    // Update supplier balance if balance due
    let updatedSuppliers = suppliers;
    if (purchase.balance_due > 0) {
      updatedSuppliers = suppliers.map((s) =>
        s.id === purchase.supplier_id
          ? { ...s, current_balance: s.current_balance + purchase.balance_due }
          : s
      );
      setSuppliers(updatedSuppliers);
      syncToLocal(STORAGE_KEYS.SUPPLIERS, updatedSuppliers);
    }

    const updatedMovements = [...newMovements, ...stockMovements];

    setPurchases(updatedPurchases);
    setProducts(updatedProducts);
    setStockMovements(updatedMovements);

    syncToLocal(STORAGE_KEYS.PURCHASES, updatedPurchases);
    syncToLocal(STORAGE_KEYS.PRODUCTS, updatedProducts);
    syncToLocal(STORAGE_KEYS.MOVEMENTS, updatedMovements);

    return { success: true };
  };

  const recordPayment = async (paymentData: Omit<Payment, 'id' | 'payment_number' | 'created_at'>) => {
    const payNumber = `PAY-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const payId = `pay_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newPayment: Payment = {
      ...paymentData,
      id: payId,
      payment_number: payNumber,
      created_at: nowIso,
    };

    // If customer payment, deduct customer balance
    if (paymentData.party_type === 'customer' && paymentData.customer_id) {
      const updatedCustomers = customers.map((c) =>
        c.id === paymentData.customer_id
          ? { ...c, current_balance: Math.max(0, c.current_balance - paymentData.amount) }
          : c
      );
      setCustomers(updatedCustomers);
      syncToLocal(STORAGE_KEYS.CUSTOMERS, updatedCustomers);

      // If tied to sale, update sale balance
      if (paymentData.sale_id) {
        const updatedSales = sales.map((s) => {
          if (s.id === paymentData.sale_id) {
            const newPaid = s.amount_paid + paymentData.amount;
            const newBal = Math.max(0, s.total_amount - newPaid);
            const newStatus = newBal === 0 ? ('paid' as const) : ('partial' as const);
            return {
              ...s,
              amount_paid: newPaid,
              balance_due: newBal,
              payment_status: newStatus,
            };
          }
          return s;
        });
        setSales(updatedSales);
        syncToLocal(STORAGE_KEYS.SALES, updatedSales);
      }
    }

    // If supplier payment, deduct supplier balance
    if (paymentData.party_type === 'supplier' && paymentData.supplier_id) {
      const updatedSuppliers = suppliers.map((s) =>
        s.id === paymentData.supplier_id
          ? { ...s, current_balance: Math.max(0, s.current_balance - paymentData.amount) }
          : s
      );
      setSuppliers(updatedSuppliers);
      syncToLocal(STORAGE_KEYS.SUPPLIERS, updatedSuppliers);

      if (paymentData.purchase_id) {
        const updatedPurchases = purchases.map((p) => {
          if (p.id === paymentData.purchase_id) {
            const newPaid = p.amount_paid + paymentData.amount;
            const newBal = Math.max(0, p.total_amount - newPaid);
            const newStatus = newBal === 0 ? ('paid' as const) : ('partial' as const);
            return {
              ...p,
              amount_paid: newPaid,
              balance_due: newBal,
              payment_status: newStatus,
            };
          }
          return p;
        });
        setPurchases(updatedPurchases);
        syncToLocal(STORAGE_KEYS.PURCHASES, updatedPurchases);
      }
    }

    const updatedPayments = [newPayment, ...payments];
    setPayments(updatedPayments);
    syncToLocal(STORAGE_KEYS.PAYMENTS, updatedPayments);

    return { success: true };
  };

  const recordExpense = async (expenseData: Omit<Expense, 'id' | 'expense_number' | 'created_at'>) => {
    const expNumber = `EXP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const expId = `exp_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newExpense: Expense = {
      ...expenseData,
      id: expId,
      expense_number: expNumber,
      created_at: nowIso,
    };

    const updatedExpenses = [newExpense, ...expenses];
    setExpenses(updatedExpenses);
    syncToLocal(STORAGE_KEYS.EXPENSES, updatedExpenses);

    return { success: true };
  };

  const addCustomer = async (custData: Omit<Customer, 'id' | 'current_balance'>) => {
    const newCust: Customer = {
      ...custData,
      id: `c_${Date.now()}`,
      current_balance: custData.opening_balance || 0,
      created_at: new Date().toISOString(),
    };
    const updated = [newCust, ...customers];
    setCustomers(updated);
    syncToLocal(STORAGE_KEYS.CUSTOMERS, updated);
    return { success: true };
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    const updated = customers.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setCustomers(updated);
    syncToLocal(STORAGE_KEYS.CUSTOMERS, updated);
    return { success: true };
  };

  const addSupplier = async (supData: Omit<Supplier, 'id' | 'current_balance'>) => {
    const newSup: Supplier = {
      ...supData,
      id: `s_${Date.now()}`,
      current_balance: supData.opening_balance || 0,
      created_at: new Date().toISOString(),
    };
    const updated = [newSup, ...suppliers];
    setSuppliers(updated);
    syncToLocal(STORAGE_KEYS.SUPPLIERS, updated);
    return { success: true };
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    const updated = suppliers.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setSuppliers(updated);
    syncToLocal(STORAGE_KEYS.SUPPLIERS, updated);
    return { success: true };
  };

  const resetToDemoData = () => {
    setSettings(INITIAL_SETTINGS);
    setProducts(INITIAL_PRODUCTS);
    setCustomers(INITIAL_CUSTOMERS);
    setSuppliers(INITIAL_SUPPLIERS);
    setPurchases(INITIAL_PURCHASES);
    setSales(INITIAL_SALES);
    setPayments(INITIAL_PAYMENTS);
    setExpenses(INITIAL_EXPENSES);
    setStockMovements(INITIAL_STOCK_MOVEMENTS);
    setStockConversions(INITIAL_CONVERSIONS);

    syncToLocal(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    syncToLocal(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    syncToLocal(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    syncToLocal(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
    syncToLocal(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES);
    syncToLocal(STORAGE_KEYS.SALES, INITIAL_SALES);
    syncToLocal(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
    syncToLocal(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    syncToLocal(STORAGE_KEYS.MOVEMENTS, INITIAL_STOCK_MOVEMENTS);
    syncToLocal(STORAGE_KEYS.CONVERSIONS, INITIAL_CONVERSIONS);
  };

  const exportDataAsJson = () => {
    const exportBundle = {
      exported_at: new Date().toISOString(),
      business_settings: settings,
      products,
      customers,
      suppliers,
      purchases,
      sales,
      payments,
      expenses,
      stock_movements: stockMovements,
      stock_conversions: stockConversions,
    };
    return JSON.stringify(exportBundle, null, 2);
  };

  return (
    <StoreContext.Provider
      value={{
        settings,
        products,
        customers,
        suppliers,
        purchases,
        sales,
        payments,
        expenses,
        stockMovements,
        stockConversions,
        isSupabaseLive,
        isLoading,
        postSale,
        receivePurchase,
        createPurchase,
        repackBulkTea,
        adjustStock,
        recordPayment,
        recordExpense,
        addProduct,
        updateProduct,
        addCustomer,
        updateCustomer,
        addSupplier,
        updateSupplier,
        updateSettings,
        resetToDemoData,
        exportDataAsJson,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
