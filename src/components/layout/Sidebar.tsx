import React from 'react';
import {
  LayoutGrid,
  ArrowLeftRight,
  Target,
  Landmark,
  CreditCard,
  FileSpreadsheet,
  Plus,
  Download,
  ShieldCheck,
  type LucideIcon
} from 'lucide-react';
import type { NavigationTab } from '../../types/finance';
import { formatIDR } from '../../lib/formatters';
import { Button } from '../ui/Button';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenNewTransaction: () => void;
  netWorth: number;
  liquidCash: number;
  totalLiabilities?: number;
  canInstallPWA: boolean;
  onInstallPWA: () => void;
}

const NAV_ITEMS: { id: NavigationTab; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Ringkasan & Kas', icon: LayoutGrid },
  { id: 'ledger', label: 'Buku Besar Mutasi', icon: ArrowLeftRight },
  { id: 'goals', label: 'Tabungan Terencana', icon: Target },
  { id: 'deposits', label: 'Deposito & Aset', icon: Landmark },
  { id: 'bills', label: 'Tagihan & Pinjaman', icon: CreditCard },
  { id: 'reports', label: 'Laporan PDF & Cadangan', icon: FileSpreadsheet }
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewTransaction,
  netWorth,
  liquidCash,
  totalLiabilities = 0,
  canInstallPWA,
  onInstallPWA
}) => {
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 lg:w-72 shrink-0 bg-surface border-r border-border min-h-screen select-none">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-text-primary text-surface flex items-center justify-center font-bold text-base tracking-tight">
            K
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-text-primary flex items-center gap-1.5">
              <span>KASA LEDGER</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-subtle border border-border text-text-secondary">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-text-secondary">Personal Finance & Treasury</p>
          </div>
        </div>
      </div>

      {/* Quick Action Button */}
      <div className="p-4 border-b border-border">
        <Button
          variant="primary"
          fullWidth
          onClick={onOpenNewTransaction}
          leftIcon={<Plus className="w-4 h-4" strokeWidth={1.75} />}
        >
          Catat Transaksi (N)
        </Button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Menu Utama">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors touch-manipulation ${
                isActive
                  ? 'bg-subtle text-text-primary font-semibold border border-border'
                  : 'text-text-secondary hover:text-text-primary hover:bg-subtle/60 border border-transparent'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand' : 'text-text-secondary'}`}
                strokeWidth={1.75}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quick Net Worth Snapshot & Offline Status */}
      <div className="p-4 border-t border-border space-y-3 bg-subtle/40">
        <div className="p-3.5 rounded-lg bg-surface border border-border space-y-2">
          <div className="flex items-center justify-between text-[11px] text-text-secondary uppercase font-semibold tracking-wider">
            <span>Kekayaan Bersih</span>
            <ShieldCheck className="w-3.5 h-3.5 text-income" strokeWidth={1.75} />
          </div>
          <div className="text-base font-bold text-text-primary tabular-nums">
            {formatIDR(netWorth)}
          </div>
          <div className="pt-1.5 border-t border-border flex items-center justify-between text-xs">
            <span className="text-text-secondary">Kas Likuid:</span>
            <span className="font-semibold text-text-primary tabular-nums">
              {formatIDR(liquidCash)}
            </span>
          </div>
          {totalLiabilities > 0 ? (
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">Sisa Tagihan:</span>
              <span className="font-semibold text-expense tabular-nums">
                -{formatIDR(totalLiabilities)}
              </span>
            </div>
          ) : null}
        </div>

        {canInstallPWA ? (
          <Button
            variant="outline"
            size="sm"
            fullWidth
            onClick={onInstallPWA}
            leftIcon={<Download className="w-4 h-4" strokeWidth={1.75} />}
          >
            Instal Aplikasi (PWA)
          </Button>
        ) : null}

        <div className="flex items-center justify-between text-[11px] text-text-secondary px-1">
          <span>Penyimpanan Lokal Aktif</span>
          <span className="font-mono">Offline-Ready</span>
        </div>
      </div>
    </aside>
  );
};
