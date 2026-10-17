'use client';

import React, { useState } from 'react';
import {
  Settings,
  Building,
  ShieldCheck,
  Download,
  RotateCcw,
  Save,
  CheckCircle2,
  FileCode,
  QrCode,
  Database,
  Info,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { TaxCategoryCode } from '@/lib/types';

export default function SettingsPage() {
  const {
    settings,
    updateSettings,
    resetToDemoData,
    exportDataAsJson,
    isSupabaseLive,
  } = useStore();

  const [formData, setFormData] = useState({
    business_name: settings.business_name || '',
    owner_name: settings.owner_name || '',
    kra_pin: settings.kra_pin || '',
    phone: settings.phone || '',
    email: settings.email || '',
    physical_address: settings.physical_address || '',
    county: settings.county || 'Nairobi',
    is_vat_registered: settings.is_vat_registered ?? true,
    default_tax_category: (settings.default_tax_category || 'standard_16') as TaxCategoryCode,
    receipt_footer_note: settings.receipt_footer_note || '',
    invoice_disclaimer: settings.invoice_disclaimer || '',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    if (
      window.confirm(
        'Are you sure you want to restore the realistic Kenya demo tea business data? Any unbacked local modifications will be replaced.'
      )
    ) {
      resetToDemoData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  const handleExportBackup = () => {
    const jsonStr = exportDataAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chai-tea-business-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business & Tax Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure Kenyan enterprise identification, KRA PIN, VAT status, printable receipts, and backups.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2.5 font-semibold text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Business settings successfully updated!</span>
        </div>
      )}

      {resetSuccess && (
        <div className="p-4 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl flex items-center gap-2.5 font-semibold text-sm">
          <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
          <span>Demo dataset restored successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Kenyan Business Profile */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Building className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="font-bold text-base text-slate-900">Enterprise Profile</h3>
              <p className="text-xs text-slate-500">
                Printed on receipts, invoices, and purchase orders.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Business Trade Name *
              </label>
              <input
                type="text"
                required
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Business Owner / Manager *
              </label>
              <input
                type="text"
                required
                value={formData.owner_name}
                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Phone Number (M-Pesa) *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Physical Godown / Warehouse Address
              </label>
              <input
                type="text"
                value={formData.physical_address}
                onChange={(e) => setFormData({ ...formData, physical_address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                County Location
              </label>
              <input
                type="text"
                value={formData.county}
                onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {/* 2. Kenyan Tax & eTIMS Configuration */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="font-bold text-base text-slate-900">Kenya Revenue Authority (KRA) & Tax Settings</h3>
              <p className="text-xs text-slate-500">
                Configure VAT registration and transparent eTIMS invoicing disclaimers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                KRA PIN Number *
              </label>
              <input
                type="text"
                required
                value={formData.kra_pin}
                onChange={(e) => setFormData({ ...formData, kra_pin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono uppercase"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Standard format: P05...Z
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                VAT Registration Status
              </label>
              <div className="flex items-center gap-3 mt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="vat_reg"
                    checked={formData.is_vat_registered}
                    onChange={() => setFormData({ ...formData, is_vat_registered: true })}
                    className="text-emerald-700 focus:ring-emerald-500"
                  />
                  <span>VAT Registered (Apply 16% on Standard Items)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="vat_reg"
                    checked={!formData.is_vat_registered}
                    onChange={() => setFormData({ ...formData, is_vat_registered: false })}
                    className="text-emerald-700 focus:ring-emerald-500"
                  />
                  <span>Non-VAT Trader (Exempt / Turnover Tax)</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Invoice Disclaimer & Fiscal Note
            </label>
            <input
              type="text"
              value={formData.invoice_disclaimer}
              onChange={(e) => setFormData({ ...formData, invoice_disclaimer: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Printed on sales receipts to clarify internal sales document vs official eTIMS QR invoice.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Receipt Footer Note (Customer Greeting)
            </label>
            <input
              type="text"
              value={formData.receipt_footer_note}
              onChange={(e) => setFormData({ ...formData, receipt_footer_note: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>

          {/* eTIMS Future Integration Architecture Note */}
          <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl text-xs space-y-1.5">
            <div className="font-bold text-teal-950 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-teal-700" />
              <span>eTIMS Architectural Policy</span>
            </div>
            <p className="text-teal-900 leading-relaxed">
              In accordance with Kenyan fiscal integrity rules, this system does <strong>not fake</strong> eTIMS signatures or transmissions. You can safely record your external eTIMS CU Invoice numbers or Acknowledgment codes on invoices. When you are ready for direct KRA OSCU / VSCU integration, the system schema is fully prepared for an official API adapter.
            </p>
          </div>
        </div>

        {/* 3. System Defaults & Fixed Locale Settings */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Settings className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="font-bold text-base text-slate-900">Localization & Currency</h3>
              <p className="text-xs text-slate-500">Preset for Kenyan commercial standard.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 uppercase font-semibold block">Currency</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">KES (KSh)</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 uppercase font-semibold block">Time Zone</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">Africa/Nairobi (EAT)</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 uppercase font-semibold block">Date Format</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">DD/MM/YYYY</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 uppercase font-semibold block">Canonical Unit</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">Grams (g / kg)</span>
            </div>
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Business Settings</span>
          </button>
        </div>
      </form>

      {/* 4. Backup, Export & Supabase Cloud Status */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <Database className="w-5 h-5 text-emerald-700" />
          <div>
            <h3 className="font-bold text-base text-slate-900">Database Storage & Backups</h3>
            <p className="text-xs text-slate-500">
              Current storage mode and one-click data backup recovery.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  isSupabaseLive ? 'bg-green-500' : 'bg-amber-500'
                }`}
              />
              <span className="font-bold text-sm text-slate-800">
                {isSupabaseLive
                  ? 'Connected to Supabase PostgreSQL'
                  : 'Operating in Local Offline / Demo Storage'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isSupabaseLive
                ? 'Your business data is backed up to your live Supabase cloud database.'
                : 'To link your Supabase database, copy SQL files from supabase/migrations to Supabase SQL editor and add your API keys to .env.local.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Export Full JSON Backup</span>
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
