import React, { useState } from 'react';
import { Wallet, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { AccountBalanceSummary } from '../../types/finance';
import { formatIDR } from '../../lib/formatters';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BottomSheet } from '../../components/ui/BottomSheet';

interface AccountBalanceListProps {
  summaries: readonly AccountBalanceSummary[];
  onSelectAccountInLedger: (accountName: string) => void;
  onAddAccount: (name: string) => void;
}

export const AccountBalanceList: React.FC<AccountBalanceListProps> = ({
  summaries,
  onSelectAccountInLedger,
  onAddAccount
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newAccountName.trim();
    if (!cleaned) return;
    onAddAccount(cleaned);
    setNewAccountName('');
    setIsAddOpen(false);
  };

  return (
    <Card padding="md" className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-brand" strokeWidth={1.75} />
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            Posisi Saldo per Rekening & Dompet
          </h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" strokeWidth={1.75} />}
        >
          Tambah Akun
        </Button>
      </div>

      <div className="divide-y divide-border">
        {summaries.map((item) => (
          <div
            key={item.account}
            className="py-3 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectAccountInLedger(item.account)}
                  className="text-sm font-semibold text-text-primary hover:text-brand transition-colors text-left touch-manipulation"
                >
                  {item.account}
                </button>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-subtle border border-border text-text-secondary tabular-nums">
                  {item.sharePercentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary tabular-nums">
                <span className="inline-flex items-center gap-1 text-income">
                  <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {formatIDR(item.totalInflow)}
                </span>
                <span className="inline-flex items-center gap-1 text-expense">
                  <ArrowDownRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {formatIDR(item.totalOutflow)}
                </span>
                <span>• {item.transactionCount} transaksi</span>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0">
              <div className="text-right">
                <div className="text-[11px] text-text-secondary">Saldo Tersedia</div>
                <div
                  className={`text-sm sm:text-base font-bold tabular-nums ${
                    item.endingBalance < 0 ? 'text-expense' : 'text-text-primary'
                  }`}
                >
                  {formatIDR(item.endingBalance)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Tambah Rekening / Dompet Baru"
        subtitle="Tambahkan bank, e-wallet, atau brankas kas baru ke daftar akun"
      >
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <label
              htmlFor="new-account-input"
              className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
            >
              Nama Bank / Dompet Digital
            </label>
            <input
              id="new-account-input"
              type="text"
              required
              maxLength={50}
              placeholder="Contoh: Bank Jago, Blu by BCA, OVO"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              className="w-full min-h-[46px] px-3.5 py-2.5 bg-subtle border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsAddOpen(false)} fullWidth>
              Batal
            </Button>
            <Button type="submit" variant="primary" fullWidth>
              Simpan Akun
            </Button>
          </div>
        </form>
      </BottomSheet>
    </Card>
  );
};
