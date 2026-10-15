import React from 'react';
import {
  LayoutGrid,
  ArrowLeftRight,
  Plus,
  CreditCard,
  Target,
  Landmark
} from 'lucide-react';
import type { NavigationTab } from '../../types/finance';

interface BottomNavProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenNewTransaction: () => void;
  overdueBillsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewTransaction,
  overdueBillsCount = 0
}) => {
  return (
    <>
      {/* Floating Quick Action Button for Mobile */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <button
          type="button"
          onClick={onOpenNewTransaction}
          aria-label="Catat Transaksi Baru"
          className="flex items-center gap-2 px-4 h-12 rounded-full bg-brand text-white font-semibold text-xs shadow-lg active:scale-95 transition-all touch-manipulation border border-white/20"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          <span>Catat</span>
        </button>
      </div>

      {/* Bottom Bar Navigation */}
      <nav
        aria-label="Navigasi Mobile"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border pb-safe select-none"
      >
        <div className="grid grid-cols-5 items-center h-16 px-1">
          {/* 1. Ringkasan */}
          <button
            type="button"
            onClick={() => onSelectTab('overview')}
            className={`flex flex-col items-center justify-center min-h-[48px] gap-1 text-[10px] font-medium touch-manipulation ${
              activeTab === 'overview' ? 'text-brand font-semibold' : 'text-text-secondary'
            }`}
          >
            <LayoutGrid className="w-5 h-5" strokeWidth={1.75} />
            <span>Ringkasan</span>
          </button>

          {/* 2. Mutasi */}
          <button
            type="button"
            onClick={() => onSelectTab('ledger')}
            className={`flex flex-col items-center justify-center min-h-[48px] gap-1 text-[10px] font-medium touch-manipulation ${
              activeTab === 'ledger' ? 'text-brand font-semibold' : 'text-text-secondary'
            }`}
          >
            <ArrowLeftRight className="w-5 h-5" strokeWidth={1.75} />
            <span>Mutasi</span>
          </button>

          {/* 3. Tagihan (With Overdue Badge Indicator) */}
          <button
            type="button"
            onClick={() => onSelectTab('bills')}
            className={`relative flex flex-col items-center justify-center min-h-[48px] gap-1 text-[10px] font-medium touch-manipulation ${
              activeTab === 'bills' ? 'text-brand font-semibold' : 'text-text-secondary'
            }`}
          >
            <div className="relative">
              <CreditCard className="w-5 h-5" strokeWidth={1.75} />
              {overdueBillsCount > 0 ? (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-expense ring-2 ring-surface animate-pulse" />
              ) : null}
            </div>
            <span>Tagihan</span>
          </button>

          {/* 4. Target Tabungan */}
          <button
            type="button"
            onClick={() => onSelectTab('goals')}
            className={`flex flex-col items-center justify-center min-h-[48px] gap-1 text-[10px] font-medium touch-manipulation ${
              activeTab === 'goals' ? 'text-brand font-semibold' : 'text-text-secondary'
            }`}
          >
            <Target className="w-5 h-5" strokeWidth={1.75} />
            <span>Target</span>
          </button>

          {/* 5. Deposito */}
          <button
            type="button"
            onClick={() => onSelectTab('deposits')}
            className={`flex flex-col items-center justify-center min-h-[48px] gap-1 text-[10px] font-medium touch-manipulation ${
              activeTab === 'deposits' ? 'text-brand font-semibold' : 'text-text-secondary'
            }`}
          >
            <Landmark className="w-5 h-5" strokeWidth={1.75} />
            <span>Deposito</span>
          </button>
        </div>
      </nav>
    </>
  );
};
