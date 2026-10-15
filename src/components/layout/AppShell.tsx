import React from 'react';
import type { NavigationTab, PeriodFilter, PeriodPreset } from '../../types/finance';
import type { ThemeMode } from '../../hooks/useTheme';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface AppShellProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  periodFilter: PeriodFilter;
  onChangePreset: (preset: PeriodPreset, customStart?: string, customEnd?: string) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenNewTransaction: () => void;
  onQuickExportMutasiPDF: () => Promise<void>;
  netWorth: number;
  liquidCash: number;
  totalLiabilities?: number;
  overdueBillsCount?: number;
  canInstallPWA: boolean;
  onInstallPWA: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  onSelectTab,
  periodFilter,
  onChangePreset,
  theme,
  onToggleTheme,
  onOpenNewTransaction,
  onQuickExportMutasiPDF,
  netWorth,
  liquidCash,
  totalLiabilities = 0,
  overdueBillsCount = 0,
  canInstallPWA,
  onInstallPWA,
  children
}) => {
  return (
    <div className="min-h-screen flex bg-bg text-text-primary">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        onOpenNewTransaction={onOpenNewTransaction}
        netWorth={netWorth}
        liquidCash={liquidCash}
        totalLiabilities={totalLiabilities}
        canInstallPWA={canInstallPWA}
        onInstallPWA={onInstallPWA}
      />

      <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-10">
        <Header
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          periodFilter={periodFilter}
          onChangePreset={onChangePreset}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onQuickExportMutasiPDF={onQuickExportMutasiPDF}
          canInstallPWA={canInstallPWA}
          onInstallPWA={onInstallPWA}
        />

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-7 py-5 md:py-7">
          {children}
        </main>
      </div>

      <BottomNav
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        onOpenNewTransaction={onOpenNewTransaction}
        overdueBillsCount={overdueBillsCount}
      />
    </div>
  );
};
