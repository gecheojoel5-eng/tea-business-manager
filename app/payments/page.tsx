'use client';

import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Users,
  Building,
  CreditCard,
  X,
  CheckCircle2,
  AlertCircle,
  Smartphone,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { PaymentMethod } from '@/lib/types';
import { formatKES, formatKenyanDate, getPaymentMethodLabel } from '@/lib/formatters';

export default function PaymentsPage() {
  const {
    payments,
    customers,
    suppliers,
    sales,
    purchases,
    recordPayment,
  } = useStore();

  const [search, setSearch] = useState('');
  const [filterParty, setFilterParty] = useState<'all' | 'customer' | 'supplier'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [partyType, setPartyType] = useState<'customer' | 'supplier'>('customer');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [referenceCode, setReferenceCode] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const openRecordPaymentModal = (defaultCustId?: string) => {
    setPartyType('customer');
    setSelectedCustomerId(defaultCustId || customers[0]?.id || '');
    setSelectedSupplierId(suppliers[0]?.id || '');
    setSelectedSaleId('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setAmount(0);
    setPaymentMethod('mpesa');
    setReferenceCode('');
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id);
    const cust = customers.find((c) => c.id === id);
    if (cust && cust.current_balance > 0) {
      setAmount(cust.current_balance);
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (amount <= 0) {
      setFormError('Please enter a payment amount greater than zero.');
      return;
    }

    if (partyType === 'customer' && !selectedCustomerId) {
      setFormError('Please select a customer.');
      return;
    }

    if (partyType === 'supplier' && !selectedSupplierId) {
      setFormError('Please select a supplier.');
      return;
    }

    await recordPayment({
      party_type: partyType,
      customer_id: partyType === 'customer' ? selectedCustomerId : null,
      supplier_id: partyType === 'supplier' ? selectedSupplierId : null,
      sale_id: selectedSaleId || null,
      payment_date: paymentDate,
      amount: amount,
      payment_method: paymentMethod,
      reference_code: referenceCode || null,
      notes: notes || null,
    });

    setIsModalOpen(false);
  };

  const filteredPayments = payments.filter((p) => {
    const q = search.toLowerCase();
    const match =
      p.payment_number.toLowerCase().includes(q) ||
      (p.reference_code && p.reference_code.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q));

    if (!match) return false;
    if (filterParty === 'all') return true;
    return p.party_type === filterParty;
  });

  const totalCollected = payments
    .filter((p) => p.party_type === 'customer')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaidToSuppliers = payments
    .filter((p) => p.party_type === 'supplier')
    .reduce((sum, p) => sum + p.amount, 0);

  // Unpaid invoices for selected customer
  const customerUnpaidSales = selectedCustomerId
    ? sales.filter((s) => s.customer_id === selectedCustomerId && s.balance_due > 0)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Payments & Customer Balances
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Record M-Pesa receipts, bank transfers, and settle customer and supplier debts.
          </p>
        </div>

        <button
          onClick={() => openRecordPaymentModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Record Payment</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">
              Total Customer Receipts Collected
            </p>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              {formatKES(totalCollected)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Real cash/M-Pesa deposited into account</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">
              Total Paid to Suppliers & Factories
            </p>
            <p className="text-2xl font-black text-slate-800 mt-1">
              {formatKES(totalPaidToSuppliers)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Disbursements for green leaf and packaging</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search payment #, M-Pesa code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterParty('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              filterParty === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Receipts ({payments.length})
          </button>
          <button
            onClick={() => setFilterParty('customer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              filterParty === 'customer'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Customer Inflows
          </button>
          <button
            onClick={() => setFilterParty('supplier')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              filterParty === 'supplier'
                ? 'bg-teal-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Supplier Outflows
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Party / Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Reference Code</th>
                <th className="py-3 px-4 text-right">Amount (KES)</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((p) => {
                const customer = customers.find((c) => c.id === p.customer_id);
                const supplier = suppliers.find((s) => s.id === p.supplier_id);
                const isCustomer = p.party_type === 'customer';

                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {p.payment_number}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {formatKenyanDate(p.payment_date)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {isCustomer
                        ? customer?.name || 'Walk-in Customer'
                        : supplier?.company_name || 'Supplier'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isCustomer
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {p.party_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700 uppercase">
                      {getPaymentMethodLabel(p.payment_method)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-emerald-700">
                      {p.reference_code || '-'}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-black ${
                        isCustomer ? 'text-emerald-700' : 'text-slate-800'
                      }`}
                    >
                      {formatKES(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                      {p.notes || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- RECORD PAYMENT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Record Payment Transaction</h3>
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

            <form onSubmit={handleSavePayment} className="space-y-4 mt-4">
              {/* Party Type Radio */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transaction Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPartyType('customer')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      partyType === 'customer'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Receive from Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartyType('supplier')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      partyType === 'supplier'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Pay Supplier / Factory
                  </button>
                </div>
              </div>

              {partyType === 'customer' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Customer Account *
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Balance Due: {formatKES(c.current_balance)})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Supplier / Factory *
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.company_name} (Payable: {formatKES(s.current_balance)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Specific Invoice allocation (optional) */}
              {partyType === 'customer' && customerUnpaidSales.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Apply to Specific Invoice (Optional)
                  </label>
                  <select
                    value={selectedSaleId}
                    onChange={(e) => {
                      setSelectedSaleId(e.target.value);
                      const s = sales.find((sale) => sale.id === e.target.value);
                      if (s) setAmount(s.balance_due);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="">-- Apply to General Account Balance --</option>
                    {customerUnpaidSales.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.invoice_number} (Due: {formatKES(s.balance_due)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount (KES) *
                  </label>
                  <input
                    type="number"
                    step="10"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Channel *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="mpesa">M-Pesa (Safaricom)</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer (EFT/RTGS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    M-Pesa Code / Bank Ref *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. QHK882390L"
                    value={referenceCode}
                    onChange={(e) => setReferenceCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Settle partial balance for October delivery"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  Save & Apply Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
