'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Users,
  Package,
  ShoppingCart,
  ArrowUpRight,
  PlusCircle,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatKES, formatWeight, formatKenyanDate } from '@/lib/formatters';

export default function DashboardPage() {
  const {
    products,
    customers,
    sales,
    payments,
    expenses,
    stockMovements,
    isLoading,
  } = useStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading business metrics...</p>
        </div>
      </div>
    );
  }

  // --- Real Database Calculations ---
  const todayStr = new Date().toISOString().split('T')[0];
  const currentYearMonth = todayStr.slice(0, 7); // e.g. "2026-10"

  // 1. Sales Today (only posted sales)
  const salesToday = sales
    .filter((s) => s.status === 'posted' && s.sale_date === todayStr)
    .reduce((sum, s) => sum + s.total_amount, 0);

  // 2. Sales This Month
  const salesThisMonth = sales
    .filter((s) => s.status === 'posted' && s.sale_date.startsWith(currentYearMonth))
    .reduce((sum, s) => sum + s.total_amount, 0);

  // 3. Cash Collected (Actual cash/M-Pesa/Bank payments, never credit sales)
  const cashCollected = payments
    .filter((p) => p.party_type === 'customer')
    .reduce((sum, p) => sum + p.amount, 0);

  // 4. Outstanding Customer Balances (receivables)
  const outstandingCustomerBalances = customers.reduce(
    (sum, c) => sum + (c.current_balance || 0),
    0
  );

  // 5. Total Stock Value (At Purchase Cost)
  // For each product: (stock_quantity_grams / 1000) * cost_per_kg (or cost per packet for packaged)
  const totalStockValue = products.reduce((sum, p) => {
    if (p.product_type === 'bulk') {
      const kg = p.stock_quantity_grams / 1000;
      return sum + kg * p.cost_per_kg;
    } else {
      // Packaged product: cost_per_kg stores packet unit cost
      const packets = p.package_weight_grams > 0 ? p.stock_quantity_grams / p.package_weight_grams : 0;
      return sum + packets * p.cost_per_kg;
    }
  }, 0);

  // 6. Estimated Gross Profit (from posted sales: Revenue - COGS)
  let totalRevenue = 0;
  let totalCogs = 0;
  sales
    .filter((s) => s.status === 'posted')
    .forEach((s) => {
      totalRevenue += s.subtotal - s.discount_amount;
      (s.items || []).forEach((it) => {
        if (it.product_id) {
          const prod = products.find((p) => p.id === it.product_id);
          const unitCost = it.unit_cost_snapshot || prod?.cost_per_kg || 0;
          totalCogs += it.quantity_units * unitCost;
        }
      });
    });
  const estimatedGrossProfit = Math.max(0, totalRevenue - totalCogs);

  // 7. Low Stock Alerts
  const lowStockProducts = products.filter(
    (p) => p.stock_quantity_grams <= p.reorder_threshold_grams
  );

  // Recent 5 sales
  const recentSales = [...sales]
    .sort((a, b) => new Date(b.created_at || b.sale_date).getTime() - new Date(a.created_at || a.sale_date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Habari Yako • Daily Overview</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Tea Leaves Business Dashboard</h1>
          <p className="text-sm text-emerald-200 mt-1 max-w-xl">
            Live operations monitor for wholesale, retail, packing, and cash balances across your business.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/sales?new=true"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-sm shadow transition-all active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Fast POS Sale</span>
          </Link>
          <Link
            href="/products?action=repack"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-950/60 hover:bg-emerald-950 border border-emerald-600/50 text-white font-medium rounded-xl text-sm shadow transition-all"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span>Repack Bulk Tea</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Today */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Sales Today</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {formatKES(salesToday)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {sales.filter((s) => s.status === 'posted' && s.sale_date === todayStr).length} sales recorded today
            </p>
          </div>
        </div>

        {/* Sales This Month */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Sales This Month</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {formatKES(salesThisMonth)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Calendar month revenue</p>
          </div>
        </div>

        {/* Cash Collected */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Cash & M-Pesa Collected</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {formatKES(cashCollected)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Total customer receipts deposited</p>
          </div>
        </div>

        {/* Outstanding Customer Balances */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Customer Balances (Credit)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-rose-600 tracking-tight">
              {formatKES(outstandingCustomerBalances)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Total credit owed by buyers</p>
          </div>
        </div>
      </div>

      {/* Secondary KPI Bar: Stock Value & Gross Profit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Stock Valuation (At Cost)
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {formatKES(totalStockValue)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Across {products.length} products (bulk leaf + retail pouches)
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Estimated Gross Profit (To Date)
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {formatKES(estimatedGrossProfit)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Revenue minus actual Cost of Goods Sold (COGS)
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Low Stock Alerts Section */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2.5 text-amber-900 font-bold text-base mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Low Stock Reorder Alerts ({lowStockProducts.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-lg p-3.5 border border-amber-200 shadow-xs flex items-center justify-between"
              >
                <div>
                  <h4 className="font-semibold text-sm text-slate-900">{p.name}</h4>
                  <p className="text-xs text-slate-500">
                    Grade: <span className="font-medium">{p.tea_grade}</span> • Reorder at{' '}
                    {formatWeight(p.reorder_threshold_grams)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-800 rounded font-bold text-xs">
                    {formatWeight(p.stock_quantity_grams)} left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sales & Operational Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Sales Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              <span>Recent Sales</span>
            </h3>
            <Link
              href="/sales"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentSales.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No sales recorded yet. Click &quot;New Sale / POS&quot; to make your first sale.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                    <th className="pb-3">Invoice</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentSales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 font-semibold text-emerald-800">
                        <Link href={`/sales?view=${s.id}`} className="hover:underline">
                          {s.invoice_number}
                        </Link>
                      </td>
                      <td className="py-3 text-slate-700">{s.customer_name_snapshot}</td>
                      <td className="py-3 text-slate-500">{formatKenyanDate(s.sale_date)}</td>
                      <td className="py-3 font-bold text-slate-900">{formatKES(s.total_amount)}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Col: Quick Actions & Ledger activity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Routine Manager Actions</span>
            </h3>
            <div className="space-y-2.5">
              <Link
                href="/sales?new=true"
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    +
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 group-hover:text-emerald-900">
                      Issue Sale Invoice
                    </h4>
                    <p className="text-xs text-slate-500">Wholesale or retail pricing</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700" />
              </Link>

              <Link
                href="/products?action=repack"
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 group-hover:text-teal-900">
                      Repack Bulk Tea
                    </h4>
                    <p className="text-xs text-slate-500">Convert bulk kg into pouches</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700" />
              </Link>

              <Link
                href="/purchases"
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 group-hover:text-amber-900">
                      Receive Supplier Stock
                    </h4>
                    <p className="text-xs text-slate-500">Post purchase orders & receipts</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700" />
              </Link>

              <Link
                href="/expenses"
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 group-hover:text-rose-900">
                      Log Operating Expense
                    </h4>
                    <p className="text-xs text-slate-500">Transport, labor, bags, rent</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-rose-700" />
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Audit Ledger Entries:</span>
            <span className="font-semibold text-slate-700">{stockMovements.length} logged</span>
          </div>
        </div>
      </div>
    </div>
  );
}
