'use client';

import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  PackageCheck,
  CheckCircle2,
  Clock,
  Search,
  Truck,
  X,
  PlusCircle,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { PurchaseItem, PurchaseStatus } from '@/lib/types';
import { formatKES, formatWeight, formatKenyanDate } from '@/lib/formatters';

export default function PurchasesPage() {
  const {
    purchases,
    suppliers,
    products,
    createPurchase,
    receivePurchase,
  } = useStore();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ordered' | 'received'>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [receiveSuccessMsg, setReceiveSuccessMsg] = useState('');

  // New PO Form state
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [packagingCosts, setPackagingCosts] = useState<number>(0);
  const [transportCosts, setTransportCosts] = useState<number>(0);
  const [amountPaidNow, setAmountPaidNow] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<
    Array<{
      product_id: string;
      quantity_units: number;
      unit_cost_per_unit: number;
    }>
  >([
    {
      product_id: products[0]?.id || '',
      quantity_units: 100,
      unit_cost_per_unit: products[0]?.cost_per_kg || 300,
    },
  ]);
  const [formError, setFormError] = useState('');

  const filteredPurchases = purchases.filter((p) => {
    const matchesSearch =
      p.purchase_number.toLowerCase().includes(search.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterStatus === 'all') return true;
    return p.status === filterStatus;
  });

  const handleAddItemRow = () => {
    setItems([
      ...items,
      {
        product_id: products[0]?.id || '',
        quantity_units: 50,
        unit_cost_per_unit: products[0]?.cost_per_kg || 300,
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    if (field === 'product_id') {
      const prod = products.find((p) => p.id === value);
      if (prod) {
        updated[index].unit_cost_per_unit = prod.cost_per_kg;
      }
    }
    setItems(updated);
  };

  // Calculations
  const itemsSubtotal = items.reduce(
    (sum, it) => sum + (it.quantity_units || 0) * (it.unit_cost_per_unit || 0),
    0
  );
  const totalAmount = itemsSubtotal + packagingCosts + transportCosts;

  const openNewPurchaseModal = () => {
    setSelectedSupplierId(suppliers[0]?.id || '');
    setOrderDate(new Date().toISOString().split('T')[0]);
    setPackagingCosts(0);
    setTransportCosts(3500);
    setAmountPaidNow(0);
    setNotes('');
    setItems([
      {
        product_id: products[0]?.id || '',
        quantity_units: 200,
        unit_cost_per_unit: products[0]?.cost_per_kg || 320,
      },
    ]);
    setFormError('');
    setIsNewModalOpen(true);
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      setFormError('Please select a supplier.');
      return;
    }

    if (items.length === 0 || items.some((it) => it.quantity_units <= 0)) {
      setFormError('Please specify valid product quantities for all items.');
      return;
    }

    const purchaseItems = items.map((it) => {
      const prod = products.find((p) => p.id === it.product_id);
      const packageWeight = prod?.package_weight_grams || 1000;
      // In bulk tea, quantity_units is kilograms, so grams = quantity_units * 1000
      // In packaged tea, grams = quantity_units * package_weight_grams
      const quantityGrams =
        prod?.product_type === 'bulk'
          ? Math.round(it.quantity_units * 1000)
          : Math.round(it.quantity_units * packageWeight);

      return {
        product_id: it.product_id,
        quantity_units: it.quantity_units,
        quantity_grams: quantityGrams,
        unit_cost_per_unit: it.unit_cost_per_unit,
        total_cost: it.quantity_units * it.unit_cost_per_unit,
      };
    });

    const balanceDue = Math.max(0, totalAmount - amountPaidNow);
    const paymentStatus =
      amountPaidNow >= totalAmount ? 'paid' : amountPaidNow > 0 ? 'partial' : 'unpaid';

    await createPurchase(
      {
        supplier_id: selectedSupplierId,
        order_date: orderDate,
        subtotal: itemsSubtotal,
        packaging_costs: packagingCosts,
        transport_costs: transportCosts,
        total_amount: totalAmount,
        amount_paid: amountPaidNow,
        balance_due: balanceDue,
        payment_status: paymentStatus,
        notes: notes || null,
      },
      purchaseItems
    );

    setIsNewModalOpen(false);
  };

  const handleReceiveStock = async (purchaseId: string, poNumber: string) => {
    setReceivingId(purchaseId);
    setReceiveSuccessMsg('');
    const res = await receivePurchase(purchaseId);
    setReceivingId(null);
    if (res.success) {
      setReceiveSuccessMsg(`Stock from PO ${poNumber} has been received into inventory!`);
      setTimeout(() => setReceiveSuccessMsg(''), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Purchases & Stock Receiving
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Order bulk leaves from tea factories. Stock increases only when goods are verified and received.
          </p>
        </div>

        <button
          onClick={openNewPurchaseModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-sm shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Order</span>
        </button>
      </div>

      {receiveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2.5 font-semibold text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{receiveSuccessMsg}</span>
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search PO reference, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Purchases ({purchases.length})
          </button>
          <button
            onClick={() => setFilterStatus('ordered')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1 ${
              filterStatus === 'ordered'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Awaiting Delivery ({purchases.filter((p) => p.status === 'ordered').length})</span>
          </button>
          <button
            onClick={() => setFilterStatus('received')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1 ${
              filterStatus === 'received'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Received in Warehouse</span>
          </button>
        </div>
      </div>

      {/* Purchases List */}
      <div className="space-y-4">
        {filteredPurchases.map((p) => {
          const supplier = suppliers.find((s) => s.id === p.supplier_id);
          const isReceived = p.status === 'received';

          return (
            <div
              key={p.id}
              className={`bg-white rounded-xl border p-5 shadow-xs transition-all ${
                isReceived ? 'border-slate-200' : 'border-amber-300 bg-amber-50/20'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isReceived ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isReceived ? (
                      <PackageCheck className="w-5 h-5" />
                    ) : (
                      <Truck className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900">{p.purchase_number}</h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isReceived
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isReceived ? 'Goods In Stock' : 'Dispatched / In Transit'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Supplier:{' '}
                      <span className="font-semibold text-slate-800">
                        {supplier?.company_name || 'Unknown Supplier'}
                      </span>{' '}
                      • Ordered: {formatKenyanDate(p.order_date)}
                      {p.received_date && (
                        <span> • Received: {formatKenyanDate(p.received_date)}</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right: Amounts & Receive Button */}
                <div className="flex items-center gap-4 justify-between md:justify-end">
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-medium uppercase">Total Cost</p>
                    <p className="text-lg font-black text-slate-900">{formatKES(p.total_amount)}</p>
                    <p className="text-xs text-slate-500">
                      Paid: {formatKES(p.amount_paid)} •{' '}
                      <span className={p.balance_due > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                        Due: {formatKES(p.balance_due)}
                      </span>
                    </p>
                  </div>

                  {!isReceived && (
                    <button
                      onClick={() => handleReceiveStock(p.id, p.purchase_number)}
                      disabled={receivingId === p.id}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <PackageCheck className="w-4 h-4" />
                      <span>{receivingId === p.id ? 'Updating Stock...' : 'Receive Stock'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="mt-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 font-semibold uppercase">
                        <th className="py-1">Tea Item</th>
                        <th className="py-1 text-right">Quantity</th>
                        <th className="py-1 text-right">Unit Cost</th>
                        <th className="py-1 text-right">Item Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(p.items || []).map((it) => {
                        const prod = products.find((pr) => pr.id === it.product_id);
                        return (
                          <tr key={it.id}>
                            <td className="py-1.5 font-medium text-slate-800">
                              {prod?.name || 'Tea Product'} ({prod?.tea_grade})
                            </td>
                            <td className="py-1.5 text-right font-semibold text-slate-700">
                              {it.quantity_units} {prod?.product_type === 'bulk' ? 'kg' : 'packets'} ({formatWeight(it.quantity_grams)})
                            </td>
                            <td className="py-1.5 text-right text-slate-600">
                              {formatKES(it.unit_cost_per_unit)}
                            </td>
                            <td className="py-1.5 text-right font-bold text-slate-900">
                              {formatKES(it.total_cost)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {(p.packaging_costs > 0 || p.transport_costs > 0 || p.notes) && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
                    <div className="flex gap-3">
                      {p.transport_costs > 0 && (
                        <span>Transport Cost: {formatKES(p.transport_costs)}</span>
                      )}
                      {p.packaging_costs > 0 && (
                        <span>Packaging/Bags: {formatKES(p.packaging_costs)}</span>
                      )}
                    </div>
                    {p.notes && <span className="italic">{p.notes}</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- MODAL: CREATE PURCHASE ORDER --- */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">New Purchase Order</h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
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

            <form onSubmit={handleCreatePO} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Tea Factory / Supplier *
                  </label>
                  <select
                    required
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.company_name} ({s.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Order Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  />
                </div>
              </div>

              {/* Items Entry */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase">
                    Order Line Items
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {items.map((row, index) => {
                  const prod = products.find((p) => p.id === row.product_id);
                  const isBulk = prod?.product_type === 'bulk';
                  return (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200"
                    >
                      <div className="col-span-5">
                        <select
                          value={row.product_id}
                          onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.tea_grade})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          step="1"
                          min="1"
                          placeholder={isBulk ? 'Quantity (kg)' : 'Packets'}
                          value={row.quantity_units}
                          onChange={(e) =>
                            handleItemChange(index, 'quantity_units', Number(e.target.value))
                          }
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white text-right"
                        />
                        <span className="text-[10px] text-slate-400 block text-right">
                          {isBulk ? 'Kilograms' : 'Packets'}
                        </span>
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.5"
                          placeholder="Cost per unit"
                          value={row.unit_cost_per_unit}
                          onChange={(e) =>
                            handleItemChange(index, 'unit_cost_per_unit', Number(e.target.value))
                          }
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white text-right"
                        />
                        <span className="text-[10px] text-slate-400 block text-right">
                          KSh/unit
                        </span>
                      </div>

                      <div className="col-span-1 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(index)}
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

              {/* Transport and packaging costs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transport & SGR Logistics Cost (KSh)
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={transportCosts}
                    onChange={(e) => setTransportCosts(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Packaging / Sacks Cost (KSh)
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={packagingCosts}
                    onChange={(e) => setPackagingCosts(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Payment upfront vs credit */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Total Order Cost</p>
                  <p className="text-xl font-black text-slate-900">{formatKES(totalAmount)}</p>
                </div>

                <div className="w-full sm:w-48">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deposit Paid Now (KSh)
                  </label>
                  <input
                    type="number"
                    step="500"
                    value={amountPaidNow}
                    onChange={(e) => setAmountPaidNow(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white font-bold text-right"
                  />
                  <span className="text-[10px] text-slate-400 block text-right mt-0.5">
                    Balance due: {formatKES(Math.max(0, totalAmount - amountPaidNow))}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Purchase Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. SGR delivery to Nairobi ICD; tea lot # 418"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold shadow-sm"
                >
                  Create Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
