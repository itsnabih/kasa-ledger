import React, { useState } from 'react';
import type { SavingsGoal } from '../../types/finance';
import { formatIDR } from '../../lib/formatters';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { CurrencyInput } from '../../components/shared/CurrencyInput';
import { Button } from '../../components/ui/Button';

interface GoalAllocationModalProps {
  goal: SavingsGoal | null;
  accounts: readonly string[];
  onClose: () => void;
  onAllocate: (
    goalId: string,
    deltaAmount: number,
    recordInLedger?: { account: string; note?: string }
  ) => void;
}

export const GoalAllocationModal: React.FC<GoalAllocationModalProps> = ({
  goal,
  accounts,
  onClose,
  onAllocate
}) => {
  const [mode, setMode] = useState<'topup' | 'withdraw'>('topup');
  const [amount, setAmount] = useState<number>(0);
  const [syncLedger, setSyncLedger] = useState<boolean>(true);
  const [selectedAccount, setSelectedAccount] = useState<string>(
    accounts[0] ?? 'Bank BCA'
  );
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!goal) return null;

  const shortfall = Math.max(0, goal.targetAmount - goal.currentAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('Masukkan nominal lebih dari Rp 0');
      return;
    }
    if (mode === 'withdraw' && amount > goal.currentAmount) {
      setError('Nominal penarikan melebihi dana terkumpul saat ini');
      return;
    }
    const delta = mode === 'topup' ? amount : -amount;
    onAllocate(
      goal.id,
      delta,
      syncLedger ? { account: selectedAccount, note } : undefined
    );
    setAmount(0);
    setNote('');
    setError('');
    onClose();
  };

  return (
    <BottomSheet
      isOpen={goal !== null}
      onClose={onClose}
      title={`Alokasi Dana: ${goal.name}`}
      subtitle={`Terkumpul: ${formatIDR(goal.currentAmount)} dari ${formatIDR(
        goal.targetAmount
      )}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 p-1 bg-subtle border border-border rounded-xl">
          <button
            type="button"
            onClick={() => setMode('topup')}
            className={`min-h-[44px] rounded-lg text-sm font-semibold transition-colors touch-manipulation ${
              mode === 'topup'
                ? 'bg-brand text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Tambah Dana (+ Top-Up)
          </button>
          <button
            type="button"
            onClick={() => setMode('withdraw')}
            className={`min-h-[44px] rounded-lg text-sm font-semibold transition-colors touch-manipulation ${
              mode === 'withdraw'
                ? 'bg-deposit text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Tarik Dana (- Withdraw)
          </button>
        </div>

        <CurrencyInput
          id="goal-alloc-amount"
          label={mode === 'topup' ? 'Nominal Top-Up (IDR)' : 'Nominal Penarikan (IDR)'}
          value={amount}
          onChange={setAmount}
          required
          error={error}
          quickAmounts={
            mode === 'topup' && shortfall > 0
              ? [500000, 1000000, 2500000, shortfall]
              : [500000, 1000000, 2500000]
          }
        />

        <div className="p-3.5 rounded-xl bg-subtle/60 border border-border space-y-3">
          <label className="flex items-center gap-2.5 text-xs font-semibold text-text-primary cursor-pointer">
            <input
              type="checkbox"
              checked={syncLedger}
              onChange={(e) => setSyncLedger(e.target.checked)}
              className="w-4 h-4 rounded accent-brand"
            />
            <span>Catat otomatis di Buku Besar Mutasi Rekening</span>
          </label>

          {syncLedger ? (
            <div className="space-y-3 pt-1">
              <div>
                <label
                  htmlFor="alloc-account-select"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1"
                >
                  {mode === 'topup' ? 'Sumber Rekening Kas' : 'Rekening Tujuan Pencairan'}
                </label>
                <select
                  id="alloc-account-select"
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 bg-surface border border-border rounded-lg text-xs font-medium text-text-primary"
                >
                  {accounts.map((acc) => (
                    <option key={acc} value={acc}>
                      {acc}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Catatan tambahan (opsional)..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-primary"
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="outline" onClick={onClose} fullWidth>
            Batal
          </Button>
          <Button type="submit" variant="primary" fullWidth>
            Konfirmasi Alokasi
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
};
