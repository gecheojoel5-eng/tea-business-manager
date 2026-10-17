'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Printer,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Building,
  Coins,
  ArrowDownCircle,
  ArrowUpCircle,
  Layers,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatKES, formatWeight, formatKenyanDate } from '@/lib/formatters';

type DateFilterPreset = 'today' | 'last7' | 'this_month' | 'all' | 'custom';

export default function ReportsPage() {
  const {
    sales,
    purchases,
    payments,
    expenses,
    products,
    customers,
    suppliers,
    settings,
  } = useStore();

  const [preset, setPreset] = useState<DateFilterPreset>('this_month');
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Handle Preset Changes
  const handlePresetChange = (newPreset: DateFilterPreset) => {
    setPreset(newPreset);
    const today = new Date().toISOString().split('T')[0];

    if (newPreset === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (newPreset === 'last7') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      setStartDate(sevenDaysAgo);
      setEndDate(today);
    } else if (newPreset === 'this_month') {
      const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0];
      setStartDate(firstDay);
      setEndDate(today);
    } else if (newPreset === 'all') {
      setStartDate('2020-01-01');
      setEndDate(today);
    }
  };

  // Filtered Data Sets based on date range
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (s.status !== 'posted') return false;
      return s.sale_date >= startDate && s.sale_date <= endDate;
    });
  }, [sales, startDate, endDate]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const d = p.received_date || p.order_date;
      return d >= startDate && d <= endDate;
    });
  }, [purchases, startDate, endDate]);

  const filteredCustomerPayments = useMemo(() => {
    return payments.filter((p) => {
      return (
        p.party_type === 'customer' &&
        p.payment_date >= startDate &&
        p.payment_date <= endDate
      );
    });
  }, [payments, startDate, endDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      return e.expense_date >= startDate && e.expense_date <= endDate;
    });
  }, [expenses, startDate, endDate]);

  // --- Real Mathematical Metrics ---
  // 1. Total Sales Revenue
  const totalSalesRevenue = filteredSales.reduce((sum, s) => sum + s.total_amount, 0);

  // 2. Cost of Goods Sold (COGS) for the filtered sales
  let totalCogs = 0;
  filteredSales.forEach((s) => {
    (s.items || []).forEach((it) => {
      const prod = products.find((p) => p.id === it.product_id);
      const unitCost = it.unit_cost_snapshot || prod?.cost_per_kg || 0;
      totalCogs += it.quantity_units * unitCost;
    });
  });

  // 3. Gross Profit (Revenue - COGS)
  const grossProfit = totalSalesRevenue - totalCogs;

  // 4. Operating Expenses
  const totalOperatingExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 5. Net Profit (Gross Profit - Operating Expenses)
  const netProfit = grossProfit - totalOperatingExpenses;

  // 6. Cash Inflows vs Credit Sales
  // Actual cash/M-pesa/bank collected during the period:
  const actualCashCollected = filteredCustomerPayments.reduce((sum, p) => sum + p.amount, 0);
  // Credit issued during period:
  const creditIssued = filteredSales
    .filter((s) => s.balance_due > 0)
    .reduce((sum, s) => sum + s.balance_due, 0);

  // 7. Inventory Valuation Breakdown (At Cost)
  let bulkStockValue = 0;
  let packagedStockValue = 0;
  let totalStockGrams = 0;

  products.forEach((p) => {
    totalStockGrams += p.stock_quantity_grams;
    if (p.product_type === 'bulk') {
      const kg = p.stock_quantity_grams / 1000;
      bulkStockValue += kg * p.cost_per_kg;
    } else {
      const packets = p.package_weight_grams > 0 ? p.stock_quantity_grams / p.package_weight_grams : 0;
      packagedStockValue += packets * p.cost_per_kg;
    }
  });

  const totalStockValuation = bulkStockValue + packagedStockValue;

  // 8. Cumulative Balances
  const totalCustomerReceivables = customers.reduce((sum, c) => sum + (c.current_balance || 0), 0);
  const totalSupplierPayables = suppliers.reduce((sum, s) => sum + (s.current_balance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Financial & Stock Reports
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real performance accounting: Gross Profit, Net Profit, Cash Inflows, and Stock Valuation.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-sm shadow-sm transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
          <button
            onClick={() => handlePresetChange('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              preset === 'today'
                ? 'bg-emerald-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => handlePresetChange('last7')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              preset === 'last7'
                ? 'bg-emerald-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => handlePresetChange('this_month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              preset === 'this_month'
                ? 'bg-emerald-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => handlePresetChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              preset === 'all'
                ? 'bg-emerald-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Time
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 w-full md:w-auto">
          <span className="font-semibold">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPreset('custom');
            }}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
          />
          <span className="font-semibold">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPreset('custom');
            }}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
          />
        </div>
      </div>

      {/* --- REPORT PRINTABLE CONTAINER --- */}
      <div className="space-y-6 print-container">
        {/* Printable Title Block */}
        <div className="hidden print:block pb-4 border-b border-slate-300">
          <h2 className="text-xl font-bold">{settings.business_name}</h2>
          <p className="text-xs text-slate-500">
            Performance Statement: {formatKenyanDate(startDate)} to {formatKenyanDate(endDate)}
          </p>
        </div>

        {/* 1. PROFIT & LOSS STATEMENT CARD */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-700" />
                <span>Trading, Profit & Loss Statement</span>
              </h3>
              <p className="text-xs text-slate-500">
                Period: {formatKenyanDate(startDate)} — {formatKenyanDate(endDate)}
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            {/* Sales Revenue */}
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="font-semibold text-slate-800">
                Gross Sales Revenue ({filteredSales.length} invoices)
              </span>
              <span className="font-bold text-slate-900">{formatKES(totalSalesRevenue)}</span>
            </div>

            {/* Less COGS */}
            <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600 pl-4">
              <span>Less: Cost of Goods Sold (Tea Purchase Value)</span>
              <span className="text-rose-600 font-semibold">-{formatKES(totalCogs)}</span>
            </div>

            {/* Gross Profit */}
            <div className="flex justify-between py-2.5 bg-emerald-50/70 px-3 rounded-lg font-black text-emerald-950">
              <span>ESTIMATED GROSS PROFIT</span>
              <span className="text-base text-emerald-800">{formatKES(grossProfit)}</span>
            </div>

            {/* Less Operating Expenses */}
            <div className="flex justify-between py-2 border-b border-slate-100 text-slate-600 pl-4">
              <span>
                Less: Operating Expenses (Transport, Packaging, Labour, Rent)
              </span>
              <span className="text-rose-600 font-semibold">
                -{formatKES(totalOperatingExpenses)}
              </span>
            </div>

            {/* Net Profit */}
            <div
              className={`flex justify-between py-3 px-3 rounded-lg font-black text-base ${
                netProfit >= 0 ? 'bg-emerald-100 text-emerald-950' : 'bg-rose-100 text-rose-950'
              }`}
            >
              <span>ESTIMATED NET OPERATING PROFIT</span>
              <span>{formatKES(netProfit)}</span>
            </div>
          </div>
        </div>

        {/* 2. CASH FLOW REALITY: COLLECTED VS CREDIT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <ArrowDownCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Real Cash / M-Pesa Collected
                </h4>
                <p className="text-xs text-slate-500">
                  Actual funds deposited in bank/till during period
                </p>
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-700">
              {formatKES(actualCashCollected)}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              From {filteredCustomerPayments.length} recorded customer payment receipts. Does NOT count credit sales as cash!
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
                <ArrowUpCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">New Credit Granted</h4>
                <p className="text-xs text-slate-500">Uncollected invoice balances issued</p>
              </div>
            </div>
            <p className="text-2xl font-black text-rose-600">{formatKES(creditIssued)}</p>
            <p className="text-xs text-slate-500 mt-2">
              Dispatched on credit terms to wholesale & retail clients during this date range.
            </p>
          </div>
        </div>

        {/* 3. STOCK VALUATION AUDIT (AT COST) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-700" />
                <span>Current Stock Valuation (Perpetual Inventory at Cost)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Total tea leaves currently held in godown warehouse: {formatWeight(totalStockGrams)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase font-semibold">Total Stock Value</p>
              <p className="text-xl font-black text-slate-900">{formatKES(totalStockValuation)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase block">
                Bulk Raw Tea Leaves
              </span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">
                {formatKES(bulkStockValue)}
              </p>
              <p className="text-xs text-slate-500">
                Stored in raw sacks (e.g. BP1, PF1, DUST1 bulk)
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase block">
                Packaged Retail Tea
              </span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">
                {formatKES(packagedStockValue)}
              </p>
              <p className="text-xs text-slate-500">
                Sealed pouches (250g, 500g, 1kg bags) ready for dispatch
              </p>
            </div>
          </div>

          {/* Product breakdown table */}
          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-2.5">Product Name</th>
                  <th className="p-2.5">Grade / Type</th>
                  <th className="p-2.5 text-right">Stock On Hand</th>
                  <th className="p-2.5 text-right">Unit Cost</th>
                  <th className="p-2.5 text-right">Total Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const val =
                    p.product_type === 'bulk'
                      ? (p.stock_quantity_grams / 1000) * p.cost_per_kg
                      : (p.package_weight_grams > 0 ? p.stock_quantity_grams / p.package_weight_grams : 0) * p.cost_per_kg;

                  return (
                    <tr key={p.id}>
                      <td className="p-2.5 font-medium text-slate-900">{p.name}</td>
                      <td className="p-2.5 text-slate-500">
                        {p.tea_grade} • <span className="uppercase">{p.product_type}</span>
                      </td>
                      <td className="p-2.5 text-right font-semibold text-slate-800">
                        {formatWeight(p.stock_quantity_grams)}
                      </td>
                      <td className="p-2.5 text-right text-slate-600">{formatKES(p.cost_per_kg)}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">{formatKES(val)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. TOTAL BALANCE SHEET RECEIVABLES & PAYABLES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">
                Total Customer Receivables (Debtors)
              </p>
              <p className="text-2xl font-black text-rose-600 mt-1">
                {formatKES(totalCustomerReceivables)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Money owed by tea buyers to date</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">
                Total Supplier Payables (Creditors)
              </p>
              <p className="text-2xl font-black text-slate-800 mt-1">
                {formatKES(totalSupplierPayables)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Money owed to tea estates and vendors</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
