import React, { useState } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import type { Bill } from '../../types/finance';
import { calculateBillMetrics } from '../../lib/math';
import { formatIDR } from '../../lib/formatters';
import { CurrencyInput } from '../../components/shared/CurrencyInput';
import { Button } from '../../components/ui/Button';

interface BillLateFeeModalProps {
  bill: Bill;
  onCancel: () => void;
  onSaveLateFee: (lateFee: number) => void;
}

export const BillLateFeeModal: React.FC<BillLateFeeModalProps> = ({
  bill,
  onCancel,
  onSaveLateFee
}) => {
  const metrics = calculateBillMetrics(bill);
  const [lateFee, setLateFee] = useState<number>(bill.lateFee || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveLateFee(lateFee);
  };

  const newTotalWithFee =
    bill.totalAmount + lateFee - (bill.paidAmount || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3.5 rounded-xl bg-expense/10 border border-expense/30 space-y-1.5 text-xs text-expense">
        <div className="flex items-center gap-1.5 font-bold">
          <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
          <span>Pengelolaan Denda Keterlambatan</span>
        </div>
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Jika Anda terlambat membayar dari tenggat{' '}
          <strong className="text-text-primary">{bill.dueDate}</strong> dan dikenakan biaya denda
          oleh pihak kreditur/pemberi pinjaman ({bill.source}), input nominal denda di bawah ini.
          Denda akan diakumulasikan ke total kewajiban yang harus dibayarkan.
        </p>
      </div>

      <div className="p-3 rounded-lg bg-subtle border border-border space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-text-secondary">Sumber Tagihan:</span>
          <span className="font-semibold text-text-primary">{bill.source}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Sisa Pokok Tagihan:</span>
          <span className="font-semibold text-text-primary">
            {formatIDR(metrics.remainingPrincipal)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Denda Saat Ini:</span>
          <span className="font-semibold text-expense">
            {formatIDR(bill.lateFee || 0)}
          </span>
        </div>
      </div>

      <CurrencyInput
        id="bill-edit-late-fee"
        label="Nominal Denda Keterlambatan"
        required
        value={lateFee}
        onChange={setLateFee}
        placeholder="0"
        quickAmounts={[0, 25000, 50000, 100000, 150000]}
        helperText="Pilih Rp 0 jika denda dihapuskan atau tidak ada denda"
      />

      {/* Real-time Preview of new total obligation */}
      <div className="p-3 rounded-lg bg-surface border border-border flex items-center justify-between text-xs">
        <span className="text-text-secondary">Total Tagihan Baru (Pokok + Denda - Bayar):</span>
        <span className="text-sm font-bold text-expense tabular-nums">
          {formatIDR(Math.max(0, newTotalWithFee))}
        </span>
      </div>

      <div className="pt-2 flex items-center justify-end gap-3 border-t border-border">
        <Button variant="ghost" type="button" onClick={onCancel}>
          Batal
        </Button>
        <Button
          variant="primary"
          type="submit"
          leftIcon={<Check className="w-4 h-4" strokeWidth={1.75} />}
        >
          Simpan Denda
        </Button>
      </div>
    </form>
  );
};
