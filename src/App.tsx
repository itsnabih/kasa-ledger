import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type { NavigationTab } from './types/finance';
import { useFinanceStore } from './store/useFinanceStore';
import { useTheme } from './hooks/useTheme';
import { usePWAInstall } from './hooks/usePWAInstall';
import { calculateBillMetrics, calculateNetWorth } from './lib/math';
import {
  generateAccountStatementPDF,
  generateAssetPortfolioPDF
} from './lib/pdfGenerator';
import { AppShell } from './components/layout/AppShell';
import { BottomSheet } from './components/ui/BottomSheet';
import { Button } from './components/ui/Button';
import { DashboardView } from './features/dashboard/DashboardView';
import { LedgerView } from './features/transactions/LedgerView';
import { TransactionForm } from './features/transactions/TransactionForm';
import { GoalsView } from './features/goals/GoalsView';
import { DepositsView } from './features/deposits/DepositsView';
import { BillsView } from './features/bills/BillsView';
import { ReportsView } from './features/reports/ReportsView';

const VALID_TABS: readonly NavigationTab[] = [
  'overview',
  'ledger',
  'goals',
  'deposits',
  'bills',
  'reports'
];

function parseHashToTab(hash: string): NavigationTab {
  const cleaned = hash.replace(/^#\/?/, '').trim().toLowerCase();
  if ((VALID_TABS as readonly string[]).includes(cleaned)) {
    return cleaned as NavigationTab;
  }
  return 'overview';
}

export const App: React.FC = () => {
  const {
    accounts,
    transactions,
    goals,
    deposits,
    bills,
    activeTab,
    periodFilter,
    selectedAccountFilter,
    setActiveTab,
    setPeriodPreset,
    setSelectedAccountFilter,
    addAccount,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addGoal,
    updateGoal,
    allocateGoalFunds,
    deleteGoal,
    addDeposit,
    updateDeposit,
    deleteDeposit,
    addBill,
    updateBill,
    payBillInstallment,
    updateBillLateFee,
    deleteBill,
    importBackupPayload,
    resetToDemoSeed,
    clearAllData
  } = useFinanceStore();

  const { theme, toggleTheme } = useTheme();
  const {
    canInstall,
    showIOSGuide,
    setShowIOSGuide,
    triggerInstall
  } = usePWAInstall();

  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);

  // Sync Hash Routing (#/overview, #/ledger, #/goals, #/deposits, #/reports) for GitHub Pages 404 immunity
  useEffect(() => {
    const initialTab = parseHashToTab(window.location.hash);
    setActiveTab(initialTab);

    const handleHashChange = () => {
      const nextTab = parseHashToTab(window.location.hash);
      setActiveTab(nextTab);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setActiveTab]);

  const navigateToTab = useCallback(
    (tab: NavigationTab) => {
      setActiveTab(tab);
      const targetHash = `#/${tab}`;
      if (window.location.hash !== targetHash) {
        window.history.replaceState(null, '', targetHash);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setActiveTab]
  );

  // Global keyboard shortcut: 'N' to open New Transaction modal when not typing in an input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      if (isEditable) return;

      if ((e.key === 'n' || e.key === 'N') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setIsNewTxModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const netWorthSummary = useMemo(
    () => calculateNetWorth(transactions, goals, deposits, bills),
    [transactions, goals, deposits, bills]
  );

  const overdueBillsCount = useMemo(
    () => bills.filter((b) => b.status !== 'paid' && calculateBillMetrics(b).isOverdue).length,
    [bills]
  );

  const handleQuickExportMutasiPDF = useCallback(async () => {
    await generateAccountStatementPDF({
      transactions,
      periodFilter,
      accountFilter: selectedAccountFilter
    });
  }, [transactions, periodFilter, selectedAccountFilter]);

  const handleExportAssetPDF = useCallback(async () => {
    await generateAssetPortfolioPDF({
      accounts,
      transactions,
      goals,
      deposits
    });
  }, [accounts, transactions, goals, deposits]);

  const handleSelectAccountInLedger = useCallback(
    (accountName: string) => {
      setSelectedAccountFilter(accountName);
      navigateToTab('ledger');
    },
    [setSelectedAccountFilter, navigateToTab]
  );

  return (
    <>
      <AppShell
        activeTab={activeTab}
        onSelectTab={navigateToTab}
        periodFilter={periodFilter}
        onChangePreset={setPeriodPreset}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenNewTransaction={() => setIsNewTxModalOpen(true)}
        onQuickExportMutasiPDF={handleQuickExportMutasiPDF}
        netWorth={netWorthSummary.totalNetWorth}
        liquidCash={netWorthSummary.liquidCashBalance}
        totalLiabilities={netWorthSummary.totalLiabilities}
        overdueBillsCount={overdueBillsCount}
        canInstallPWA={canInstall}
        onInstallPWA={triggerInstall}
      >
        {activeTab === 'overview' ? (
          <DashboardView
            accounts={accounts}
            transactions={transactions}
            goals={goals}
            deposits={deposits}
            bills={bills}
            periodFilter={periodFilter}
            onNavigateTab={navigateToTab}
            onSelectAccountInLedger={handleSelectAccountInLedger}
            onAddAccount={addAccount}
            onOpenNewTransaction={() => setIsNewTxModalOpen(true)}
            onExportAssetPDF={handleExportAssetPDF}
          />
        ) : null}

        {activeTab === 'ledger' ? (
          <LedgerView
            accounts={accounts}
            transactions={transactions}
            periodFilter={periodFilter}
            selectedAccount={selectedAccountFilter}
            onChangeAccount={setSelectedAccountFilter}
            onOpenNewTransaction={() => setIsNewTxModalOpen(true)}
            onUpdateTransaction={updateTransaction}
            onDeleteTransaction={deleteTransaction}
            onExportStatementPDF={async (account) => {
              await generateAccountStatementPDF({
                transactions,
                periodFilter,
                accountFilter: account
              });
            }}
          />
        ) : null}

        {activeTab === 'goals' ? (
          <GoalsView
            goals={goals}
            accounts={accounts}
            onAddGoal={addGoal}
            onUpdateGoal={updateGoal}
            onAllocateGoal={allocateGoalFunds}
            onDeleteGoal={deleteGoal}
          />
        ) : null}

        {activeTab === 'deposits' ? (
          <DepositsView
            deposits={deposits}
            onAddDeposit={addDeposit}
            onUpdateDeposit={updateDeposit}
            onDeleteDeposit={deleteDeposit}
          />
        ) : null}

        {activeTab === 'bills' ? (
          <BillsView
            bills={bills}
            accounts={accounts}
            onAddBill={addBill}
            onUpdateBill={updateBill}
            onPayInstallment={payBillInstallment}
            onUpdateLateFee={updateBillLateFee}
            onDeleteBill={deleteBill}
          />
        ) : null}

        {activeTab === 'reports' ? (
          <ReportsView
            accounts={accounts}
            transactions={transactions}
            goals={goals}
            deposits={deposits}
            bills={bills}
            periodFilter={periodFilter}
            onImportBackup={importBackupPayload}
            onResetDemo={resetToDemoSeed}
            onClearAll={clearAllData}
          />
        ) : null}
      </AppShell>

      {/* Global Fast Transaction Entry Sheet */}
      <BottomSheet
        isOpen={isNewTxModalOpen}
        onClose={() => setIsNewTxModalOpen(false)}
        title="Catat Transaksi Baru"
        subtitle="Pencatatan cepat 3-ketuk • Pintasan keyboard: [N]"
      >
        <TransactionForm
          accounts={accounts}
          onCancel={() => setIsNewTxModalOpen(false)}
          onSubmit={(input) => {
            addTransaction(input);
            setIsNewTxModalOpen(false);
          }}
        />
      </BottomSheet>

      {/* iOS Add to Home Screen Guide Modal */}
      <BottomSheet
        isOpen={showIOSGuide}
        onClose={() => setShowIOSGuide(false)}
        title="Instal Kasa Ledger di iPhone / iPad"
        subtitle="Akses instan layar penuh dan bekerja 100% offline"
      >
        <div className="space-y-4 text-sm text-text-secondary">
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Ketuk ikon <strong className="text-text-primary">Bagikan (Share)</strong> di
              bilah bawah browser Safari.
            </li>
            <li>
              Gulir ke bawah dan pilih{' '}
              <strong className="text-text-primary">
                &ldquo;Tambah ke Layar Utama&rdquo; (Add to Home Screen)
              </strong>
              .
            </li>
            <li>
              Ketuk <strong className="text-text-primary">Tambah (Add)</strong> di pojok
              kanan atas.
            </li>
          </ol>
          <Button variant="primary" fullWidth onClick={() => setShowIOSGuide(false)}>
            Mengerti
          </Button>
        </div>
      </BottomSheet>
    </>
  );
};

export default App;
