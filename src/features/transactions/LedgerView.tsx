import React, { useMemo, useState } from 'react';
import {
  Search,
  FileText,
  Plus,
  Edit3,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from 'lucide-react';
import type {
  PeriodFilter,
  Transaction,
  TransactionInput
} from '../../types/finance';
import { calculateMutationWithRunningBalance } from '../../lib/math';
import { formatDateID, formatIDR, getPeriodLabel } from '../../lib/formatters';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { EmptyState } from '../../components/shared/EmptyState';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { TransactionForm } from './TransactionForm';

interface LedgerViewProps {
  accounts: readonly string[];
  transactions: readonly Transaction[];
  periodFilter: PeriodFilter;
  selectedAccount: string;
  onChangeAccount: (account: string) => void;
  onOpenNewTransaction: () => void;
  onUpdateTransaction: (id: string, input: TransactionInput) => void;
  onDeleteTransaction: (id: string) => void;
  onExportStatementPDF: (account: string) => Promise<void>;
}

export const LedgerView: React.FC<LedgerViewProps> = ({
  accounts,
  transactions,
  periodFilter,
  selectedAccount,
  onChangeAccount,
  onOpenNewTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onExportStatementPDF
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'income' | 'expense'>('ALL');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const mutation = useMemo(() => {
    const startDate =
      periodFilter.preset === 'all_time' ? undefined : periodFilter.startDate;
    const endDate =
      periodFilter.preset === 'all_time' ? undefined : periodFilter.endDate;
    return calculateMutationWithRunningBalance(transactions, {
      startDate,
      endDate,
      account: selectedAccount,
      searchQuery,
      typeFilter
    });
  }, [transactions, periodFilter, selectedAccount, searchQuery, typeFilter]);

  // Display newest first in UI while preserving exact chronological running balance
  const displayRows = useMemo(() => [...mutation.rows].reverse(), [mutation.rows]);

  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await onExportStatementPDF(selectedAccount);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar: Search, Account Filter, Type Filter, and PDF Export */}
      <Card padding="md" className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2"
              strokeWidth={1.75}
            />
            <input
              type="search"
              placeholder="Cari catatan, kategori, atau nama rekening..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-subtle border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
            />
          </div>

          {/* Account & Type Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-subtle border border-border rounded-lg px-2.5 min-h-[44px]">
              <Filter className="w-3.5 h-3.5 text-text-secondary mr-2" strokeWidth={1.75} />
              <select
                aria-label="Filter Rekening"
                value={selectedAccount}
                onChange={(e) => onChangeAccount(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-medium text-text-primary focus:outline-none pr-2"
              >
                <option value="ALL" className="bg-surface text-text-primary">
                  Semua Rekening ({accounts.length})
                </option>
                {accounts.map((acc) => (
                  <option key={acc} value={acc} className="bg-surface text-text-primary">
                    {acc}
                  </option>
                ))}
              </select>
            </div>

            <div className="inline-flex bg-subtle border border-border rounded-lg p-1 min-h-[44px]">
              {(['ALL', 'income', 'expense'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors touch-manipulation ${
                    typeFilter === t
                      ? 'bg-surface text-text-primary border border-border font-semibold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {t === 'ALL' ? 'Semua' : t === 'income' ? 'Masuk (+)' : 'Keluar (-)'}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExporting}
              leftIcon={<FileText className="w-4 h-4 text-brand" strokeWidth={1.75} />}
            >
              {isExporting ? 'Mencetak...' : 'PDF Mutasi'}
            </Button>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-3 border-t border-border">
          <div className="p-2.5 rounded-lg bg-subtle/60 border border-border">
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
              Saldo Awal
            </div>
            <div className="text-sm font-bold text-text-primary tabular-nums mt-0.5">
              {formatIDR(mutation.openingBalance)}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-subtle/60 border border-border">
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
              Total Kredit (+)
            </div>
            <div className="text-sm font-bold text-income tabular-nums mt-0.5">
              {formatIDR(mutation.totalCredit, true)}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-subtle/60 border border-border">
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
              Total Debit (-)
            </div>
            <div className="text-sm font-bold text-expense tabular-nums mt-0.5">
              {formatIDR(-mutation.totalDebit)}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-subtle/60 border border-border">
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
              Arus Kas Bersih
            </div>
            <div
              className={`text-sm font-bold tabular-nums mt-0.5 ${
                mutation.netCashflow >= 0 ? 'text-income' : 'text-expense'
              }`}
            >
              {formatIDR(mutation.netCashflow, true)}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-2.5 rounded-lg bg-brand/10 border border-brand/30">
            <div className="text-[10px] font-bold uppercase tracking-wider text-brand">
              Saldo Akhir
            </div>
            <div className="text-sm font-bold text-text-primary tabular-nums mt-0.5">
              {formatIDR(mutation.endingBalance)}
            </div>
          </div>
        </div>
      </Card>

      {/* Mutation Table / Mobile Card List */}
      {displayRows.length === 0 ? (
        <EmptyState
          title="Tidak Ada Mutasi Transaksi"
          description={`Belum ditemukan catatan mutasi untuk ${
            selectedAccount === 'ALL' ? 'semua rekening' : selectedAccount
          } pada ${getPeriodLabel(periodFilter)}.`}
          actionLabel="Catat Transaksi Baru"
          onAction={onOpenNewTransaction}
          icon={<Plus className="w-5 h-5" strokeWidth={1.75} />}
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          {/* Desktop Swiss Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-subtle/70 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Rekening</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Keterangan / Catatan</th>
                  <th className="py-3 px-4 text-right">Mutasi (IDR)</th>
                  <th className="py-3 px-4 text-right">Saldo Berjalan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {displayRows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-subtle/40 transition-colors group"
                  >
                    <td className="py-3 px-4 whitespace-nowrap text-xs text-text-secondary tabular-nums">
                      {formatDateID(row.date)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-text-primary">
                      {row.account}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge tone={row.type === 'income' ? 'income' : 'neutral'}>
                        {row.category}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-text-primary max-w-xs truncate">
                      {row.note || '-'}
                    </td>
                    <td
                      className={`py-3 px-4 whitespace-nowrap text-right font-semibold tabular-nums ${
                        row.type === 'income' ? 'text-income' : 'text-expense'
                      }`}
                    >
                      {row.type === 'income'
                        ? formatIDR(row.amount, true)
                        : formatIDR(-row.amount)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right font-bold text-text-primary tabular-nums">
                      {formatIDR(row.runningBalance)}
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingTx(row)}
                          aria-label="Edit transaksi"
                          className="p-2 min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-subtle touch-manipulation"
                        >
                          <Edit3 className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTx(row)}
                          aria-label="Hapus transaksi"
                          className="p-2 min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg text-text-secondary hover:text-expense hover:bg-expense/10 touch-manipulation"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Ergonomic Mutation Cards */}
          <div className="md:hidden divide-y divide-border">
            {displayRows.map((row) => (
              <div key={row.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        row.type === 'income'
                          ? 'bg-income/10 border-income/30 text-income'
                          : 'bg-expense/10 border-expense/30 text-expense'
                      }`}
                    >
                      {row.type === 'income' ? (
                        <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" strokeWidth={1.75} />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-text-primary">
                        {row.note || row.category}
                      </div>
                      <div className="text-xs text-text-secondary flex items-center gap-1.5 tabular-nums">
                        <span>{formatDateID(row.date)}</span>
                        <span>•</span>
                        <span className="font-medium text-text-primary">{row.account}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-sm font-bold tabular-nums ${
                        row.type === 'income' ? 'text-income' : 'text-expense'
                      }`}
                    >
                      {row.type === 'income'
                        ? formatIDR(row.amount, true)
                        : formatIDR(-row.amount)}
                    </div>
                    <div className="text-[11px] text-text-secondary tabular-nums">
                      Saldo: {formatIDR(row.runningBalance)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Badge tone="neutral">{row.category}</Badge>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingTx(row)}
                      className="px-2.5 py-1.5 min-h-[40px] inline-flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary rounded-lg hover:bg-subtle touch-manipulation"
                    >
                      <Edit3 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingTx(row)}
                      className="px-2.5 py-1.5 min-h-[40px] inline-flex items-center gap-1 text-xs font-medium text-expense rounded-lg hover:bg-expense/10 touch-manipulation"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Edit Modal */}
      <BottomSheet
        isOpen={editingTx !== null}
        onClose={() => setEditingTx(null)}
        title="Edit Transaksi"
        subtitle="Perubahan nominal otomatis memperbarui saldo berjalan"
      >
        {editingTx ? (
          <TransactionForm
            accounts={accounts}
            initialData={editingTx}
            onCancel={() => setEditingTx(null)}
            onSubmit={(updated) => {
              onUpdateTransaction(editingTx.id, updated);
              setEditingTx(null);
            }}
          />
        ) : null}
      </BottomSheet>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deletingTx !== null}
        onClose={() => setDeletingTx(null)}
        onConfirm={() => {
          if (deletingTx) {
            onDeleteTransaction(deletingTx.id);
          }
        }}
        title="Hapus Catatan Transaksi?"
        description={
          deletingTx
            ? `Transaksi "${deletingTx.note || deletingTx.category}" sebesar ${formatIDR(
                deletingTx.amount
              )} pada ${formatDateID(deletingTx.date)} akan dihapus permanen.`
            : ''
        }
        confirmLabel="Hapus Transaksi"
      />
    </div>
  );
};
