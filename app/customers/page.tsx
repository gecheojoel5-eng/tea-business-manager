'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  History,
  FileText,
  X,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Customer, CustomerType } from '@/lib/types';
import { formatKES, formatKenyanDate } from '@/lib/formatters';

export default function CustomersPage() {
  const { customers, sales, payments, addCustomer, updateCustomer } = useStore();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'wholesale' | 'retail' | 'debtors'>('all');

  // Customer Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Statement / History Modal
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    customer_type: 'wholesale' as CustomerType,
    address: '',
    kra_pin: '',
    opening_balance: 0,
    credit_limit: 100000,
    payment_terms_days: 14,
    notes: '',
  });
  const [formError, setFormError] = useState('');

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.toLowerCase().includes(search.toLowerCase()) ||
        (c.address && c.address.toLowerCase().includes(search.toLowerCase())) ||
        (c.kra_pin && c.kra_pin.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;

      if (filterType === 'wholesale') return c.customer_type === 'wholesale';
      if (filterType === 'retail') return c.customer_type === 'retail';
      if (filterType === 'debtors') return (c.current_balance || 0) > 0;
      return true;
    });
  }, [customers, search, filterType]);

  const totalOutstanding = customers.reduce((sum, c) => sum + (c.current_balance || 0), 0);
  const wholesaleCount = customers.filter((c) => c.customer_type === 'wholesale').length;
  const retailCount = customers.filter((c) => c.customer_type === 'retail').length;

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '+254 ',
      email: '',
      customer_type: 'wholesale',
      address: '',
      kra_pin: '',
      opening_balance: 0,
      credit_limit: 100000,
      payment_terms_days: 14,
      notes: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      customer_type: c.customer_type,
      address: c.address || '',
      kra_pin: c.kra_pin || '',
      opening_balance: c.opening_balance || 0,
      credit_limit: c.credit_limit || 0,
      payment_terms_days: c.payment_terms_days || 0,
      notes: c.notes || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      setFormError('Customer Name and Phone number are required.');
      return;
    }

    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        customer_type: formData.customer_type,
        address: formData.address || null,
        kra_pin: formData.kra_pin || null,
        credit_limit: formData.credit_limit,
        payment_terms_days: formData.payment_terms_days,
        notes: formData.notes || null,
      });
    } else {
      await addCustomer({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        customer_type: formData.customer_type,
        address: formData.address || null,
        kra_pin: formData.kra_pin || null,
        opening_balance: formData.opening_balance,
        credit_limit: formData.credit_limit,
        payment_terms_days: formData.payment_terms_days,
        notes: formData.notes || null,
        is_active: true,
      });
    }

    setIsModalOpen(false);
  };

  // Customer Ledger Details for Statement
  const customerSales = statementCustomer
    ? sales.filter((s) => s.customer_id === statementCustomer.id)
    : [];
  const customerPayments = statementCustomer
    ? payments.filter((p) => p.customer_id === statementCustomer.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Customers & Debtors
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage wholesale distributors, retail shops, payment terms, and monitor credit balances.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-sm shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Debtors Balance</p>
            <p className="text-xl font-black text-rose-600 mt-1">{formatKES(totalOutstanding)}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Wholesale Accounts</p>
            <p className="text-xl font-black text-emerald-800 mt-1">{wholesaleCount} Buyers</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Retail Kiosks / Cafes</p>
            <p className="text-xl font-black text-teal-800 mt-1">{retailCount} Outlets</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, PIN, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({customers.length})
          </button>
          <button
            onClick={() => setFilterType('wholesale')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              filterType === 'wholesale'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Wholesale ({wholesaleCount})
          </button>
          <button
            onClick={() => setFilterType('retail')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              filterType === 'retail'
                ? 'bg-teal-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Retail ({retailCount})
          </button>
          <button
            onClick={() => setFilterType('debtors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              filterType === 'debtors'
                ? 'bg-rose-700 text-white'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            With Balances Due
          </button>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((c) => {
          const hasDebt = (c.current_balance || 0) > 0;
          return (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-snug">{c.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          c.customer_type === 'wholesale'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {c.customer_type}
                      </span>
                      {c.kra_pin && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          PIN: {c.kra_pin}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      hasDebt ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {hasDebt ? `Owes ${formatKES(c.current_balance)}` : 'Cleared'}
                  </span>
                </div>

                <div className="space-y-1.5 mt-4 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.phone}</span>
                  </div>
                  {c.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.email}</span>
                    </div>
                  )}
                  {c.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.address}</span>
                    </div>
                  )}
                </div>

                {/* Credit Limit & Terms */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div>
                    <span>Credit Limit:</span>{' '}
                    <span className="font-semibold text-slate-800">
                      {c.credit_limit ? formatKES(c.credit_limit) : 'None'}
                    </span>
                  </div>
                  <div>
                    <span>Terms:</span>{' '}
                    <span className="font-semibold text-slate-800">
                      {c.payment_terms_days ? `${c.payment_terms_days} days` : 'Cash only'}
                    </span>
                  </div>
                </div>

                {c.notes && (
                  <p className="mt-2 text-xs text-slate-400 italic line-clamp-2">{c.notes}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setStatementCustomer(c)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-800 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Statement & History</span>
                </button>

                <button
                  onClick={() => openEditModal(c)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 px-3 py-1.5 rounded-lg hover:bg-emerald-50"
                >
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- ADD / EDIT CUSTOMER MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">
                {editingCustomer ? 'Edit Customer Details' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer / Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mombasa Tea Wholesalers Ltd or Mama Mary"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number (M-Pesa) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+254 7..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="contact@buyer.co.ke"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pricing Category *
                  </label>
                  <select
                    value={formData.customer_type}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_type: e.target.value as CustomerType })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="wholesale">Wholesale Pricing Tier</option>
                    <option value="retail">Retail Pricing Tier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    KRA PIN (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="P051234567Z"
                    value={formData.kra_pin}
                    onChange={(e) => setFormData({ ...formData, kra_pin: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Physical Address / Town / Market Stall
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stall 12, Gikomba Market, Nairobi"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Credit Limit (KSh)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={formData.credit_limit}
                    onChange={(e) =>
                      setFormData({ ...formData, credit_limit: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Terms (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.payment_terms_days}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_terms_days: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              {!editingCustomer && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Opening Balance (Existing Debt at Start)
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={formData.opening_balance}
                    onChange={(e) =>
                      setFormData({ ...formData, opening_balance: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Owner Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Special instructions, delivery location, preferred payment method"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold shadow-sm"
                >
                  {editingCustomer ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- STATEMENT / HISTORY DRAWER MODAL --- */}
      {statementCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-slate-900">{statementCustomer.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded font-bold uppercase bg-slate-100 text-slate-700">
                    {statementCustomer.customer_type}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Phone: {statementCustomer.phone} • PIN: {statementCustomer.kra_pin || 'N/A'}
                </p>
              </div>
              <button
                onClick={() => setStatementCustomer(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Balance Banner */}
            <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Outstanding Balance</p>
                <p className="text-2xl font-black text-rose-600">
                  {formatKES(statementCustomer.current_balance)}
                </p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>Credit Limit: {formatKES(statementCustomer.credit_limit)}</p>
                <p>Payment Terms: {statementCustomer.payment_terms_days || 0} days</p>
              </div>
            </div>

            {/* Invoices List */}
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-sm text-slate-800 mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>Sales Invoices ({customerSales.length})</span>
                </h4>
                {customerSales.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No sales recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto border border-slate-100 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                        <tr>
                          <th className="p-2">Invoice #</th>
                          <th className="p-2">Date</th>
                          <th className="p-2 text-right">Total</th>
                          <th className="p-2 text-right">Paid</th>
                          <th className="p-2 text-right">Due</th>
                          <th className="p-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customerSales.map((s) => (
                          <tr key={s.id}>
                            <td className="p-2 font-semibold text-emerald-800">
                              {s.invoice_number}
                            </td>
                            <td className="p-2 text-slate-500">{formatKenyanDate(s.sale_date)}</td>
                            <td className="p-2 text-right font-medium">{formatKES(s.total_amount)}</td>
                            <td className="p-2 text-right text-emerald-700">{formatKES(s.amount_paid)}</td>
                            <td className="p-2 text-right font-bold text-rose-600">{formatKES(s.balance_due)}</td>
                            <td className="p-2 text-center">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100">
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

              {/* Payments History */}
              <div>
                <h4 className="font-bold text-sm text-slate-800 mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  <span>Payments Received ({customerPayments.length})</span>
                </h4>
                {customerPayments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No payments recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto border border-slate-100 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                        <tr>
                          <th className="p-2">Receipt #</th>
                          <th className="p-2">Date</th>
                          <th className="p-2">Method</th>
                          <th className="p-2">Reference</th>
                          <th className="p-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customerPayments.map((p) => (
                          <tr key={p.id}>
                            <td className="p-2 font-mono font-medium">{p.payment_number}</td>
                            <td className="p-2 text-slate-500">{formatKenyanDate(p.payment_date)}</td>
                            <td className="p-2 uppercase font-semibold text-slate-700">{p.payment_method}</td>
                            <td className="p-2 font-mono text-emerald-700">{p.reference_code || '-'}</td>
                            <td className="p-2 text-right font-bold text-emerald-800">{formatKES(p.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-6 border-t border-slate-100">
              <button
                onClick={() => setStatementCustomer(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-semibold"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
