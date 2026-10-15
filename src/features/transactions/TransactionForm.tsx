import React, { useState, useEffect } from 'react';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type Transaction,
  type TransactionInput,
  type TransactionType
} from '../../types/finance';
import { getTodayISO } from '../../lib/formatters';
import { CurrencyInput } from '../../components/shared/CurrencyInput';
import { Button } from '../../components/ui/Button';

interface TransactionFormProps {
  accounts: readonly string[];
  initialData?: Transaction | null;
  onSubmit: (data: TransactionInput) => void;
  onCancel: () => void;
}

const QUICK_AMOUNTS = [50000, 150000, 500000, 1000000, 2500000] as const;

export const TransactionForm: React.FC<TransactionFormProps> = ({
  accounts,
  initialData,
  onSubmit,
  onCancel
}) => {
  const [type, setType] = useState<TransactionType>(initialData?.type ?? 'expense');
  const [amount, setAmount] = useState<number>(initialData?.amount ?? 0);
  const [date, setDate] = useState<string>(initialData?.date ?? getTodayISO());
  const [account, setAccount] = useState<string>(
    initialData?.account ?? accounts[0] ?? 'Bank BCA'
  );
  const [category, setCategory] = useState<string>(
    initialData?.category ?? EXPENSE_CATEGORIES[0]
  );
  const [note, setNote] = useState<string>(initialData?.note ?? '');
  const [error, setError] = useState<string>('');

  const availableCategories =
    type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  useEffect(() => {
    if (!initialData) {
      setCategory(type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
    }
  }, [type, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('Masukkan nominal transaksi lebih dari Rp 0');
      return;
    }
    setError('');
    onSubmit({
      type,
      amount: Math.round(amount),
      date,
      account,
      category,
      note: note.trim()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 1. Fast Type Segmented Switch */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-subtle border border-border rounded-xl">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`min-h-[44px] rounded-lg text-sm font-semibold transition-colors touch-manipulation ${
            type === 'expense'
              ? 'bg-expense text-white'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Pengeluaran (-)
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={`min-h-[44px] rounded-lg text-sm font-semibold transition-colors touch-manipulation ${
            type === 'income'
              ? 'bg-income text-white'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Pemasukan (+)
        </button>
      </div>

      {/* 2. Auto-formatted IDR Currency Input */}
      <CurrencyInput
        id="tx-amount-input"
        label="Nominal Transaksi (IDR)"
        value={amount}
        onChange={setAmount}
        required
        error={error}
        quickAmounts={QUICK_AMOUNTS}
      />

      {/* 3. Account & Date Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label
            htmlFor="tx-account-select"
            className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
          >
            Rekening / Dompet
          </label>
          <select
            id="tx-account-select"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="w-full min-h-[46px] px-3.5 py-2.5 bg-subtle border border-border rounded-lg text-sm font-medium text-text-primary focus:outline-none focus:border-brand"
          >
            {accounts.map((acc) => (
              <option key={acc} value={acc} className="bg-surface text-text-primary">
                {acc}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="tx-date-input"
            className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
          >
            Tanggal Transaksi
          </label>
          <input
            id="tx-date-input"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full min-h-[46px] px-3.5 py-2.5 bg-subtle border border-border rounded-lg text-sm font-medium text-text-primary tabular-nums focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      {/* 4. Category Chips */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
          Kategori
        </label>
        <div className="flex flex-wrap gap-1.5">
          {availableCategories.map((cat) => {
            const selected = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-2 min-h-[40px] rounded-lg text-xs font-medium border transition-colors touch-manipulation ${
                  selected
                    ? 'bg-brand text-white border-brand font-semibold'
                    : 'bg-subtle text-text-secondary border-border hover:text-text-primary'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Note Input */}
      <div>
        <label
          htmlFor="tx-note-input"
          className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
        >
          Catatan / Keterangan
        </label>
        <input
          id="tx-note-input"
          type="text"
          maxLength={200}
          placeholder="Contoh: Makan siang klien, Tagihan listrik PLN..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full min-h-[46px] px-3.5 py-2.5 bg-subtle border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} fullWidth>
          Batal
        </Button>
        <Button type="submit" variant="primary" fullWidth>
          {initialData ? 'Simpan Perubahan' : 'Simpan Transaksi'}
        </Button>
      </div>
    </form>
  );
};
