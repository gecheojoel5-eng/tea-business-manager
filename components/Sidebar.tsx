'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  ShoppingBag,
  ShoppingCart,
  Wallet,
  Coins,
  BarChart3,
  Settings,
  X,
  PlusCircle,
  Database,
  Leaf,
} from 'lucide-react';
import { useStore } from '@/lib/store';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Products & Stock', icon: Package },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/suppliers', label: 'Suppliers', icon: Truck },
  { href: '/purchases', label: 'Purchases', icon: ShoppingBag },
  { href: '/sales', label: 'Sales & Invoices', icon: ShoppingCart },
  { href: '/payments', label: 'Payments & Balances', icon: Wallet },
  { href: '/expenses', label: 'Expenses', icon: Coins },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Business Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { settings, isSupabaseLive } = useStore();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-emerald-950 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } shadow-2xl lg:shadow-none border-r border-emerald-900/40`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-emerald-900/60 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3" onClick={onClose}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-900/50">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight tracking-tight text-white flex items-center gap-1.5">
                {settings.business_name || 'Tea Manager'}
              </h1>
              <p className="text-xs text-emerald-400 font-medium">Kenya Business Suite</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-emerald-900/60 text-emerald-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick New Sale Action Button */}
        <div className="p-4">
          <Link
            href="/sales?new=true"
            onClick={onClose}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg shadow-md transition-all active:scale-[0.98]"
          >
            <PlusCircle className="w-5 h-5 text-slate-950" />
            <span>New Sale / POS</span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-sm shadow-emerald-950 font-semibold border-l-4 border-emerald-400'
                    : 'text-emerald-100/80 hover:bg-emerald-900/50 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-300' : 'text-emerald-400/80'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Database & Storage Status Indicator */}
        <div className="p-4 border-t border-emerald-900/60 bg-emerald-950/60">
          <div className="flex items-center space-x-2.5 px-3 py-2 bg-emerald-900/40 rounded-lg border border-emerald-800/40 text-xs">
            <Database className={`w-4 h-4 ${isSupabaseLive ? 'text-green-400' : 'text-amber-400'}`} />
            <div className="flex-1 truncate">
              <p className="font-medium text-emerald-200">
                {isSupabaseLive ? 'Supabase Live DB' : 'Local / Demo Mode'}
              </p>
              <p className="text-[10px] text-emerald-400/70 truncate">
                {isSupabaseLive ? 'Synced to Cloud PostgreSQL' : 'Instant offline mode'}
              </p>
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-emerald-400/60 font-medium">
            Currency: <span className="text-emerald-200 font-semibold">KES (KSh)</span> • Nairobi EAT
          </p>
        </div>
      </aside>
    </>
  );
};
