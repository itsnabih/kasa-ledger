import React, { useState } from 'react';
import type { Bill, BillFrequency, BillInput } from '../../types/finance';
import { getTodayISO } from '../../lib/formatters';
import { CurrencyInput } from '../../components/shared/CurrencyInput';
import { Button } from '../../components/ui/Button';

interface BillFormProps {
  initialData?: Bill | null;
  onSubmit: (data: BillInput) => void;
  onCancel: () => void;
}

const COMMON_SOURCES = [
  'Bank BCA',
  'Bank Mandiri',
  'Bank BRI',
  'Shopee PayLater',
  'GoPay Later',
  'Kredivo',
  'KTA / Pinjaman Bank',
  'Kartu Kredit',
  'Koperasi Karyawan',
  'Pinjaman Keluarga'
] as const;

const COMMON_PURPOSES = [
  'Renovasi Rumah',
  'Modal Usaha / Kerja',
  'Beli Laptop / Gadget',
  'Kendaraan / Motor',
  'Biaya Pendidikan',
  'Kebutuhan Darurat / Medis',
  'Peralatan Rumah Tangga'
] as const;

export const BillForm: React.FC<BillFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const defaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // default 2 weeks from now
    return getTodayISO(d);
  };

  const [source, setSource] = useState(initialData?.source ?? '');
  const [purpose, setPurpose] = useState(initialData?.purpose ?? '');
  const [totalAmount, setTotalAmount] = useState(initialData?.totalAmount ?? 5000000);
  const [installmentAmount, setInstallmentAmount] = useState(
    initialData?.installmentAmount ?? 500000
  );
  const [lateFee, setLateFee] = useState(initialData?.lateFee ?? 0);
  const [paidAmount, setPaidAmount] = useState(initialData?.paidAmount ?? 0);
  const [dueDate, setDueDate] = useState(initialData?.dueDate ?? defaultDueDate());
  const [frequency, setFrequency] = useState<BillFrequency>(
    initialData?.frequency ?? 'monthly'
  );
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanSource = source.trim();
    const cleanPurpose = purpose.trim();

    if (!cleanSource) {
      setError('Asal / sumber tagihan (kreditur) wajib diisi.');
      return;
    }
    if (!cleanPurpose) {
      setError('Kebutuhan / tujuan penggunaan pinjaman wajib diisi.');
      return;
    }
    if (totalAmount <= 0) {
      setError('Total nominal tagihan harus lebih dari 0.');
      return;
    }
    if (installmentAmount <= 0) {
      setError('Nominal pembayaran per periode harus lebih dari 0.');
      return;
    }
    if (!dueDate) {
      setError('Tanggal tenggat / jatuh tempo wajib diisi.');
      return;
    }

    const totalWithFee = totalAmount + lateFee;
    const isPaid = paidAmount >= totalWithFee;

    onSubmit({
      source: cleanSource,
      purpose: cleanPurpose,
      totalAmount,
      installmentAmount,
      lateFee,
      paidAmount,
      dueDate,
      frequency,
      status: isPaid ? 'paid' : 'active',
      notes: notes.trim() || undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <div className="p-3 text-xs rounded-lg bg-expense/10 border border-expense/30 text-expense font-medium">
          {error}
        </div>
      ) : null}

      {/* Sumber / Berasal Dari Mana */}
      <div className="space-y-1.5">
        <label
          htmlFor="bill-source"
          className="block text-xs font-semibold uppercase tracking-wider text-text-secondary"
        >
          Berasal Dari Mana (Sumber / Pihak Pemberi Pinjaman) <span className="text-expense">*</span>
        </label>
        <input
          id="bill-source"
          type="text"
          required
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Contoh: Shopee PayLater, Bank Mandiri KTA, Kartu Kredit BCA..."
          className="w-full min-h-[44px] px-3.5 py-2 bg-subtle border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand focus:bg-surface transition-colors"
        />
        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {COMMON_SOURCES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSource(s)}
              className="text-[11px] px-2 py-1 rounded bg-subtle hover:bg-border/60 text-text-secondary border border-border touch-manipulation transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Kebutuhan Pinjaman / Digunakan Untuk Apa */}
      <div className="space-y-1.5">
        <label
          htmlFor="bill-purpose"
          className="block text-xs font-semibold uppercase tracking-wider text-text-secondary"
        >
          Digunakan Untuk Apa (Tujuan Kebutuhan Pinjaman) <span className="text-expense">*</span>
        </label>
        <input
          id="bill-purpose"
          type="text"
          required
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="Contoh: Renovasi Dapur Rumah, Beli Laptop Kantor Lenovo, Modal Usaha..."
          className="w-full min-h-[44px] px-3.5 py-2 bg-subtle border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand focus:bg-surface transition-colors"
        />
        {/* Quick Purpose Chips */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {COMMON_PURPOSES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPurpose(p)}
              className="text-[11px] px-2 py-1 rounded bg-subtle hover:bg-border/60 text-text-secondary border border-border touch-manipulation transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Total Berapa & Pembayaran Per Periode Berapa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <CurrencyInput
          id="bill-total-amount"
          label="Total Tagihan / Pinjaman (Total Berapa)"
          required
          value={totalAmount}
          onChange={setTotalAmount}
          placeholder="5.000.000"
          quickAmounts={[1000000, 3000000, 5000000, 10000000, 25000000]}
        />

        <CurrencyInput
          id="bill-installment"
          label="Pembayaran per Periode (Cicilan)"
          required
          value={installmentAmount}
          onChange={setInstallmentAmount}
          placeholder="500.000"
          quickAmounts={[250000, 500000, 1000000, 2000000]}
        />
      </div>

      {/* Denda Keterlambatan & Sudah Dibayar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <CurrencyInput
          id="bill-late-fee"
          label="Denda Keterlambatan (Bila Ada)"
          value={lateFee}
          onChange={setLateFee}
          placeholder="0"
          helperText="Isi nominal denda jika ada keterlambatan bayar"
          quickAmounts={[0, 25000, 50000, 100000]}
        />

        <CurrencyInput
          id="bill-paid-amount"
          label="Sudah Dibayar Sejauh Ini"
          value={paidAmount}
          onChange={setPaidAmount}
          placeholder="0"
          helperText="Akumulasi cicilan yang sudah Anda bayar"
        />
      </div>

      {/* Tenggat / Jatuh Tempo & Frekuensi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <label
            htmlFor="bill-due-date"
            className="block text-xs font-semibold uppercase tracking-wider text-text-secondary"
          >
            Tenggat Jatuh Tempo <span className="text-expense">*</span>
          </label>
          <input
            id="bill-due-date"
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full min-h-[46px] px-3.5 py-2.5 bg-subtle border border-border rounded-lg text-sm text-text-primary tabular-nums focus:outline-none focus:border-brand focus:bg-surface transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="bill-frequency"
            className="block text-xs font-semibold uppercase tracking-wider text-text-secondary"
          >
            Periode Pembayaran
          </label>
          <select
            id="bill-frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as BillFrequency)}
            className="w-full min-h-[46px] px-3.5 py-2.5 bg-subtle border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand focus:bg-surface transition-colors"
          >
            <option value="monthly">Bulanan (Monthly)</option>
            <option value="weekly">Mingguan (Weekly)</option>
            <option value="biweekly">2 Mingguan (Bi-weekly)</option>
            <option value="lump_sum">Sekali Bayar (Lump Sum)</option>
            <option value="custom">Kustom / Fleksibel</option>
          </select>
        </div>
      </div>

      {/* Catatan Tambahan */}
      <div className="space-y-1.5">
        <label
          htmlFor="bill-notes"
          className="block text-xs font-semibold uppercase tracking-wider text-text-secondary"
        >
          Catatan / Nomor Kontrak (Opsional)
        </label>
        <textarea
          id="bill-notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Contoh: No. Kontrak/Perjanjian, tanggal autodebet, atau kontak penagih..."
          className="w-full px-3.5 py-2 bg-subtle border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand focus:bg-surface transition-colors resize-none"
        />
      </div>

      <div className="pt-2 flex items-center justify-end gap-3 border-t border-border">
        <Button variant="ghost" type="button" onClick={onCancel}>
          Batal
        </Button>
        <Button variant="primary" type="submit">
          {initialData ? 'Simpan Perubahan' : 'Simpan Tagihan Baru'}
        </Button>
      </div>
    </form>
  );
};
