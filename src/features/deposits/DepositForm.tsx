import React, { useState, useMemo } from 'react';
import type { TimeDeposit, TimeDepositInput } from '../../types/finance';
import { calculateDepositYield } from '../../lib/math';
import { formatIDR, getTodayISO } from '../../lib/formatters';
import { CurrencyInput } from '../../components/shared/CurrencyInput';
import { Button } from '../../components/ui/Button';

interface DepositFormProps {
  initialData?: TimeDeposit | null;
  onSubmit: (data: TimeDepositInput) => void;
  onCancel: () => void;
}

export const DepositForm: React.FC<DepositFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const defaultMaturity = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return getTodayISO(d);
  };

  const [bankName, setBankName] = useState(initialData?.bankName ?? '');
  const [principal, setPrincipal] = useState(initialData?.principal ?? 10000000);
  const [interestRatePa, setInterestRatePa] = useState(
    String(initialData?.interestRatePa ?? '5.0')
  );
  const [taxRatePercent, setTaxRatePercent] = useState(
    String(initialData?.taxRatePercent ?? '20')
  );
  const [startDate, setStartDate] = useState(initialData?.startDate ?? getTodayISO());
  const [maturityDate, setMaturityDate] = useState(
    initialData?.maturityDate ?? defaultMaturity()
  );
  const [autoRollOver, setAutoRollOver] = useState(initialData?.autoRollOver ?? true);
  const [status, setStatus] = useState<TimeDeposit['status']>(
    initialData?.status ?? 'active'
  );
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [error, setError] = useState('');

  const parsedRate = Number.parseFloat(interestRatePa) || 0;
  const parsedTax = Number.parseFloat(taxRatePercent) || 0;

  const previewYield = useMemo(
    () =>
      calculateDepositYield({
        principal,
        interestRatePa: parsedRate,
        taxRatePercent: parsedTax,
        startDate,
        maturityDate
      }),
    [principal, parsedRate, parsedTax, startDate, maturityDate]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim()) {
      setError('Nama bank atau instrumen deposito wajib diisi');
      return;
    }
    if (principal <= 0) {
      setError('Nominal pokok deposito harus lebih dari Rp 0');
      return;
    }
    if (maturityDate <= startDate) {
      setError('Tanggal jatuh tempo harus setelah tanggal mulai penempatan');
      return;
    }
    setError('');
    onSubmit({
      bankName: bankName.trim(),
      principal: Math.round(principal),
      interestRatePa: parsedRate,
      taxRatePercent: parsedTax,
      startDate,
      maturityDate,
      autoRollOver,
      status,
      notes: notes.trim()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="dep-bank-input"
          className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
        >
          Nama Bank / Instrumen Deposito *
        </label>
        <input
          id="dep-bank-input"
          type="text"
          required
          maxLength={100}
          placeholder="Contoh: SeaBank Deposito 3 Bulan, Bank Mandiri Deposito..."
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          className="w-full min-h-[46px] px-3.5 py-2.5 bg-subtle border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand"
        />
      </div>

      <CurrencyInput
        id="dep-principal-input"
        label="Pokok Penempatan Deposito (Principal IDR)"
        value={principal}
        onChange={setPrincipal}
        required
        quickAmounts={[10000000, 25000000, 50000000, 100000000]}
      />

      <div className="grid grid-cols-2 gap-3.5">
        <div>
          <label
            htmlFor="dep-rate-input"
            className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
          >
            Suku Bunga (% p.a.)
          </label>
          <input
            id="dep-rate-input"
            type="number"
            step="0.05"
            min="0"
            max="100"
            required
            value={interestRatePa}
            onChange={(e) => setInterestRatePa(e.target.value)}
            className="w-full min-h-[46px] px-3.5 py-2.5 bg-subtle border border-border rounded-lg text-sm font-semibold text-text-primary tabular-nums focus:outline-none focus:border-brand"
          />
        </div>

        <div>
          <label
            htmlFor="dep-tax-input"
            className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
          >
            Pajak Bunga (%)
          </label>
          <input
            id="dep-tax-input"
            type="number"
            step="1"
            min="0"
            max="100"
            required
            value={taxRatePercent}
            onChange={(e) => setTaxRatePercent(e.target.value)}
            className="w-full min-h-[46px] px-3.5 py-2.5 bg-subtle border border-border rounded-lg text-sm font-semibold text-text-primary tabular-nums focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label
            htmlFor="dep-start-input"
            className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
          >
            Tanggal Mulai Penempatan
          </label>
          <input
            id="dep-start-input"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full min-h-[46px] px-3.5 py-2.5 bg-subtle border border-border rounded-lg text-sm font-medium text-text-primary tabular-nums"
          />
        </div>

        <div>
          <label
            htmlFor="dep-maturity-input"
            className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
          >
            Tanggal Jatuh Tempo
          </label>
          <input
            id="dep-maturity-input"
            type="date"
            required
            value={maturityDate}
            onChange={(e) => setMaturityDate(e.target.value)}
            className="w-full min-h-[46px] px-3.5 py-2.5 bg-subtle border border-border rounded-lg text-sm font-medium text-text-primary tabular-nums"
          />
        </div>
      </div>

      {/* Live Net Yield Simulation Box */}
      <div className="p-3.5 rounded-xl bg-subtle/80 border border-border space-y-1.5 text-xs tabular-nums">
        <div className="font-bold uppercase tracking-wider text-text-secondary text-[11px]">
          Simulasi Imbal Hasil Bersih ({previewYield.tenureDays} Hari)
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Bunga Kotor (Gross):</span>
          <span className="font-medium text-text-primary">
            {formatIDR(previewYield.grossInterest)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Potongan Pajak ({parsedTax}%):</span>
          <span className="font-medium text-expense">
            -{formatIDR(previewYield.taxAmount)}
          </span>
        </div>
        <div className="flex justify-between pt-1 border-t border-border">
          <span className="font-semibold text-text-primary">Estimasi Bunga Bersih:</span>
          <span className="font-bold text-income">
            +{formatIDR(previewYield.netInterest)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-text-primary">Total Cair Saat Jatuh Tempo:</span>
          <span className="font-bold text-deposit">
            {formatIDR(previewYield.totalMaturityPayout)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex items-center gap-2.5 p-3 rounded-lg bg-subtle border border-border text-xs font-semibold text-text-primary cursor-pointer">
          <input
            type="checkbox"
            checked={autoRollOver}
            onChange={(e) => setAutoRollOver(e.target.checked)}
            className="w-4 h-4 rounded accent-brand"
          />
          <span>Perpanjangan Otomatis (ARO)</span>
        </label>

        <select
          aria-label="Status Deposito"
          value={status}
          onChange={(e) => setStatus(e.target.value as TimeDeposit['status'])}
          className="min-h-[44px] px-3 py-2 bg-subtle border border-border rounded-lg text-xs font-semibold text-text-primary"
        >
          <option value="active">Status: Aktif Berjalan</option>
          <option value="matured">Status: Jatuh Tempo</option>
          <option value="closed">Status: Sudah Dicairkan</option>
        </select>
      </div>

      <div>
        <input
          type="text"
          maxLength={200}
          placeholder="Catatan bilyet / nomor rekening deposito (opsional)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full min-h-[44px] px-3.5 py-2 bg-subtle border border-border rounded-lg text-sm text-text-primary"
        />
      </div>

      {error ? <p className="text-xs font-medium text-expense">{error}</p> : null}

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} fullWidth>
          Batal
        </Button>
        <Button type="submit" variant="primary" fullWidth>
          {initialData ? 'Simpan Perubahan' : 'Simpan Deposito'}
        </Button>
      </div>
    </form>
  );
};
