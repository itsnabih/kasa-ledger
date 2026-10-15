import React, { useState } from 'react';
import type { SavingsGoal, SavingsGoalInput } from '../../types/finance';
import { getTodayISO } from '../../lib/formatters';
import { CurrencyInput } from '../../components/shared/CurrencyInput';
import { Button } from '../../components/ui/Button';

interface GoalFormProps {
  initialData?: SavingsGoal | null;
  onSubmit: (data: SavingsGoalInput) => void;
  onCancel: () => void;
}

const GOAL_CATEGORIES = [
  'Dana Darurat',
  'Pendidikan',
  'Properti & Hunian',
  'Kendaraan',
  'Perjalanan',
  'Pernikahan & Keluarga',
  'Pensiun & Investasi',
  'Lainnya'
] as const;

export const GoalForm: React.FC<GoalFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const defaultDeadline = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return getTodayISO(d);
  };

  const [name, setName] = useState(initialData?.name ?? '');
  const [targetAmount, setTargetAmount] = useState(initialData?.targetAmount ?? 0);
  const [currentAmount, setCurrentAmount] = useState(initialData?.currentAmount ?? 0);
  const [deadline, setDeadline] = useState(initialData?.deadline ?? defaultDeadline());
  const [category, setCategory] = useState(initialData?.category ?? GOAL_CATEGORIES[0]);
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama target wajib diisi');
      return;
    }
    if (targetAmount <= 0) {
      setError('Target nominal harus lebih dari Rp 0');
      return;
    }
    setError('');
    onSubmit({
      name: name.trim(),
      targetAmount,
      currentAmount,
      deadline,
      category,
      notes: notes.trim()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="goal-name-input"
          className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
        >
          Nama Rencana Tabungan (Sinking Fund) *
        </label>
        <input
          id="goal-name-input"
          type="text"
          required
          maxLength={100}
          placeholder="Contoh: Dana Darurat 6x Pengeluaran, DP Rumah..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full min-h-[46px] px-3.5 py-2.5 bg-subtle border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
        />
      </div>

      <CurrencyInput
        id="goal-target-input"
        label="Target Nominal (IDR)"
        value={targetAmount}
        onChange={setTargetAmount}
        required
        quickAmounts={[10000000, 25000000, 50000000, 100000000]}
      />

      <CurrencyInput
        id="goal-current-input"
        label="Dana Terkumpul Saat Ini (IDR)"
        value={currentAmount}
        onChange={setCurrentAmount}
        helperText="Masukkan saldo awal yang sudah dialokasikan untuk target ini"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label
            htmlFor="goal-category-select"
            className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
          >
            Kategori Target
          </label>
          <select
            id="goal-category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full min-h-[46px] px-3.5 py-2.5 bg-subtle border border-border rounded-lg text-sm font-medium text-text-primary focus:outline-none focus:border-brand"
          >
            {GOAL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-surface text-text-primary">
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="goal-deadline-input"
            className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
          >
            Target Tanggal Tercapai
          </label>
          <input
            id="goal-deadline-input"
            type="date"
            required
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full min-h-[46px] px-3.5 py-2.5 bg-subtle border border-border rounded-lg text-sm font-medium text-text-primary tabular-nums focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="goal-notes-input"
          className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
        >
          Catatan Strategi / Instrumen Penyimpanan
        </label>
        <input
          id="goal-notes-input"
          type="text"
          maxLength={200}
          placeholder="Contoh: Disimpan di SeaBank / Reksa Dana Pasar Uang"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full min-h-[46px] px-3.5 py-2.5 bg-subtle border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
        />
      </div>

      {error ? <p className="text-xs font-medium text-expense">{error}</p> : null}

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} fullWidth>
          Batal
        </Button>
        <Button type="submit" variant="primary" fullWidth>
          {initialData ? 'Simpan Perubahan' : 'Buat Target Tabungan'}
        </Button>
      </div>
    </form>
  );
};
