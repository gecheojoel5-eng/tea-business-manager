'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShoppingCart,
  Plus,
  Search,
  Printer,
  X,
  CreditCard,
  PlusCircle,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Building,
  User,
  QrCode,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import {
  CustomerType,
  PaymentMethod,
  Sale,
  TaxCategoryCode,
} from '@/lib/types';
import {
  formatKES,
  formatWeight,
  formatKenyanDate,
  formatKenyanDateTime,
  getPaymentMethodLabel,
  getTaxRate,
  getTaxCategoryName,
} from '@/lib/formatters';

function SalesContent() {
  const searchParams = useSearchParams();
  const {
    sales,
    customers,
    products,
    settings,
    postSale,
  } = useStore();

  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState<'all' | 'paid' | 'partial' | 'credit'>('all');

  // Fast Sales Form Modal
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  // View / Print Invoice Modal
  const [selectedSaleForView, setSelectedSaleForView] = useState<Sale | null>(null);

  // New Sale Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('walkin');
  const [walkinName, setWalkinName] = useState('Walk-in Retail Buyer');
  const [pricingTier, setPricingTier] = useState<CustomerType>('retail');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [paymentReference, setPaymentReference] = useState('');
  const [amountPaidNow, setAmountPaidNow] = useState<number>(0);
  const [discountTotal, setDiscountTotal] = useState<number>(0);
  const [etimsRef, setEtimsRef] = useState('');
  const [notes, setNotes] = useState('');
  const [postError, setPostError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Line items state
  const [saleItems, setSaleItems] = useState<
    Array<{
      product_id: string;
      quantity_units: number;
      unit_price: number;
    }>
  >([
    {
      product_id: products[0]?.id || '',
      quantity_units: 1,
      unit_price: products[0]?.retail_price || 0,
    },
  ]);

  // Open modal if ?new=true query param is present
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      openNewSaleModal();
    }
    const viewId = searchParams.get('view');
    if (viewId) {
      const found = sales.find((s) => s.id === viewId);
      if (found) setSelectedSaleForView(found);
    }
  }, [searchParams, sales]);

  const openNewSaleModal = () => {
    setSelectedCustomerId('walkin');
    setWalkinName('Walk-in Retail Buyer');
    setPricingTier('retail');
    setSaleDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('mpesa');
    setPaymentReference('');
    setDiscountTotal(0);
    setEtimsRef('');
    setNotes('');
    setPostError('');

    const defaultProd = products[0];
    const initialPrice = defaultProd ? defaultProd.retail_price : 0;

    setSaleItems([
      {
        product_id: defaultProd?.id || '',
        quantity_units: 1,
        unit_price: initialPrice,
      },
    ]);

    // calculate initial total
    setAmountPaidNow(initialPrice);
    setIsSalesModalOpen(true);
  };

  const handleCustomerChange = (custId: string) => {
    setSelectedCustomerId(custId);
    if (custId === 'walkin') {
      setPricingTier('retail');
      // Update item prices to retail
      updateItemPricesForTier('retail');
    } else {
      const cust = customers.find((c) => c.id === custId);
      if (cust) {
        setPricingTier(cust.customer_type);
        updateItemPricesForTier(cust.customer_type);
      }
    }
  };

  const handleTierChange = (tier: CustomerType) => {
    setPricingTier(tier);
    updateItemPricesForTier(tier);
  };

  const updateItemPricesForTier = (tier: CustomerType) => {
    const updated = saleItems.map((item) => {
      const prod = products.find((p) => p.id === item.product_id);
      if (prod) {
        return {
          ...item,
          unit_price: tier === 'wholesale' ? prod.wholesale_price : prod.retail_price,
        };
      }
      return item;
    });
    setSaleItems(updated);
  };

  const handleAddItem = () => {
    const defaultProd = products[0];
    const unitPrice =
      pricingTier === 'wholesale' ? defaultProd?.wholesale_price || 0 : defaultProd?.retail_price || 0;

    setSaleItems([
      ...saleItems,
      {
        product_id: defaultProd?.id || '',
        quantity_units: 1,
        unit_price: unitPrice,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (saleItems.length <= 1) return;
    setSaleItems(saleItems.filter((_, idx) => idx !== index));
  };

  const handleItemProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    const updated = [...saleItems];
    if (prod) {
      updated[index].product_id = productId;
      updated[index].unit_price =
        pricingTier === 'wholesale' ? prod.wholesale_price : prod.retail_price;
    }
    setSaleItems(updated);
  };

  const handleItemQtyChange = (index: number, qty: number) => {
    const updated = [...saleItems];
    updated[index].quantity_units = qty;
    setSaleItems(updated);
  };

  const handleItemPriceChange = (index: number, price: number) => {
    const updated = [...saleItems];
    updated[index].unit_price = price;
    setSaleItems(updated);
  };

  // --- Dynamic Calculations ---
  // Subtotal without tax
  const subtotal = saleItems.reduce(
    (sum, it) => sum + (it.quantity_units || 0) * (it.unit_price || 0),
    0
  );

  // Product-level tax calculations (cleanly separated)
  let calculatedTax = 0;
  saleItems.forEach((it) => {
    const prod = products.find((p) => p.id === it.product_id);
    if (prod && settings.is_vat_registered) {
      const taxRate = getTaxRate(prod.tax_category);
      if (taxRate > 0) {
        calculatedTax += (it.quantity_units * it.unit_price * taxRate) / 100;
      }
    }
  });

  const grandTotal = Math.max(0, subtotal - discountTotal + calculatedTax);

  // Set paid now to grand total when cash/mpesa is selected and user hasn't explicitly set credit
  const handleQuickPayFull = () => {
    setAmountPaidNow(grandTotal);
  };

  const handleQuickPayCredit = () => {
    setAmountPaidNow(0);
    setPaymentMethod('credit');
  };

  // Submit and Post Sale Atomically
  const handlePostSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostError('');
    setIsSubmitting(true);

    if (saleItems.length === 0 || saleItems.some((it) => it.quantity_units <= 0)) {
      setPostError('Please ensure all items have valid quantities.');
      setIsSubmitting(false);
      return;
    }

    // Verify stock availability
    for (const it of saleItems) {
      const prod = products.find((p) => p.id === it.product_id);
      if (!prod) continue;
      const packageWeight = prod.product_type === 'bulk' ? 1000 : prod.package_weight_grams || 1000;
      const requiredGrams =
        prod.product_type === 'bulk'
          ? Math.round(it.quantity_units * 1000)
          : Math.round(it.quantity_units * packageWeight);

      if (prod.stock_quantity_grams < requiredGrams) {
        setPostError(
          `Insufficient stock for "${prod.name}". Available: ${formatWeight(
            prod.stock_quantity_grams
          )}, Requested: ${formatWeight(requiredGrams)}`
        );
        setIsSubmitting(false);
        return;
      }
    }

    const customerObj =
      selectedCustomerId !== 'walkin'
        ? customers.find((c) => c.id === selectedCustomerId)
        : null;

    const custName = customerObj ? customerObj.name : walkinName;
    const balanceDue = Math.max(0, grandTotal - amountPaidNow);
    const paymentStatus =
      amountPaidNow >= grandTotal ? 'paid' : amountPaidNow > 0 ? 'partial' : 'credit';

    // Prepare line items
    const preparedItems = saleItems.map((it) => {
      const prod = products.find((p) => p.id === it.product_id)!;
      const packageWeight = prod.product_type === 'bulk' ? 1000 : prod.package_weight_grams || 1000;
      const grams =
        prod.product_type === 'bulk'
          ? Math.round(it.quantity_units * 1000)
          : Math.round(it.quantity_units * packageWeight);

      const taxRate = settings.is_vat_registered ? getTaxRate(prod.tax_category) : 0;
      const lineTax = (it.quantity_units * it.unit_price * taxRate) / 100;
      const lineTotal = it.quantity_units * it.unit_price + lineTax;

      return {
        product_id: it.product_id,
        product_name_snapshot: prod.name,
        quantity_units: it.quantity_units,
        quantity_grams: grams,
        unit_price: it.unit_price,
        unit_cost_snapshot: prod.cost_per_kg,
        tax_category: prod.tax_category,
        tax_rate: taxRate,
        tax_amount: lineTax,
        discount_amount: 0,
        line_total: lineTotal,
      };
    });

    const res = await postSale({
      customer_id: customerObj ? customerObj.id : null,
      customer_name_snapshot: custName,
      customer_type_snapshot: pricingTier,
      pricing_tier: pricingTier,
      sale_date: saleDate,
      subtotal: subtotal,
      discount_amount: discountTotal,
      tax_amount: calculatedTax,
      total_amount: grandTotal,
      amount_paid: amountPaidNow,
      balance_due: balanceDue,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      payment_reference: paymentReference || null,
      etims_reference: etimsRef || null,
      notes: notes || null,
      items: preparedItems,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setPostError(res.error || 'Failed to post sale.');
      return;
    }

    setIsSalesModalOpen(false);

    // Auto open printable receipt modal for the new invoice
    const newSale = sales.find((s) => s.invoice_number === res.invoiceNumber);
    if (newSale) {
      setSelectedSaleForView(newSale);
    }
  };

  const filteredSales = sales.filter((s) => {
    const q = search.toLowerCase();
    const match =
      s.invoice_number.toLowerCase().includes(q) ||
      s.customer_name_snapshot.toLowerCase().includes(q) ||
      (s.payment_reference && s.payment_reference.toLowerCase().includes(q)) ||
      (s.etims_reference && s.etims_reference.toLowerCase().includes(q));

    if (!match) return false;
    if (filterPayment === 'all') return true;
    return s.payment_status === filterPayment;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales & Invoicing</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Fast Point-of-Sale (POS) cashier, wholesale invoices, M-Pesa tracking, and printable customer receipts.
          </p>
        </div>

        <button
          onClick={openNewSaleModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-95"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>New Sale / POS Checkout</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs no-print">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice #, customer, M-Pesa code, eTIMS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterPayment('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              filterPayment === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Sales ({sales.length})
          </button>
          <button
            onClick={() => setFilterPayment('paid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              filterPayment === 'paid'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            Paid in Full
          </button>
          <button
            onClick={() => setFilterPayment('partial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              filterPayment === 'partial'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            Partial Deposit
          </button>
          <button
            onClick={() => setFilterPayment('credit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              filterPayment === 'credit'
                ? 'bg-rose-700 text-white'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            Credit (Unpaid)
          </button>
        </div>
      </div>

      {/* Sales Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Pricing Tier</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Tax (VAT)</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Payment Status</th>
                <th className="py-3 px-4">Method / Ref</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-emerald-800">
                    {s.invoice_number}
                    {s.etims_reference && (
                      <span className="block text-[10px] text-teal-700 font-mono mt-0.5">
                        eTIMS: {s.etims_reference}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs">
                    {formatKenyanDate(s.sale_date)}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {s.customer_name_snapshot}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        s.pricing_tier === 'wholesale'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {s.pricing_tier}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">
                    {formatKES(s.subtotal)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500 text-xs">
                    {formatKES(s.tax_amount)}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-slate-900">
                    {formatKES(s.total_amount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        s.payment_status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.payment_status === 'partial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {s.payment_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600">
                    <span className="font-semibold uppercase">{s.payment_method}</span>
                    {s.payment_reference && (
                      <span className="block text-[11px] font-mono text-emerald-700">
                        {s.payment_reference}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedSaleForView(s)}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-emerald-800 border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center gap-1 ml-auto"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- FAST SALE / POS MODAL --- */}
      {isSalesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl overflow-y-auto max-h-[92vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Fast Sales / POS Cashier</h3>
                  <p className="text-xs text-slate-500">
                    Issue invoice, deduct inventory atomically, and record customer receipt.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSalesModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {postError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{postError}</span>
              </div>
            )}

            <form onSubmit={handlePostSale} className="space-y-4 mt-4">
              {/* Customer & Pricing Tier Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Customer *
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="walkin">-- Walk-in Retail Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.customer_type} • Balance: {formatKES(c.current_balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pricing Tier *
                  </label>
                  <div className="flex rounded-lg border border-slate-200 p-0.5 bg-white">
                    <button
                      type="button"
                      onClick={() => handleTierChange('retail')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                        pricingTier === 'retail'
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Retail
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTierChange('wholesale')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                        pricingTier === 'wholesale'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Wholesale
                    </button>
                  </div>
                </div>
              </div>

              {selectedCustomerId === 'walkin' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Walk-in Customer Name or Reference
                  </label>
                  <input
                    type="text"
                    value={walkinName}
                    onChange={(e) => setWalkinName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              )}

              {/* Line Items */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase">
                    Sale Products & Quantities
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Product</span>
                  </button>
                </div>

                {saleItems.map((item, idx) => {
                  const prod = products.find((p) => p.id === item.product_id);
                  const isBulk = prod?.product_type === 'bulk';
                  const availableGrams = prod?.stock_quantity_grams || 0;
                  const itemTotal = (item.quantity_units || 0) * (item.unit_price || 0);

                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs"
                    >
                      {/* Product select */}
                      <div className="col-span-5">
                        <select
                          value={item.product_id}
                          onChange={(e) => handleItemProductChange(idx, e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white font-medium"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Stock: {formatWeight(p.stock_quantity_grams)})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          placeholder={isBulk ? 'Quantity (kg)' : 'Packets'}
                          value={item.quantity_units}
                          onChange={(e) => handleItemQtyChange(idx, Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white text-right font-semibold"
                        />
                        <span className="text-[10px] text-slate-400 block text-right">
                          {isBulk ? 'kg' : 'packets'}
                        </span>
                      </div>

                      {/* Unit Price */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.5"
                          value={item.unit_price}
                          onChange={(e) => handleItemPriceChange(idx, Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white text-right"
                        />
                        <span className="text-[10px] text-slate-400 block text-right">KSh/unit</span>
                      </div>

                      {/* Total */}
                      <div className="col-span-2 text-right font-bold text-slate-900">
                        {formatKES(itemTotal)}
                      </div>

                      {/* Delete button */}
                      <div className="col-span-1 text-center">
                        {saleItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price & Tax Breakdown Summary */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Gross Subtotal:</span>
                  <span className="font-semibold text-slate-800">{formatKES(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Discount (KSh):</span>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    value={discountTotal}
                    onChange={(e) => setDiscountTotal(Number(e.target.value))}
                    className="w-28 px-2 py-1 border border-slate-200 rounded text-right text-xs bg-white"
                  />
                </div>

                {settings.is_vat_registered && (
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Applicable VAT (Configured Categories):</span>
                    <span className="font-semibold text-slate-800">{formatKES(calculatedTax)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
                  <span className="uppercase tracking-wider">Grand Total (KES):</span>
                  <span className="text-xl text-emerald-800">{formatKES(grandTotal)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="mpesa">M-Pesa (Safaricom)</option>
                    <option value="cash">Cash in Hand</option>
                    <option value="bank_transfer">Bank Transfer / RTGS</option>
                    <option value="credit">Credit / Pay Later</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Reference / M-Pesa Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SJK49XLP1"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm uppercase font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Amount Paid Now *
                    </label>
                    <div className="flex gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={handleQuickPayFull}
                        className="text-emerald-700 hover:underline font-semibold"
                      >
                        Full
                      </button>
                      <span>|</span>
                      <button
                        type="button"
                        onClick={handleQuickPayCredit}
                        className="text-rose-700 hover:underline font-semibold"
                      >
                        Credit
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    step="10"
                    value={amountPaidNow}
                    onChange={(e) => setAmountPaidNow(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-right"
                  />
                </div>
              </div>

              {/* Kenyan eTIMS Reference Field */}
              <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 text-xs">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-teal-950 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-teal-700" />
                    <span>External eTIMS Reference (Optional)</span>
                  </span>
                  <span className="text-[10px] text-teal-600">
                    KRA Fiscalization Record
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Enter official eTIMS CU Invoice No. or Ack Code (if processed via eTIMS Client)"
                  value={etimsRef}
                  onChange={(e) => setEtimsRef(e.target.value)}
                  className="w-full px-3 py-1.5 border border-teal-200 rounded-lg text-xs bg-white font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  * Note: Internal sales record. Official tax invoice must be issued through an authorized KRA eTIMS software/device.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSalesModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{isSubmitting ? 'Posting Sale...' : 'Post Sale & Generate Invoice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PRINTABLE INVOICE / RECEIPT MODAL --- */}
      {selectedSaleForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl overflow-y-auto max-h-[95vh] print-container">
            {/* Modal action bar (Hidden on Print) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 no-print mb-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span>Invoice: {selectedSaleForView.invoice_number}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100">
                  {selectedSaleForView.payment_status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setSelectedSaleForView(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* --- ACTUAL INVOICE DOCUMENT --- */}
            <div className="text-slate-800 text-sm">
              {/* Header */}
              <div className="flex justify-between items-start pb-6 border-b-2 border-emerald-900">
                <div>
                  <h2 className="text-2xl font-black text-emerald-950 tracking-tight">
                    {settings.business_name}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">{settings.physical_address}</p>
                  <p className="text-xs text-slate-600">
                    Phone: {settings.phone} • Email: {settings.email}
                  </p>
                  <p className="text-xs font-mono font-semibold text-slate-700 mt-0.5">
                    KRA PIN: {settings.kra_pin || 'P051234567Z'} •{' '}
                    {settings.is_vat_registered ? 'VAT Registered (16%)' : 'Non-VAT Trader'}
                  </p>
                </div>

                <div className="text-right">
                  <div className="inline-block px-3 py-1 bg-emerald-900 text-white font-black text-sm uppercase rounded">
                    SALES INVOICE
                  </div>
                  <p className="text-sm font-mono font-bold text-slate-900 mt-2">
                    {selectedSaleForView.invoice_number}
                  </p>
                  <p className="text-xs text-slate-500">
                    Date: {formatKenyanDate(selectedSaleForView.sale_date)}
                  </p>
                  {selectedSaleForView.etims_reference && (
                    <p className="text-xs font-mono text-teal-800 mt-1">
                      eTIMS Ref: {selectedSaleForView.etims_reference}
                    </p>
                  )}
                </div>
              </div>

              {/* Billed To */}
              <div className="py-4 border-b border-slate-200 flex justify-between items-start text-xs">
                <div>
                  <p className="text-slate-400 uppercase font-semibold text-[10px]">Billed To:</p>
                  <p className="font-bold text-sm text-slate-900 mt-0.5">
                    {selectedSaleForView.customer_name_snapshot}
                  </p>
                  <p className="text-slate-600 capitalize">
                    Account Type: {selectedSaleForView.pricing_tier} Tier
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-slate-400 uppercase font-semibold text-[10px]">
                    Payment Status:
                  </p>
                  <p
                    className={`font-black text-sm mt-0.5 uppercase ${
                      selectedSaleForView.payment_status === 'paid'
                        ? 'text-emerald-700'
                        : selectedSaleForView.payment_status === 'partial'
                        ? 'text-amber-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {selectedSaleForView.payment_status}
                  </p>
                  <p className="text-slate-500">
                    Method: {getPaymentMethodLabel(selectedSaleForView.payment_method)}
                    {selectedSaleForView.payment_reference && ` (${selectedSaleForView.payment_reference})`}
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="py-4">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold">
                      <th className="py-2">Item Description</th>
                      <th className="py-2 text-right">Quantity</th>
                      <th className="py-2 text-right">Unit Price</th>
                      {settings.is_vat_registered && (
                        <th className="py-2 text-right">VAT Rate</th>
                      )}
                      <th className="py-2 text-right">Amount (KES)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedSaleForView.items || []).map((it) => (
                      <tr key={it.id}>
                        <td className="py-2 font-medium text-slate-800">
                          {it.product_name_snapshot}
                          <span className="block text-[10px] text-slate-400">
                            Weight: {formatWeight(it.quantity_grams)}
                          </span>
                        </td>
                        <td className="py-2 text-right font-semibold text-slate-700">
                          {it.quantity_units}
                        </td>
                        <td className="py-2 text-right text-slate-600">
                          {formatKES(it.unit_price)}
                        </td>
                        {settings.is_vat_registered && (
                          <td className="py-2 text-right text-slate-500">
                            {it.tax_rate > 0 ? `${it.tax_rate}%` : '0%'}
                          </td>
                        )}
                        <td className="py-2 text-right font-bold text-slate-900">
                          {formatKES(it.line_total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{formatKES(selectedSaleForView.subtotal)}</span>
                  </div>
                  {selectedSaleForView.discount_amount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Discount:</span>
                      <span className="text-rose-600">
                        -{formatKES(selectedSaleForView.discount_amount)}
                      </span>
                    </div>
                  )}
                  {settings.is_vat_registered && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tax (VAT Total):</span>
                      <span>{formatKES(selectedSaleForView.tax_amount)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-300 flex justify-between font-black text-base text-slate-900">
                    <span>Grand Total:</span>
                    <span className="text-emerald-900">
                      {formatKES(selectedSaleForView.total_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                    <span>Amount Paid:</span>
                    <span>{formatKES(selectedSaleForView.amount_paid)}</span>
                  </div>
                  {selectedSaleForView.balance_due > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold pt-1 border-t border-slate-100">
                      <span>Balance Due:</span>
                      <span>{formatKES(selectedSaleForView.balance_due)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Receipt Footer & eTIMS Disclaimer */}
              <div className="mt-8 pt-4 border-t border-slate-200 text-center space-y-2 text-xs text-slate-500">
                <p className="font-semibold text-slate-700">
                  {settings.receipt_footer_note || 'Asante kwa kufanya biashara nasi! Karibu tena.'}
                </p>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-500 max-w-md mx-auto">
                  <p className="font-medium">
                    {settings.invoice_disclaimer ||
                      'Internal Sales Document. Official eTIMS QR invoice issued separately upon request.'}
                  </p>
                  {selectedSaleForView.etims_reference ? (
                    <p className="mt-1 font-mono text-teal-800 font-semibold">
                      eTIMS Acknowledgment Code: {selectedSaleForView.etims_reference}
                    </p>
                  ) : (
                    <p className="mt-1 text-[10px] text-slate-400">
                      eTIMS Reference not recorded for this transaction.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SalesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading sales and invoicing...</div>}>
      <SalesContent />
    </Suspense>
  );
}
