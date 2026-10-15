import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit3,
  Trash2,
  DollarSign,
  Search,
  TrendingDown,
  ShieldAlert
} from 'lucide-react';
import type { Bill, BillInput } from '../../types/finance';
import { calculateBillMetrics, calculateBillsSummary } from '../../lib/math';
import { formatDateID, formatIDR, getTodayISO } from '../../lib/formatters';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { EmptyState } from '../../components/shared/EmptyState';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { BillForm } from './BillForm';
import { BillPaymentModal } from './BillPaymentModal';
import { BillLateFeeModal } from './BillLateFeeModal';

interface BillsViewProps {
  bills: readonly Bill[];
  accounts: readonly string[];
  onAddBill: (input: BillInput) => void;
  onUpdateBill: (id: string, input: BillInput) => void;
  onPayInstallment: (
    id: string,
    amount: number,
    recordInLedger?: { account: string; note?: string },
    advanceDueDate?: boolean
  ) => void;
  onUpdateLateFee: (id: string, lateFee: number) => void;
  onDeleteBill: (id: string) => void;
}

type BillStatusFilter = 'all' | 'active' | 'overdue' | 'paid';

export const BillsView: React.FC<BillsViewProps> = ({
  bills,
  accounts,
  onAddBill,
  onUpdateBill,
  onPayInstallment,
  onUpdateLateFee,
  onDeleteBill
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [payingBill, setPayingBill] = useState<Bill | null>(null);
  const [lateFeeBill, setLateFeeBill] = useState<Bill | null>(null);
  const [deletingBill, setDeletingBill] = useState<Bill | null>(null);

  const [statusFilter, setStatusFilter] = useState<BillStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const todayIso = getTodayISO();

  // Summary KPI Calculations
  const summary = useMemo(
    () => calculateBillsSummary(bills, todayIso),
    [bills, todayIso]
  );

  // Filtered Bills List
  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const metrics = calculateBillMetrics(bill, todayIso);

      // Status Filter
      if (statusFilter === 'active' && metrics.isPaid) return false;
      if (statusFilter === 'paid' && !metrics.isPaid) return false;
      if (statusFilter === 'overdue' && !metrics.isOverdue) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSource = bill.source.toLowerCase().includes(q);
        const matchPurpose = bill.purpose.toLowerCase().includes(q);
        const matchNotes = bill.notes?.toLowerCase().includes(q);
        if (!matchSource && !matchPurpose && !matchNotes) return false;
      }

      return true;
    });
  }, [bills, statusFilter, searchQuery, todayIso]);

  return (
    <div className="space-y-6">
      {/* 4 Bento KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Sisa Hutang */}
        <Card padding="md" className="space-y-1">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span className="font-medium">Total Sisa Tagihan (Liabilitas)</span>
            <TrendingDown className="w-4 h-4 text-expense" strokeWidth={1.75} />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-expense tabular-nums">
            {formatIDR(summary.totalLiabilities)}
          </div>
          <p className="text-[11px] text-text-secondary">
            Dari total plafon {formatIDR(summary.totalPrincipal)}
          </p>
        </Card>

        {/* Card 2: Cicilan Bulan Ini */}
        <Card padding="md" className="space-y-1">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span className="font-medium">Cicilan Jatuh Tempo Bulan Ini</span>
            <Clock className="w-4 h-4 text-brand" strokeWidth={1.75} />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-text-primary tabular-nums">
            {formatIDR(summary.upcomingThisMonthAmount)}
          </div>
          <p className="text-[11px] text-text-secondary">
            Estimasi kewajiban kas periode berjalan
          </p>
        </Card>

        {/* Card 3: Total Denda Keterlambatan */}
        <Card padding="md" className="space-y-1">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span className="font-medium">Denda Keterlambatan</span>
            {summary.totalLateFee > 0 ? (
              <ShieldAlert className="w-4 h-4 text-expense animate-pulse" strokeWidth={1.75} />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-income" strokeWidth={1.75} />
            )}
          </div>
          <div
            className={`text-xl sm:text-2xl font-bold tabular-nums ${
              summary.totalLateFee > 0 ? 'text-expense' : 'text-income'
            }`}
          >
            {formatIDR(summary.totalLateFee)}
          </div>
          <p className="text-[11px] text-text-secondary">
            {summary.overdueBillsCount > 0
              ? `${summary.overdueBillsCount} tagihan melewati batas tenggat!`
              : 'Tidak ada tunggakan denda aktif'}
          </p>
        </Card>

        {/* Card 4: Status Tagihan */}
        <Card padding="md" className="space-y-1">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span className="font-medium">Portofolio Kewajiban</span>
            <CreditCard className="w-4 h-4 text-text-secondary" strokeWidth={1.75} />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-text-primary tabular-nums">
            {summary.activeBillsCount} <span className="text-xs font-normal text-text-secondary">Aktif</span>
          </div>
          <p className="text-[11px] text-text-secondary">
            {summary.paidBillsCount} Lunas • {summary.overdueBillsCount} Terlambat
          </p>
        </Card>
      </div>

      {/* Overdue Warning Alert Banner if any overdue */}
      {summary.overdueBillsCount > 0 ? (
        <div className="p-4 rounded-xl bg-expense/10 border border-expense/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-expense">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-expense/20 shrink-0">
              <AlertTriangle className="w-5 h-5 text-expense" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-expense">
                Perhatian: Terdapat {summary.overdueBillsCount} Tagihan Melewati Tenggat Waktu
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Segera lakukan pembayaran cicilan atau input denda keterlambatan jika ada beban denda dari pihak kreditur.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatusFilter('overdue')}
            className="border-expense/40 text-expense hover:bg-expense/10 shrink-0 self-start sm:self-auto"
          >
            Lihat Tagihan Terlambat
          </Button>
        </div>
      ) : null}

      {/* Control Bar: Search, Status Filters & Add Button */}
      <Card padding="md" className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari sumber (Shopee, Mandiri, BCA) atau kebutuhan pinjaman..."
              className="w-full min-h-[42px] pl-10 pr-4 py-2 bg-subtle border border-border rounded-lg text-xs font-medium text-text-primary focus:outline-none focus:border-brand transition-colors"
            />
          </div>

          {/* Add Button */}
          <Button
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="w-4 h-4" strokeWidth={1.75} />}
            className="shrink-0"
          >
            Catat Tagihan Baru
          </Button>
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-border">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors touch-manipulation ${
              statusFilter === 'all'
                ? 'bg-text-primary text-surface font-semibold'
                : 'bg-subtle text-text-secondary hover:text-text-primary border border-border'
            }`}
          >
            Semua Tagihan ({bills.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors touch-manipulation ${
              statusFilter === 'active'
                ? 'bg-brand text-white font-semibold'
                : 'bg-subtle text-text-secondary hover:text-text-primary border border-border'
            }`}
          >
            Aktif Belum Lunas ({summary.activeBillsCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('overdue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors touch-manipulation flex items-center gap-1.5 ${
              statusFilter === 'overdue'
                ? 'bg-expense text-white font-semibold'
                : summary.overdueBillsCount > 0
                ? 'bg-expense/10 text-expense border border-expense/30 hover:bg-expense/20 font-semibold'
                : 'bg-subtle text-text-secondary hover:text-text-primary border border-border'
            }`}
          >
            {summary.overdueBillsCount > 0 ? (
              <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2} />
            ) : null}
            Terlambat / Overdue ({summary.overdueBillsCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors touch-manipulation ${
              statusFilter === 'paid'
                ? 'bg-income text-white font-semibold'
                : 'bg-subtle text-text-secondary hover:text-text-primary border border-border'
            }`}
          >
            Sudah Lunas ({summary.paidBillsCount})
          </button>
        </div>
      </Card>

      {/* Bills Cards Grid */}
      {filteredBills.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            title="Tidak Ada Tagihan Ditemukan"
            description={
              bills.length === 0
                ? 'Belum ada catatan tagihan atau pinjaman. Klik tombol di atas untuk mencatat kewajiban tagihan baru.'
                : 'Tidak ada tagihan yang cocok dengan filter atau kata kunci pencarian Anda.'
            }
            actionLabel={bills.length === 0 ? 'Catat Tagihan Baru' : 'Reset Filter'}
            onAction={
              bills.length === 0
                ? () => setIsCreateOpen(true)
                : () => {
                    setStatusFilter('all');
                    setSearchQuery('');
                  }
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredBills.map((bill) => {
            const metrics = calculateBillMetrics(bill, todayIso);

            return (
              <Card
                key={bill.id}
                padding="md"
                className={`space-y-4 transition-shadow hover:shadow-md border ${
                  metrics.isOverdue
                    ? 'border-expense/50 bg-expense/5'
                    : metrics.isPaid
                    ? 'border-income/40 bg-surface'
                    : 'border-border bg-surface'
                }`}
              >
                {/* Header: Source, Purpose & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 border-b border-border pb-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-subtle border border-border flex items-center justify-center shrink-0">
                        <CreditCard className="w-4 h-4 text-brand" strokeWidth={1.75} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-text-primary tracking-tight">
                          {bill.source}
                        </h3>
                        <p className="text-xs text-text-secondary flex items-center gap-1.5">
                          <span>Untuk:</span>
                          <strong className="text-text-primary font-semibold">
                            {bill.purpose}
                          </strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                    {metrics.isPaid ? (
                      <Badge tone="income">LUNAS</Badge>
                    ) : metrics.isOverdue ? (
                      <Badge tone="expense">
                        TERLAMBAT {Math.abs(metrics.daysRemaining)} HARI
                      </Badge>
                    ) : metrics.daysRemaining <= 7 ? (
                      <Badge tone="deposit">
                        TENGGAT {metrics.daysRemaining === 0 ? 'HARI INI' : `${metrics.daysRemaining} HARI`}
                      </Badge>
                    ) : (
                      <Badge tone="brand">
                        {metrics.daysRemaining} HARI LAGI
                      </Badge>
                    )}

                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-subtle border border-border text-text-secondary uppercase">
                      {bill.frequency === 'monthly'
                        ? 'Bulanan'
                        : bill.frequency === 'weekly'
                        ? 'Mingguan'
                        : bill.frequency === 'biweekly'
                        ? '2 Mingguan'
                        : bill.frequency === 'lump_sum'
                        ? 'Sekali Bayar'
                        : 'Kustom'}
                    </span>
                  </div>
                </div>

                {/* Denda Alert Badge if late fee > 0 */}
                {bill.lateFee > 0 ? (
                  <div className="px-3 py-2 rounded-lg bg-expense/10 border border-expense/30 flex items-center justify-between text-xs text-expense">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                      <span>Dikenakan Denda Keterlambatan:</span>
                    </div>
                    <span className="font-bold tabular-nums">
                      +{formatIDR(bill.lateFee)}
                    </span>
                  </div>
                ) : null}

                {/* Progress Bar of Payoff */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs tabular-nums">
                    <span className="text-text-secondary">
                      Terbayar: {formatIDR(bill.paidAmount)}
                    </span>
                    <span className="font-semibold text-text-primary">
                      {metrics.progressPercentage.toFixed(1)}% Lunas
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-subtle overflow-hidden border border-border">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        metrics.isPaid
                          ? 'bg-income'
                          : metrics.isOverdue
                          ? 'bg-expense'
                          : 'bg-brand'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(3, metrics.progressPercentage))}%`
                      }}
                    />
                  </div>
                </div>

                {/* Financial 4-Box Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-subtle/40 border border-border">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-semibold text-text-secondary block">
                      Total Plafon
                    </span>
                    <span className="text-xs font-semibold text-text-primary tabular-nums block truncate">
                      {formatIDR(bill.totalAmount)}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-semibold text-text-secondary block">
                      Cicilan / Periode
                    </span>
                    <span className="text-xs font-semibold text-text-primary tabular-nums block truncate">
                      {formatIDR(bill.installmentAmount)}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-semibold text-text-secondary block">
                      Sisa Kewajiban
                    </span>
                    <span
                      className={`text-xs font-bold tabular-nums block truncate ${
                        metrics.isPaid ? 'text-income' : 'text-expense'
                      }`}
                    >
                      {formatIDR(metrics.totalDueWithLateFee)}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-semibold text-text-secondary block">
                      Jatuh Tempo
                    </span>
                    <span className="text-xs font-mono font-medium text-text-primary tabular-nums block truncate">
                      {formatDateID(bill.dueDate)}
                    </span>
                  </div>
                </div>

                {/* Notes if available */}
                {bill.notes ? (
                  <p className="text-xs text-text-secondary italic bg-subtle/50 px-3 py-1.5 rounded-lg border border-border/60">
                    &ldquo;{bill.notes}&rdquo;
                  </p>
                ) : null}

                {/* Action Buttons Toolbar */}
                <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!metrics.isPaid ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setPayingBill(bill)}
                        leftIcon={<DollarSign className="w-3.5 h-3.5" strokeWidth={2} />}
                      >
                        Bayar Cicilan
                      </Button>
                    ) : (
                      <span className="text-xs font-semibold text-income flex items-center gap-1.5 px-2.5 py-1 rounded bg-income/10 border border-income/20">
                        <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
                        Lunas
                      </span>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLateFeeBill(bill)}
                      leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-expense" strokeWidth={1.75} />}
                    >
                      {bill.lateFee > 0 ? 'Edit Denda' : 'Input Denda'}
                    </Button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Edit Tagihan"
                      onClick={() => setEditingBill(bill)}
                      className="p-2 rounded-lg hover:bg-subtle text-text-secondary hover:text-text-primary transition-colors touch-manipulation"
                    >
                      <Edit3 className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      aria-label="Hapus Tagihan"
                      onClick={() => setDeletingBill(bill)}
                      className="p-2 rounded-lg hover:bg-expense/10 text-text-secondary hover:text-expense transition-colors touch-manipulation"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Catat Tagihan Baru */}
      <BottomSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Catat Tagihan & Pinjaman Baru"
        subtitle="Input sumber pinjaman, tujuan alokasi, nominal, cicilan, denda & tenggat"
      >
        <BillForm
          onCancel={() => setIsCreateOpen(false)}
          onSubmit={(input) => {
            onAddBill(input);
            setIsCreateOpen(false);
          }}
        />
      </BottomSheet>

      {/* Modal: Edit Tagihan */}
      <BottomSheet
        isOpen={Boolean(editingBill)}
        onClose={() => setEditingBill(null)}
        title="Ubah Detail Tagihan"
        subtitle="Perbarui data pinjaman, cicilan, atau tanggal jatuh tempo"
      >
        {editingBill ? (
          <BillForm
            initialData={editingBill}
            onCancel={() => setEditingBill(null)}
            onSubmit={(input) => {
              onUpdateBill(editingBill.id, input);
              setEditingBill(null);
            }}
          />
        ) : null}
      </BottomSheet>

      {/* Modal: Bayar Cicilan */}
      <BottomSheet
        isOpen={Boolean(payingBill)}
        onClose={() => setPayingBill(null)}
        title="Bayar Cicilan Tagihan"
        subtitle="Pencatatan pembayaran cicilan dengan opsi potong saldo di Buku Besar"
      >
        {payingBill ? (
          <BillPaymentModal
            bill={payingBill}
            accounts={accounts}
            onCancel={() => setPayingBill(null)}
            onConfirmPayment={(amount, recordInLedger, advanceDueDate) => {
              onPayInstallment(payingBill.id, amount, recordInLedger, advanceDueDate);
              setPayingBill(null);
            }}
          />
        ) : null}
      </BottomSheet>

      {/* Modal: Input / Sesuaikan Denda Keterlambatan */}
      <BottomSheet
        isOpen={Boolean(lateFeeBill)}
        onClose={() => setLateFeeBill(null)}
        title="Input Denda Keterlambatan"
        subtitle="Sesuaikan biaya denda jika Anda terlambat melakukan pembayaran"
      >
        {lateFeeBill ? (
          <BillLateFeeModal
            bill={lateFeeBill}
            onCancel={() => setLateFeeBill(null)}
            onSaveLateFee={(lateFee) => {
              onUpdateLateFee(lateFeeBill.id, lateFee);
              setLateFeeBill(null);
            }}
          />
        ) : null}
      </BottomSheet>

      {/* Confirm Dialog: Hapus Tagihan */}
      <ConfirmDialog
        isOpen={Boolean(deletingBill)}
        title="Hapus Tagihan Ini?"
        description={`Apakah Anda yakin ingin menghapus tagihan "${deletingBill?.source} - ${deletingBill?.purpose}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus Tagihan"
        danger={true}
        onClose={() => setDeletingBill(null)}
        onConfirm={() => {
          if (deletingBill) {
            onDeleteBill(deletingBill.id);
            setDeletingBill(null);
          }
        }}
      />
    </div>
  );
};
