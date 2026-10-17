'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Calendar, ShieldCheck, MapPin } from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatKenyanDate } from '@/lib/formatters';

interface HeaderProps {
  onOpenSidebar: () => void;
}

const pageTitles: Record<string, string> = {
  '/': 'Business Dashboard',
  '/products': 'Products & Inventory',
  '/customers': 'Customers & Debtor Accounts',
  '/suppliers': 'Suppliers & Creditor Accounts',
  '/purchases': 'Purchase Orders & Stock Receiving',
  '/sales': 'Sales Invoicing & POS',
  '/payments': 'Payments & Customer Balances',
  '/expenses': 'Operating Expenses',
  '/reports': 'Financial & Stock Reports',
  '/settings': 'Business & Tax Settings',
};

export const Header: React.FC<HeaderProps> = ({ onOpenSidebar }) => {
  const pathname = usePathname();
  const { settings } = useStore();
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    setCurrentDate(formatKenyanDate(new Date()));
  }, []);

  const title = pageTitles[pathname] || 'Tea Business Manager';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm no-print">
      <div className="flex items-center justify-between px-4 lg:px-8 py-3.5">
        {/* Left: Mobile hamburger + Page Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">
              {title}
            </h2>
            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
              <span>{settings.business_name}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {settings.county || 'Kenya'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Badges & Date */}
        <div className="flex items-center space-x-3">
          {/* Tax Status Pill */}
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>PIN: {settings.kra_pin || 'Not Set'}</span>
            <span className="text-emerald-500">•</span>
            <span>{settings.is_vat_registered ? 'VAT Reg (16%)' : 'Non-VAT'}</span>
          </div>

          {/* Date Indicator (Nairobi Time) */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentDate || 'Today'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
