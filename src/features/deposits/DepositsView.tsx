import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Plus,
  Edit3,
  Trash2,
  Clock,
  RefreshCw
} from 'lucide-react';
import type { TimeDeposit, TimeDepositInput } from '../../types/finance';
import { calculateDepositYield } from '../../lib/math';
import { formatDateID, formatIDR, getTodayISO } from '../../lib/formatters';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { EmptyState } from '../../components/shared/EmptyState';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { DepositForm } from './DepositForm';

interface DepositsViewProps {
  deposits: readonly TimeDeposit[];
  onAddDeposit: (input: TimeDepositInput) => void;
  onUpdateDeposit: (id: string, input: TimeDepositInput) => void;
  onDeleteDeposit: (id: string) => void;
}

export const DepositsView: React.FC<DepositsViewProps> = ({
  deposits,
  onAddDeposit,
  onUpdateDeposit,
  onDeleteDeposit
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<TimeDeposit | null>(null);
  const [deletingDeposit, setDeletingDeposit] = useState<TimeDeposit | null>(null);

  const todayIso = getTodayISO();

  const portfolioStats = useMemo(() => {
    const active = deposits.filter((d) => d.status !== 'closed');
    const totalPrincipal = active.reduce((s, d) => s + d.principal, 0);
    let totalGross = 0;
    let totalTax = 0;
    let totalNet = 0;
    for (const dep of active) {
      const y = calculateDepositYield(dep, todayIso);
      totalGross += y.grossInterest;
      totalTax += y.taxAmount;
      totalNet += y.netInterest;
    }
    const weightedAvgRate =
      totalPrincipal > 0
        ? active.reduce((s, d) => s + d.principal * d.interestRatePa, 0) / totalPrincipal
        : 0;
    return {
      activeCount: active.length,
      totalPrincipal,
      totalGross,
      totalTax,
      totalNet,
      totalMaturityValue: totalPrincipal + totalNet,
      weightedAvgRate
    };
  }, [deposits, todayIso]);

  return (
    <div className="space-y-6">
      {/* Portfolio Summary Header */}
      <Card padding="lg" className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-deposit" strokeWidth={1.75} />
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Portofolio Uang Deposit & Dana Terkunci
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-text-primary tabular-nums mt-1">
              {formatIDR(portfolioStats.totalPrincipal)}
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              {portfolioStats.activeCount} bilyet aktif • Rata-rata tertimbang bunga:{' '}
              <strong className="text-text-primary tabular-nums">
                {portfolioStats.weightedAvgRate.toFixed(2)}% p.a.
              </strong>
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="w-4 h-4" strokeWidth={1.75} />}
          >
            Tambah Deposito
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 tabular-nums">
          <div className="p-3.5 rounded-xl bg-subtle/60 border border-border">
            <span className="text-xs text-text-secondary">Estimasi Bunga Kotor</span>
            <div className="text-base font-bold text-text-primary mt-0.5">
              {formatIDR(portfolioStats.totalGross)}
            </div>
            <span className="text-[11px] text-expense">
              Pajak PPh Final: -{formatIDR(portfolioStats.totalTax)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-subtle/60 border border-border">
            <span className="text-xs text-text-secondary">Total Imbal Hasil Bersih (Net)</span>
            <div className="text-base font-bold text-income mt-0.5">
              +{formatIDR(portfolioStats.totalNet)}
            </div>
            <span className="text-[11px] text-text-secondary">
              Setelah potongan pajak deposito
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-deposit/10 border border-deposit/30">
            <span className="text-xs font-semibold text-deposit">
              Total Nilai Saat Jatuh Tempo
            </span>
            <div className="text-base font-bold text-text-primary mt-0.5">
              {formatIDR(portfolioStats.totalMaturityValue)}
            </div>
            <span className="text-[11px] text-text-secondary">
              Pokok + Bunga Bersih
            </span>
          </div>
        </div>
      </Card>

      {/* Deposits Cards Grid */}
      {deposits.length === 0 ? (
        <EmptyState
          title="Belum Ada Instrumen Deposito"
          description="Catat penempatan deposito berjangka bank digital atau konvensional untuk memantau jatuh tempo dan bunga bersih."
          actionLabel="Tambah Deposito Pertama"
          onAction={() => setIsCreateOpen(true)}
          icon={<Landmark className="w-5 h-5" strokeWidth={1.75} />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deposits.map((dep) => {
            const y = calculateDepositYield(dep, todayIso);
            const isClosed = dep.status === 'closed';
            return (
              <Card
                key={dep.id}
                padding="md"
                className={`space-y-4 ${isClosed ? 'opacity-65' : ''}`}
              >
                <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge
                        tone={
                          isClosed
                            ? 'neutral'
                            : y.isMatured
                            ? 'income'
                            : 'deposit'
                        }
                      >
                        {isClosed
                          ? 'Dicairkan'
                          : y.isMatured
                          ? 'Jatuh Tempo'
                          : `Aktif • ${y.daysUntilMaturity} hari lagi`}
                      </Badge>
                      {dep.autoRollOver ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-text-secondary">
                          <RefreshCw className="w-3 h-3" strokeWidth={1.75} /> ARO
                        </span>
                      ) : null}
                    </div>
                    <h3 className="text-base font-bold text-text-primary mt-1.5">
                      {dep.bankName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingDeposit(dep)}
                      aria-label="Edit Deposito"
                      className="p-2 min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-subtle touch-manipulation"
                    >
                      <Edit3 className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingDeposit(dep)}
                      aria-label="Hapus Deposito"
                      className="p-2 min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg text-text-secondary hover:text-expense hover:bg-expense/10 touch-manipulation"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 tabular-nums">
                  <div>
                    <div className="text-xs text-text-secondary">Pokok Penempatan</div>
                    <div className="text-lg font-bold text-text-primary">
                      {formatIDR(dep.principal)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-text-secondary">
                      Bunga ({dep.interestRatePa.toFixed(2)}% p.a. • Pajak {dep.taxRatePercent}%)
                    </div>
                    <div className="text-lg font-bold text-income">
                      +{formatIDR(y.netInterest)}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-subtle/70 border border-border space-y-1.5 text-xs tabular-nums">
                  <div className="flex justify-between">
                    <span className="text-text-secondary inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" strokeWidth={1.75} /> Tenor Penempatan:
                    </span>
                    <span className="font-medium text-text-primary">
                      {formatDateID(dep.startDate)} – {formatDateID(dep.maturityDate)} ({y.tenureDays} hr)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Total Pencairan Saat Jatuh Tempo:</span>
                    <span className="font-bold text-deposit">
                      {formatIDR(y.totalMaturityPayout)}
                    </span>
                  </div>
                </div>

                {dep.notes ? (
                  <p className="text-xs text-text-secondary">{dep.notes}</p>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Deposit Modal */}
      <BottomSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Tambah Penempatan Deposito Baru"
        subtitle="Kalkulasi otomatis bunga bersih setelah pajak deposito Indonesia (20%)"
      >
        <DepositForm
          onCancel={() => setIsCreateOpen(false)}
          onSubmit={(input) => {
            onAddDeposit(input);
            setIsCreateOpen(false);
          }}
        />
      </BottomSheet>

      {/* Edit Deposit Modal */}
      <BottomSheet
        isOpen={editingDeposit !== null}
        onClose={() => setEditingDeposit(null)}
        title="Edit Instrumen Deposito"
      >
        {editingDeposit ? (
          <DepositForm
            initialData={editingDeposit}
            onCancel={() => setEditingDeposit(null)}
            onSubmit={(input) => {
              onUpdateDeposit(editingDeposit.id, input);
              setEditingDeposit(null);
            }}
          />
        ) : null}
      </BottomSheet>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deletingDeposit !== null}
        onClose={() => setDeletingDeposit(null)}
        onConfirm={() => {
          if (deletingDeposit) onDeleteDeposit(deletingDeposit.id);
        }}
        title="Hapus Bilyet Deposito?"
        description={
          deletingDeposit
            ? `Instrumen "${deletingDeposit.bankName}" dengan pokok ${formatIDR(
                deletingDeposit.principal
              )} akan dihapus dari portofolio.`
            : ''
        }
        confirmLabel="Hapus Deposito"
      />
    </div>
  );
};
