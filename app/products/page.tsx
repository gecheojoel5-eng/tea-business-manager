'use client';

import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  RefreshCw,
  Search,
  AlertTriangle,
  SlidersHorizontal,
  History,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Product, ProductType, TaxCategoryCode } from '@/lib/types';
import { formatKES, formatWeight, formatKenyanDate, formatKenyanDateTime, getMovementTypeLabel, getTaxCategoryName } from '@/lib/formatters';

export default function ProductsPage() {
  const {
    products,
    stockMovements,
    addProduct,
    updateProduct,
    adjustStock,
    repackBulkTea,
  } = useStore();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'bulk' | 'packaged' | 'low_stock'>('all');
  const [activeTab, setActiveTab] = useState<'catalog' | 'ledger'>('catalog');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isRepackModalOpen, setIsRepackModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<Product | null>(null);

  // Repack form state
  const [repackSourceId, setRepackSourceId] = useState('');
  const [repackTargetId, setRepackTargetId] = useState('');
  const [repackBulkGrams, setRepackBulkGrams] = useState<number>(0);
  const [repackPackets, setRepackPackets] = useState<number>(0);
  const [repackCost, setRepackCost] = useState<number>(0);
  const [repackWaste, setRepackWaste] = useState<number>(0);
  const [repackNotes, setRepackNotes] = useState('');
  const [repackError, setRepackError] = useState('');

  // Stock Adjust form state
  const [adjustGrams, setAdjustGrams] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustError, setAdjustError] = useState('');

  // Product form state
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    brand: 'Simba Tea',
    tea_grade: 'BP1',
    product_type: 'packaged' as ProductType,
    package_weight_grams: 500,
    stock_quantity_grams: 0,
    cost_per_kg: 0,
    wholesale_price: 0,
    retail_price: 0,
    reorder_threshold_grams: 10000,
    tax_category: 'standard_16' as TaxCategoryCode,
  });
  const [productFormError, setProductFormError] = useState('');

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.tea_grade.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (filterType === 'bulk') return p.product_type === 'bulk';
      if (filterType === 'packaged') return p.product_type === 'packaged';
      if (filterType === 'low_stock') return p.stock_quantity_grams <= p.reorder_threshold_grams;
      return true;
    });
  }, [products, search, filterType]);

  // Bulk & Packaged products helpers for Repack Modal
  const bulkProducts = products.filter((p) => p.product_type === 'bulk' && p.stock_quantity_grams > 0);
  const packagedProducts = products.filter((p) => p.product_type === 'packaged');

  const openAddProductModal = () => {
    setEditingProduct(null);
    setFormData({
      sku: `TEA-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      brand: 'Simba Tea',
      tea_grade: 'BP1 (Broken Pekoe 1)',
      product_type: 'packaged',
      package_weight_grams: 500,
      stock_quantity_grams: 0,
      cost_per_kg: 180,
      wholesale_price: 230,
      retail_price: 270,
      reorder_threshold_grams: 10000,
      tax_category: 'standard_16',
    });
    setProductFormError('');
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      sku: p.sku,
      name: p.name,
      brand: p.brand,
      tea_grade: p.tea_grade,
      product_type: p.product_type,
      package_weight_grams: p.package_weight_grams,
      stock_quantity_grams: p.stock_quantity_grams,
      cost_per_kg: p.cost_per_kg,
      wholesale_price: p.wholesale_price,
      retail_price: p.retail_price,
      reorder_threshold_grams: p.reorder_threshold_grams,
      tax_category: p.tax_category,
    });
    setProductFormError('');
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sku || !formData.name) {
      setProductFormError('Please provide both SKU and Product Name.');
      return;
    }

    if (editingProduct) {
      await updateProduct(editingProduct.id, {
        ...formData,
      });
    } else {
      await addProduct({
        ...formData,
        is_active: true,
      });
    }

    setIsProductModalOpen(false);
  };

  const openRepackModal = () => {
    setRepackError('');
    const defaultSource = bulkProducts[0];
    const defaultTarget = packagedProducts[0];
    setRepackSourceId(defaultSource ? defaultSource.id : '');
    setRepackTargetId(defaultTarget ? defaultTarget.id : '');
    setRepackBulkGrams(defaultSource ? Math.min(25000, defaultSource.stock_quantity_grams) : 0);
    setRepackPackets(defaultTarget && defaultTarget.package_weight_grams > 0 ? Math.floor(25000 / defaultTarget.package_weight_grams) : 0);
    setRepackCost(500);
    setRepackWaste(0);
    setRepackNotes('');
    setIsRepackModalOpen(true);
  };

  const handleSourceChange = (srcId: string) => {
    setRepackSourceId(srcId);
    const src = products.find((p) => p.id === srcId);
    const tgt = products.find((p) => p.id === repackTargetId);
    if (src && tgt && tgt.package_weight_grams > 0) {
      const suggestGrams = Math.min(20000, src.stock_quantity_grams);
      setRepackBulkGrams(suggestGrams);
      setRepackPackets(Math.floor(suggestGrams / tgt.package_weight_grams));
    }
  };

  const handleTargetChange = (tgtId: string) => {
    setRepackTargetId(tgtId);
    const tgt = products.find((p) => p.id === tgtId);
    if (tgt && tgt.package_weight_grams > 0 && repackBulkGrams > 0) {
      setRepackPackets(Math.floor(repackBulkGrams / tgt.package_weight_grams));
    }
  };

  const handleBulkGramsInput = (grams: number) => {
    setRepackBulkGrams(grams);
    const tgt = products.find((p) => p.id === repackTargetId);
    if (tgt && tgt.package_weight_grams > 0) {
      setRepackPackets(Math.floor(grams / tgt.package_weight_grams));
    }
  };

  const submitRepack = async (e: React.FormEvent) => {
    e.preventDefault();
    setRepackError('');

    if (!repackSourceId || !repackTargetId) {
      setRepackError('Please select both a source bulk tea and a target packaged tea.');
      return;
    }

    if (repackBulkGrams <= 0) {
      setRepackError('Please enter a valid bulk quantity in grams to repack.');
      return;
    }

    if (repackPackets <= 0) {
      setRepackError('Packets produced must be greater than zero.');
      return;
    }

    const res = await repackBulkTea(
      repackSourceId,
      repackBulkGrams,
      repackTargetId,
      repackPackets,
      repackCost,
      repackWaste,
      repackNotes
    );

    if (!res.success) {
      setRepackError(res.error || 'Failed to repack bulk tea.');
      return;
    }

    setIsRepackModalOpen(false);
  };

  const openAdjustModal = (product: Product) => {
    setSelectedProductForAdjust(product);
    setAdjustGrams(0);
    setAdjustReason('');
    setAdjustError('');
    setIsAdjustModalOpen(true);
  };

  const submitAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdjust) return;
    if (adjustGrams === 0) {
      setAdjustError('Please specify a positive or negative adjustment in grams.');
      return;
    }
    if (!adjustReason) {
      setAdjustError('Please provide a reason for the stock adjustment (e.g., physical stocktake variance).');
      return;
    }

    const res = await adjustStock(selectedProductForAdjust.id, adjustGrams, adjustReason);
    if (!res.success) {
      setAdjustError(res.error || 'Failed to adjust stock.');
      return;
    }

    setIsAdjustModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Products & Stock</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage loose tea leaves, retail packet weights, auditable repacking conversions, and reorder thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openRepackModal}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-semibold rounded-xl text-sm transition-all"
          >
            <RefreshCw className="w-4 h-4 text-teal-700" />
            <span>Repack Bulk Tea</span>
          </button>

          <button
            onClick={openAddProductModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-sm shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Tabs: Catalog vs Audit Ledger */}
      <div className="flex items-center border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'catalog'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Product Catalog & Stock ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'ledger'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Auditable Movement Ledger ({stockMovements.length})</span>
        </button>
      </div>

      {activeTab === 'catalog' ? (
        <>
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, SKU, grade, brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterType === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Products
              </button>
              <button
                onClick={() => setFilterType('bulk')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterType === 'bulk'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Bulk Loose Tea
              </button>
              <button
                onClick={() => setFilterType('packaged')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterType === 'packaged'
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Packaged Pouches
              </button>
              <button
                onClick={() => setFilterType('low_stock')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                  filterType === 'low_stock'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Low Stock</span>
              </button>
            </div>
          </div>

          {/* Product Cards / Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                    <th className="py-3 px-4">Product / SKU</th>
                    <th className="py-3 px-4">Type & Grade</th>
                    <th className="py-3 px-4 text-right">Stock Quantity</th>
                    <th className="py-3 px-4 text-right">Cost Price</th>
                    <th className="py-3 px-4 text-right">Wholesale Price</th>
                    <th className="py-3 px-4 text-right">Retail Price</th>
                    <th className="py-3 px-4 text-center">Tax Category</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const isLowStock = p.stock_quantity_grams <= p.reorder_threshold_grams;
                    const packetsCount =
                      p.product_type === 'packaged' && p.package_weight_grams > 0
                        ? Math.floor(p.stock_quantity_grams / p.package_weight_grams)
                        : null;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Name & SKU */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="text-xs text-slate-400 font-mono">
                            SKU: {p.sku} • {p.brand}
                          </div>
                        </td>

                        {/* Type & Grade */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                                p.product_type === 'bulk'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-teal-100 text-teal-800'
                              }`}
                            >
                              {p.product_type}
                            </span>
                            <span className="text-xs font-medium text-slate-600">{p.tea_grade}</span>
                          </div>
                          {p.product_type === 'packaged' && (
                            <div className="text-xs text-slate-400 mt-0.5">
                              Packet: {formatWeight(p.package_weight_grams)}
                            </div>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="py-3.5 px-4 text-right">
                          <div
                            className={`font-bold ${
                              isLowStock ? 'text-amber-600 flex items-center justify-end gap-1' : 'text-slate-900'
                            }`}
                          >
                            {isLowStock && <AlertTriangle className="w-3.5 h-3.5" />}
                            <span>{formatWeight(p.stock_quantity_grams)}</span>
                          </div>
                          {packetsCount !== null && (
                            <div className="text-xs text-slate-500">
                              {packetsCount.toLocaleString()} {packetsCount === 1 ? 'packet' : 'packets'}
                            </div>
                          )}
                        </td>

                        {/* Cost */}
                        <td className="py-3.5 px-4 text-right text-slate-600 font-medium">
                          {formatKES(p.cost_per_kg)}
                          <span className="text-[10px] text-slate-400 block">
                            {p.product_type === 'bulk' ? 'per kg' : 'per pkt'}
                          </span>
                        </td>

                        {/* Wholesale */}
                        <td className="py-3.5 px-4 text-right text-slate-900 font-semibold">
                          {formatKES(p.wholesale_price)}
                        </td>

                        {/* Retail */}
                        <td className="py-3.5 px-4 text-right text-slate-900 font-semibold">
                          {formatKES(p.retail_price)}
                        </td>

                        {/* Tax */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {getTaxCategoryName(p.tax_category)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openAdjustModal(p)}
                              title="Audit Stock Adjustment"
                              className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200"
                            >
                              Adjust
                            </button>
                            <button
                              onClick={() => openEditProductModal(p)}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded border border-emerald-200"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Audit Movement Ledger View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Perpetual Stock Movement Ledger</h3>
              <p className="text-xs text-slate-500">
                Auditable log of purchases received, dispatches, repacking conversions, and audit adjustments.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4 text-right">Quantity Change</th>
                  <th className="py-3 px-4 text-right">Stock After</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockMovements.map((m) => {
                  const product = products.find((p) => p.id === m.product_id);
                  const { label, isPositive } = getMovementTypeLabel(m.movement_type);

                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {formatKenyanDateTime(m.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">
                          {product?.name || 'Unknown Product'}
                        </span>
                        <span className="text-xs text-slate-400 block font-mono">
                          {product?.sku}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-semibold ${
                            isPositive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {label}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-bold ${
                          isPositive ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {formatWeight(m.quantity_grams)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        {formatWeight(m.balance_after_grams)}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono font-medium text-slate-600">
                        {m.reference_id}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">
                        {m.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL 1: ADD / EDIT PRODUCT --- */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add New Tea Product'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {productFormError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
                {productFormError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kericho Pure BP1 Tea Leaves"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tea Grade
                  </label>
                  <select
                    value={formData.tea_grade}
                    onChange={(e) => setFormData({ ...formData, tea_grade: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="BP1 (Broken Pekoe 1)">BP1 (Broken Pekoe 1)</option>
                    <option value="PF1 (Pekoe Fannings 1)">PF1 (Pekoe Fannings 1)</option>
                    <option value="PD (Pekoe Dust)">PD (Pekoe Dust)</option>
                    <option value="Dust 1 (D1)">Dust 1 (D1)</option>
                    <option value="Orthodox Purple">Orthodox Purple Tea</option>
                    <option value="Green Pekoe">Green Pekoe</option>
                    <option value="Fannings (F1)">Fannings (F1)</option>
                    <option value="Specialty Blend">Specialty Blend</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Form
                  </label>
                  <select
                    value={formData.product_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        product_type: e.target.value as ProductType,
                        package_weight_grams: e.target.value === 'bulk' ? 1000 : 500,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="packaged">Packaged Tea (Pouches / Tins)</option>
                    <option value="bulk">Bulk Raw Tea (Loose Leaves in Sacks)</option>
                  </select>
                </div>
              </div>

              {formData.product_type === 'packaged' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Packet Weight in Grams
                  </label>
                  <select
                    value={formData.package_weight_grams}
                    onChange={(e) =>
                      setFormData({ ...formData, package_weight_grams: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="100">100 g (Specialty / Sample)</option>
                    <option value="250">250 g (Retail Pouch)</option>
                    <option value="500">500 g (Standard Family Pouch)</option>
                    <option value="1000">1,000 g / 1 kg (Catering / Hotel)</option>
                    <option value="2000">2,000 g / 2 kg (Commercial Pack)</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purchase Cost ({formData.product_type === 'bulk' ? 'KSh/kg' : 'KSh/pkt'})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.cost_per_kg}
                    onChange={(e) => setFormData({ ...formData, cost_per_kg: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wholesale Price (KSh)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.wholesale_price}
                    onChange={(e) => setFormData({ ...formData, wholesale_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Retail Price (KSh)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.retail_price}
                    onChange={(e) => setFormData({ ...formData, retail_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reorder Alert Threshold (Grams)
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={formData.reorder_threshold_grams}
                    onChange={(e) =>
                      setFormData({ ...formData, reorder_threshold_grams: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Alerts when stock drops to or below {formatWeight(formData.reorder_threshold_grams)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kenya Tax Category
                  </label>
                  <select
                    value={formData.tax_category}
                    onChange={(e) =>
                      setFormData({ ...formData, tax_category: e.target.value as TaxCategoryCode })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="standard_16">16% Standard VAT</option>
                    <option value="zero_rated_0">0% Zero-Rated</option>
                    <option value="exempt">Exempt</option>
                  </select>
                </div>
              </div>

              {!editingProduct && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Stock in Grams (Opening Balance)
                  </label>
                  <input
                    type="number"
                    step="100"
                    value={formData.stock_quantity_grams}
                    onChange={(e) =>
                      setFormData({ ...formData, stock_quantity_grams: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Stores {formatWeight(formData.stock_quantity_grams)}. (Subsequent stock must come from Purchases or Repacking)
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold shadow-sm"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: REPACK BULK TEA (STOCK CONVERSION) --- */}
      {isRepackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Repack Bulk Tea into Packets
                  </h3>
                  <p className="text-xs text-slate-500">
                    Deducts bulk stock grams and produces finished packet units without double-counting.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRepackModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {repackError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{repackError}</span>
              </div>
            )}

            <form onSubmit={submitRepack} className="space-y-4 mt-4">
              {/* Source Bulk Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. Source Bulk Tea (Deducted from Stock) *
                </label>
                <select
                  value={repackSourceId}
                  onChange={(e) => handleSourceChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  {bulkProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Available: {formatWeight(p.stock_quantity_grams)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Packaged Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  2. Destination Packaged Product (Added to Stock) *
                </label>
                <select
                  value={repackTargetId}
                  onChange={(e) => handleTargetChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  {packagedProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.package_weight_grams}g per packet)
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bulk Tea to Use (Grams) *
                  </label>
                  <input
                    type="number"
                    step="100"
                    min="100"
                    value={repackBulkGrams}
                    onChange={(e) => handleBulkGramsInput(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-semibold"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Equivalent: {formatWeight(repackBulkGrams)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Packets Produced *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={repackPackets}
                    onChange={(e) => setRepackPackets(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-semibold text-teal-800"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Packaged weight:{' '}
                    {formatWeight(
                      repackPackets *
                        (products.find((p) => p.id === repackTargetId)?.package_weight_grams || 0)
                    )}
                  </span>
                </div>
              </div>

              {/* Packaging cost & shrinkage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Packaging Material Cost (KSh)
                  </label>
                  <input
                    type="number"
                    step="10"
                    value={repackCost}
                    onChange={(e) => setRepackCost(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Automatically logged as Packaging Expense
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dust / Sifting Loss (Grams)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={repackWaste}
                    onChange={(e) => setRepackWaste(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Normal packing shrinkage: {formatWeight(repackWaste)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Repacking Batch Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Batch 24, packed by casual team for Mombasa road warehouse"
                  value={repackNotes}
                  onChange={(e) => setRepackNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRepackModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-semibold shadow-sm flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Execute Conversion</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: AUDIT STOCK ADJUSTMENT --- */}
      {isAdjustModalOpen && selectedProductForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Audit Stock Adjustment
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedProductForAdjust.name} ({selectedProductForAdjust.sku})
                </p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {adjustError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
                {adjustError}
              </div>
            )}

            <form onSubmit={submitAdjust} className="space-y-4 mt-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500">Current Canonical Stock:</span>{' '}
                <span className="font-bold text-slate-900">
                  {formatWeight(selectedProductForAdjust.stock_quantity_grams)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adjustment Quantity in Grams *
                </label>
                <input
                  type="number"
                  step="50"
                  required
                  placeholder="e.g. +500 for gain, -500 for damaged/loss"
                  value={adjustGrams}
                  onChange={(e) => setAdjustGrams(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Positive value increases stock; negative value decreases stock.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Adjustment *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Monthly stock count variance, bag torn during transit, moisture loss"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold shadow-sm"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
