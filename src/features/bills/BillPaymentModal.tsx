import React, { useState } from 'react';
import { CreditCard, CheckCircle2, ArrowRight } from 'lucide-react';
import type { Bill } from '../../types/finance';
import { calculateBillMetrics } from '../../lib/math';
import { formatIDR } from '../../lib/formatters';
import { CurrencyInput } from '../../components/shared/CurrencyInput';
import { Button } from '../../components/ui/Button';

interface BillPaymentModalProps {
  bill: Bill;
  accounts: readonly string[];
  onCancel: () => void;
  onConfirmPayment: (
    amount: number,
    recordInLedger?: { account: string; note?: string },
    advanceDueDate?: boolean
  ) => void;
}

export const BillPaymentModal: React.FC<BillPaymentModalProps> = ({
  bill,
  accounts,
  onCancel,
  onConfirmPayment
}) => {
  const metrics = calculateBillMetrics(bill);
  const defaultPayAmount = Math.min(
    metrics.totalDueWithLateFee,
    bill.installmentAmount + (metrics.isOverdue ? bill.lateFee : 0)
  );

  const [paymentAmount, setPaymentAmount] = useState<number>(defaultPayAmount);
  const [recordInLedger, setRecordInLedger] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string>(
    accounts[0] || 'Bank BCA'
  );
  const [customNote, setCustomNote] = useState('');
  const [advanceDueDate, setAdvanceDueDate] = useState(true);
  const [error, setError] = useState('');

  const isFullPayoff = paymentAmount >= metrics.totalDueWithLateFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) {
      setError('Nominal pembayaran harus lebih dari 0');
      return;
    }

    onConfirmPayment(
      paymentAmount,
      recordInLedger
        ? {
            account: selectedAccount,
            note: customNote.trim() || undefined
          }
        : undefined,
      advanceDueDate
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Bill Overview Header */}
      <div className="p-3.5 rounded-xl bg-subtle/70 border border-border space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-text-primary flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-brand" strokeWidth={1.75} />
            {bill.source}
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-text-secondary">
            Tenggat: {bill.dueDate}
          </span>
        </div>
        <div className="text-xs text-text-secondary">
          Tujuan: <strong className="text-text-primary">{bill.purpose}</strong>
        </div>
        <div className="pt-2 border-t border-border/80 flex items-center justify-between text-xs">
          <span className="text-text-secondary">Total Sisa Tagihan (Termasuk Denda):</span>
          <span className="text-base font-bold text-expense tabular-nums">
            {formatIDR(metrics.totalDueWithLateFee)}
          </span>
        </div>
      </div>

      {error ? (
        <div className="p-2.5 text-xs rounded-lg bg-expense/10 border border-expense/30 text-expense font-medium">
          {error}
        </div>
      ) : null}

      {/* Quick Fill Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            setPaymentAmount(
              Math.min(metrics.totalDueWithLateFee, bill.installmentAmount)
            )
          }
          className="text-xs px-2.5 py-1.5 rounded-lg bg-subtle hover:bg-border/60 text-text-primary border border-border font-medium touch-manipulation transition-colors"
        >
          Bayar 1x Cicilan ({formatIDR(bill.installmentAmount)})
        </button>

        <button
          type="button"
          onClick={() => setPaymentAmount(metrics.totalDueWithLateFee)}
          className="text-xs px-2.5 py-1.5 rounded-lg bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30 font-semibold touch-manipulation transition-colors"
        >
          Lunasi Penuh ({formatIDR(metrics.totalDueWithLateFee)})
        </button>
      </div>

      {/* Payment Amount Input */}
      <CurrencyInput
        id="bill-payment-amount"
        label="Nominal Pembayaran"
        required
        value={paymentAmount}
        onChange={setPaymentAmount}
        placeholder="0"
      />

      {/* Record in Ledger Toggle */}
      <div className="p-3.5 rounded-xl bg-subtle/50 border border-border space-y-3">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={recordInLedger}
            onChange={(e) => setRecordInLedger(e.target.checked)}
            className="w-4 h-4 rounded border-border text-brand focus:ring-brand"
          />
          <span className="text-xs font-semibold text-text-primary">
            Potong saldo kas & catat otomatis di Buku Besar Mutasi
          </span>
        </label>

        {recordInLedger ? (
          <div className="space-y-2.5 pt-1 border-t border-border">
            <div className="space-y-1">
              <label
                htmlFor="bill-pay-account"
                className="block text-[11px] font-semibold uppercase text-text-secondary"
              >
                Sumber Rekening Pembayaran
              </label>
              <select
                id="bill-pay-account"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full min-h-[42px] px-3 py-2 bg-surface border border-border rounded-lg text-xs font-medium text-text-primary focus:outline-none focus:border-brand transition-colors"
              >
                {accounts.map((acc) => (
                  <option key={acc} value={acc}>
                    {acc}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="bill-pay-note"
                className="block text-[11px] font-semibold uppercase text-text-secondary"
              >
                Keterangan Mutasi (Opsional)
              </label>
              <input
                id="bill-pay-note"
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder={`Bayar Tagihan ${bill.source}: ${bill.purpose}`}
                className="w-full min-h-[40px] px-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-brand transition-colors"
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* Advance Due Date Checkbox */}
      {!isFullPayoff ? (
        <label className="flex items-center gap-2.5 px-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={advanceDueDate}
            onChange={(e) => setAdvanceDueDate(e.target.checked)}
            className="w-4 h-4 rounded border-border text-brand focus:ring-brand"
          />
          <span className="text-xs text-text-secondary">
            Majukan tanggal jatuh tempo secara otomatis ke bulan berikutnya (+1 bulan)
          </span>
        </label>
      ) : (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-income/10 border border-income/30 text-income text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.75} />
          <span>Pembayaran ini akan melunasi seluruh kewajiban tagihan secara penuh!</span>
        </div>
      )}

      {/* Modal Actions */}
      <div className="pt-2 flex items-center justify-end gap-3 border-t border-border">
        <Button variant="ghost" type="button" onClick={onCancel}>
          Batal
        </Button>
        <Button
          variant="primary"
          type="submit"
          rightIcon={<ArrowRight className="w-4 h-4" strokeWidth={1.75} />}
        >
          Konfirmasi Pembayaran ({formatIDR(paymentAmount)})
        </Button>
      </div>
    </form>
  );
};
