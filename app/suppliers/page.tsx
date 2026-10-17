'use client';

import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Building,
  CreditCard,
  History,
  X,
  ShoppingBag,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Supplier } from '@/lib/types';
import { formatKES, formatKenyanDate } from '@/lib/formatters';

export default function SuppliersPage() {
  const { suppliers, purchases, addSupplier, updateSupplier } = useStore();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [statementSupplier, setStatementSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    phone: '',
    email: '',
    address: '',
    kra_pin: '',
    bank_details: '',
    opening_balance: 0,
    notes: '',
  });
  const [formError, setFormError] = useState('');

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const q = search.toLowerCase();
      return (
        s.company_name.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        (s.address && s.address.toLowerCase().includes(q))
      );
    });
  }, [suppliers, search]);

  const totalOwedToSuppliers = suppliers.reduce((sum, s) => sum + (s.current_balance || 0), 0);

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      company_name: '',
      phone: '+254 ',
      email: '',
      address: '',
      kra_pin: '',
      bank_details: '',
      opening_balance: 0,
      notes: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setFormData({
      name: s.name,
      company_name: s.company_name,
      phone: s.phone,
      email: s.email || '',
      address: s.address || '',
      kra_pin: s.kra_pin || '',
      bank_details: s.bank_details || '',
      opening_balance: s.opening_balance || 0,
      notes: s.notes || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name || !formData.phone) {
      setFormError('Company Name and Phone are required.');
      return;
    }

    if (editingSupplier) {
      await updateSupplier(editingSupplier.id, {
        name: formData.name,
        company_name: formData.company_name,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address || null,
        kra_pin: formData.kra_pin || null,
        bank_details: formData.bank_details || null,
        notes: formData.notes || null,
      });
    } else {
      await addSupplier({
        name: formData.name,
        company_name: formData.company_name,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address || null,
        kra_pin: formData.kra_pin || null,
        bank_details: formData.bank_details || null,
        opening_balance: formData.opening_balance,
        notes: formData.notes || null,
        is_active: true,
      });
    }

    setIsModalOpen(false);
  };

  const supplierPurchases = statementSupplier
    ? purchases.filter((p) => p.supplier_id === statementSupplier.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Suppliers & Tea Estates</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage factory producers, packaging manufacturers, payment terms, and monitor payable balances.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-sm shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Summary Stat */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Supplier Payables</p>
            <p className="text-2xl font-black text-rose-600 mt-1">{formatKES(totalOwedToSuppliers)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Owed to factory estates and packaging vendors</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Active Suppliers</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{suppliers.length} Vendors</p>
            <p className="text-xs text-slate-500 mt-0.5">Kericho, Nandi, Bomet, and Nairobi packaging</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search suppliers, factories, contact person..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>
      </div>

      {/* Supplier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((s) => {
          const hasDebt = (s.current_balance || 0) > 0;
          return (
            <div
              key={s.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-emerald-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{s.company_name}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Attn: {s.name || 'Accounts Dept'}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      hasDebt ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {hasDebt ? `Payable ${formatKES(s.current_balance)}` : 'Settled'}
                  </span>
                </div>

                <div className="space-y-1.5 mt-4 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{s.phone}</span>
                  </div>
                  {s.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.email}</span>
                    </div>
                  )}
                  {s.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.address}</span>
                    </div>
                  )}
                  {s.bank_details && (
                    <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-100 text-[11px] font-mono text-slate-700">
                      Bank: {s.bank_details}
                    </div>
                  )}
                </div>

                {s.notes && (
                  <p className="mt-3 text-xs text-slate-400 italic line-clamp-2">{s.notes}</p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setStatementSupplier(s)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-800 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Purchases History</span>
                </button>
                <button
                  onClick={() => openEditModal(s)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 px-3 py-1.5 rounded-lg hover:bg-emerald-50"
                >
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- ADD / EDIT SUPPLIER MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
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
                  Company / Factory Estate Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kericho Highlands Tea Factory Ltd"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kipkemboi Ruto"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number *
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="supply@factory.co.ke"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    KRA PIN (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="P051000111A"
                    value={formData.kra_pin}
                    onChange={(e) => setFormData({ ...formData, kra_pin: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Location / Physical Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tea Factory Road, Kericho County"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Account / M-Pesa Paybill for Payments
                </label>
                <input
                  type="text"
                  placeholder="e.g. KCB Bank, Kericho Branch, Acc: 1102938475"
                  value={formData.bank_details}
                  onChange={(e) => setFormData({ ...formData, bank_details: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              {!editingSupplier && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Opening Payable Balance (If you already owe them)
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
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes on tea auction batches, grades supplied, transport arrangements"
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
                  {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- STATEMENT / PURCHASE HISTORY MODAL --- */}
      {statementSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{statementSupplier.company_name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Contact: {statementSupplier.name} • {statementSupplier.phone}
                </p>
              </div>
              <button
                onClick={() => setStatementSupplier(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Amount Payable</p>
                <p className="text-2xl font-black text-rose-600">
                  {formatKES(statementSupplier.current_balance)}
                </p>
              </div>
              <div className="text-right text-xs text-slate-600">
                <p className="font-mono">{statementSupplier.bank_details || 'No bank recorded'}</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-sm text-slate-800 mb-2 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-emerald-700" />
                <span>Purchase Orders & Deliveries ({supplierPurchases.length})</span>
              </h4>
              {supplierPurchases.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No purchase orders recorded yet.</p>
              ) : (
                <div className="overflow-x-auto border border-slate-100 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="p-2">PO #</th>
                        <th className="p-2">Order Date</th>
                        <th className="p-2">Status</th>
                        <th className="p-2 text-right">Total</th>
                        <th className="p-2 text-right">Paid</th>
                        <th className="p-2 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {supplierPurchases.map((p) => (
                        <tr key={p.id}>
                          <td className="p-2 font-semibold text-emerald-800">{p.purchase_number}</td>
                          <td className="p-2 text-slate-500">{formatKenyanDate(p.order_date)}</td>
                          <td className="p-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100">
                              {p.status}
                            </span>
                          </td>
                          <td className="p-2 text-right font-medium">{formatKES(p.total_amount)}</td>
                          <td className="p-2 text-right text-emerald-700">{formatKES(p.amount_paid)}</td>
                          <td className="p-2 text-right font-bold text-rose-600">{formatKES(p.balance_due)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 mt-6 border-t border-slate-100">
              <button
                onClick={() => setStatementSupplier(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
