import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  Landmark,
  CreditCard,
  AlertTriangle,
  FileText,
  Plus,
  ArrowRight
} from 'lucide-react';
import type {
  Bill,
  NavigationTab,
  PeriodFilter,
  SavingsGoal,
  TimeDeposit,
  Transaction
} from '../../types/finance';
import {
  calculateBalancesByAccount,
  calculateBillsSummary,
  calculateMutationWithRunningBalance,
  calculateNetWorth
} from '../../lib/math';
import { formatDateID, formatIDR, getPeriodLabel } from '../../lib/formatters';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { AccountBalanceList } from './AccountBalanceList';

interface DashboardViewProps {
  accounts: readonly string[];
  transactions: readonly Transaction[];
  goals: readonly SavingsGoal[];
  deposits: readonly TimeDeposit[];
  bills?: readonly Bill[];
  periodFilter: PeriodFilter;
  onNavigateTab: (tab: NavigationTab) => void;
  onSelectAccountInLedger: (account: string) => void;
  onAddAccount: (name: string) => void;
  onOpenNewTransaction: () => void;
  onExportAssetPDF: () => Promise<void>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  accounts,
  transactions,
  goals,
  deposits,
  bills = [],
  periodFilter,
  onNavigateTab,
  onSelectAccountInLedger,
  onAddAccount,
  onOpenNewTransaction,
  onExportAssetPDF
}) => {
  const netWorth = useMemo(
    () => calculateNetWorth(transactions, goals, deposits, bills),
    [transactions, goals, deposits, bills]
  );

  const billsSummary = useMemo(
    () => calculateBillsSummary(bills),
    [bills]
  );

  const accountSummaries = useMemo(
    () => calculateBalancesByAccount(transactions, accounts),
    [transactions, accounts]
  );

  const periodMutation = useMemo(() => {
    const startDate =
      periodFilter.preset === 'all_time' ? undefined : periodFilter.startDate;
    const endDate =
      periodFilter.preset === 'all_time' ? undefined : periodFilter.endDate;
    return calculateMutationWithRunningBalance(transactions, { startDate, endDate });
  }, [transactions, periodFilter]);

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    let totalExpense = 0;
    for (const row of periodMutation.rows) {
      if (row.type === 'expense') {
        map.set(row.category, (map.get(row.category) ?? 0) + row.amount);
        totalExpense += row.amount;
      }
    }
    return Array.from(map.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage:
          totalExpense > 0 ? Math.round((amount / totalExpense) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [periodMutation]);

  const savingsRate =
    periodMutation.totalCredit > 0
      ? Math.round(
          ((periodMutation.totalCredit - periodMutation.totalDebit) /
            periodMutation.totalCredit) *
            1000
        ) / 10
      : 0;

  return (
    <div className="space-y-6">
      {/* Overdue Bills Warning Banner */}
      {billsSummary.overdueBillsCount > 0 ? (
        <div className="p-3.5 rounded-xl bg-expense/10 border border-expense/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-expense">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-expense shrink-0" strokeWidth={2} />
            <span className="text-xs font-semibold">
              Terdapat {billsSummary.overdueBillsCount} tagihan melewati batas tenggat!{' '}
              {billsSummary.totalLateFee > 0 ? `(Denda tercatat: ${formatIDR(billsSummary.totalLateFee)})` : ''}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('bills')}
            className="text-xs font-bold text-expense hover:underline inline-flex items-center gap-1 shrink-0 self-start sm:self-auto touch-manipulation"
          >
            Bayar / Periksa Tagihan <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
      ) : null}

      {/* Net Worth Hero Card */}
      <Card padding="lg" className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Total Kekayaan Bersih (Net Worth)
              </span>
              <Badge tone="brand">Real-Time</Badge>
            </div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-text-primary tabular-nums">
              {formatIDR(netWorth.totalNetWorth)}
            </div>
            <p className="text-xs text-text-secondary">
              Total Aset ({formatIDR(netWorth.totalAssets)}) − Sisa Tagihan/Hutang ({formatIDR(netWorth.totalLiabilities)})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onExportAssetPDF}
              leftIcon={<FileText className="w-4 h-4 text-brand" strokeWidth={1.75} />}
            >
              Unduh PDF Aset & Kekayaan
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenNewTransaction}
              leftIcon={<Plus className="w-4 h-4" strokeWidth={1.75} />}
            >
              Catat Transaksi
            </Button>
          </div>
        </div>

        {/* 4 Pillars Allocation Grid: Cash, Goals, Deposits, and Bills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-subtle/60 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-income" strokeWidth={1.75} />
                Kas & Rekening Likuid
              </span>
              <span className="text-xs font-mono font-semibold text-text-secondary tabular-nums">
                {netWorth.liquidSharePercent.toFixed(1)}%
              </span>
            </div>
            <div className="text-lg font-bold text-text-primary tabular-nums">
              {formatIDR(netWorth.liquidCashBalance)}
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('ledger')}
              className="text-xs font-medium text-brand hover:underline inline-flex items-center gap-1 touch-manipulation"
            >
              Lihat Buku Besar Mutasi <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-subtle/60 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                <Target className="w-4 h-4 text-brand" strokeWidth={1.75} />
                Tabungan Terencana (Goals)
              </span>
              <span className="text-xs font-mono font-semibold text-text-secondary tabular-nums">
                {netWorth.goalsSharePercent.toFixed(1)}%
              </span>
            </div>
            <div className="text-lg font-bold text-text-primary tabular-nums">
              {formatIDR(netWorth.totalSavedInGoals)}
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('goals')}
              className="text-xs font-medium text-brand hover:underline inline-flex items-center gap-1 touch-manipulation"
            >
              Kelola {goals.length} Sinking Funds{' '}
              <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-subtle/60 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-deposit" strokeWidth={1.75} />
                Deposito & Dana Terkunci
              </span>
              <span className="text-xs font-mono font-semibold text-text-secondary tabular-nums">
                {netWorth.depositsSharePercent.toFixed(1)}%
              </span>
            </div>
            <div className="text-lg font-bold text-text-primary tabular-nums">
              {formatIDR(netWorth.totalActiveDepositsPrincipal)}
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('deposits')}
              className="text-xs font-medium text-brand hover:underline inline-flex items-center gap-1 touch-manipulation"
            >
              Kelola {deposits.length} Deposito <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-subtle/60 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-expense" strokeWidth={1.75} />
                Tagihan & Liabilitas
              </span>
              {billsSummary.overdueBillsCount > 0 ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-expense/10 text-expense border border-expense/20">
                  {billsSummary.overdueBillsCount} Telat
                </span>
              ) : (
                <span className="text-xs font-mono text-text-secondary tabular-nums">
                  {billsSummary.activeBillsCount} Aktif
                </span>
              )}
            </div>
            <div className="text-lg font-bold text-expense tabular-nums">
              {formatIDR(netWorth.totalLiabilities)}
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('bills')}
              className="text-xs font-medium text-brand hover:underline inline-flex items-center gap-1 touch-manipulation"
            >
              Kelola {bills.length} Tagihan <ArrowRight className="w-3 h-3" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </Card>

      {/* Period Cashflow Bento Grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Ringkasan Arus Kas • {getPeriodLabel(periodFilter)}
          </h2>
          <span className="text-xs text-text-secondary tabular-nums">
            Rasio Tabungan: <strong className="text-text-primary">{savingsRate.toFixed(1)}%</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="md" className="space-y-1">
            <span className="text-xs font-medium text-text-secondary">
              Saldo Awal Periode
            </span>
            <div className="text-lg font-bold text-text-primary tabular-nums">
              {formatIDR(periodMutation.openingBalance)}
            </div>
            <span className="text-[11px] text-text-secondary">
              Akumulasi sebelum {formatDateID(periodFilter.startDate)}
            </span>
          </Card>

          <Card padding="md" className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">
                Total Pemasukan (+)
              </span>
              <TrendingUp className="w-4 h-4 text-income" strokeWidth={1.75} />
            </div>
            <div className="text-lg font-bold text-income tabular-nums">
              {formatIDR(periodMutation.totalCredit, true)}
            </div>
            <span className="text-[11px] text-text-secondary">
              Arus kas masuk periode aktif
            </span>
          </Card>

          <Card padding="md" className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">
                Total Pengeluaran (-)
              </span>
              <TrendingDown className="w-4 h-4 text-expense" strokeWidth={1.75} />
            </div>
            <div className="text-lg font-bold text-expense tabular-nums">
              {formatIDR(-periodMutation.totalDebit)}
            </div>
            <span className="text-[11px] text-text-secondary">
              Arus kas keluar periode aktif
            </span>
          </Card>

          <Card padding="md" className="space-y-1">
            <span className="text-xs font-medium text-text-secondary">
              Surplus / Defisit Bersih
            </span>
            <div
              className={`text-lg font-bold tabular-nums ${
                periodMutation.netCashflow >= 0 ? 'text-income' : 'text-expense'
              }`}
            >
              {formatIDR(periodMutation.netCashflow, true)}
            </div>
            <span className="text-[11px] text-text-secondary tabular-nums">
              Saldo Akhir: {formatIDR(periodMutation.endingBalance)}
            </span>
          </Card>
        </div>
      </div>

      {/* Main Split Grid: Accounts Breakdown + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <AccountBalanceList
            summaries={accountSummaries}
            onSelectAccountInLedger={onSelectAccountInLedger}
            onAddAccount={onAddAccount}
          />
        </div>

        <div className="lg:col-span-5">
          <Card padding="md" className="space-y-4 h-full">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Distribusi Pengeluaran per Kategori
              </h2>
              <span className="text-xs font-mono text-text-secondary tabular-nums">
                {formatIDR(periodMutation.totalDebit)}
              </span>
            </div>

            {expenseByCategory.length === 0 ? (
              <div className="py-10 text-center text-xs text-text-secondary">
                Belum ada pengeluaran tercatat pada periode ini.
              </div>
            ) : (
              <div className="space-y-3.5">
                {expenseByCategory.map((item) => (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-text-primary">
                        {item.category}
                      </span>
                      <div className="flex items-center gap-2 tabular-nums">
                        <span className="font-semibold text-text-primary">
                          {formatIDR(item.amount)}
                        </span>
                        <span className="text-text-secondary font-mono w-12 text-right">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-subtle overflow-hidden border border-border">
                      <div
                        className="h-full bg-expense rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(3, item.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
