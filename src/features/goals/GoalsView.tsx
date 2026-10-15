import React, { useState, useMemo } from 'react';
import {
  Target,
  Plus,
  Calendar,
  Edit3,
  Trash2,
  ArrowUpDown,
  CheckCircle2
} from 'lucide-react';
import type { SavingsGoal, SavingsGoalInput } from '../../types/finance';
import { calculateGoalMetrics } from '../../lib/math';
import { formatDateID, formatIDR, getTodayISO } from '../../lib/formatters';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { EmptyState } from '../../components/shared/EmptyState';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { GoalForm } from './GoalForm';
import { GoalAllocationModal } from './GoalAllocationModal';

interface GoalsViewProps {
  goals: readonly SavingsGoal[];
  accounts: readonly string[];
  onAddGoal: (input: SavingsGoalInput) => void;
  onUpdateGoal: (id: string, input: SavingsGoalInput) => void;
  onAllocateGoal: (
    id: string,
    deltaAmount: number,
    recordInLedger?: { account: string; note?: string }
  ) => void;
  onDeleteGoal: (id: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  accounts,
  onAddGoal,
  onUpdateGoal,
  onAllocateGoal,
  onDeleteGoal
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [allocatingGoal, setAllocatingGoal] = useState<SavingsGoal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<SavingsGoal | null>(null);

  const todayIso = getTodayISO();

  const summary = useMemo(() => {
    const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
    const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
    const totalShortfall = goals.reduce(
      (s, g) => s + Math.max(0, g.targetAmount - g.currentAmount),
      0
    );
    const overallPct =
      totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 1000) / 10) : 0;
    return { totalTarget, totalSaved, totalShortfall, overallPct };
  }, [goals]);

  return (
    <div className="space-y-6">
      {/* Top Sinking Funds Overview Card */}
      <Card padding="lg" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-brand" strokeWidth={1.75} />
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Total Dana Tabungan Terencana (Sinking Funds)
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-text-primary tabular-nums mt-1">
              {formatIDR(summary.totalSaved)}
              <span className="text-sm font-normal text-text-secondary ml-2">
                dari target {formatIDR(summary.totalTarget)}
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="w-4 h-4" strokeWidth={1.75} />}
          >
            Buat Target Baru
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs tabular-nums">
            <span className="text-text-secondary font-medium">
              Progres Kumulatif ({goals.length} Target)
            </span>
            <span className="font-bold text-brand">{summary.overallPct.toFixed(1)}%</span>
          </div>
          <div className="w-full h-2.5 bg-subtle rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-brand rounded-full transition-all duration-300"
              style={{ width: `${summary.overallPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-text-secondary tabular-nums pt-1">
            <span>Total Kekurangan: {formatIDR(summary.totalShortfall)}</span>
            <span>Alokasi Terkunci pada Tujuan Spesifik</span>
          </div>
        </div>
      </Card>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <EmptyState
          title="Belum Ada Target Tabungan (Sinking Fund)"
          description="Pisahkan dana darurat, biaya pendidikan, pajak tahunan, atau rencana liburan agar tidak tercampur dengan kas harian."
          actionLabel="Buat Target Pertama"
          onAction={() => setIsCreateOpen(true)}
          icon={<Target className="w-5 h-5" strokeWidth={1.75} />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const metrics = calculateGoalMetrics(goal, todayIso);
            return (
              <Card key={goal.id} padding="md" className="flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge tone={metrics.isCompleted ? 'income' : 'brand'}>
                        {goal.category}
                      </Badge>
                      <h3 className="text-base font-bold text-text-primary mt-1.5">
                        {goal.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingGoal(goal)}
                        aria-label="Edit Target"
                        className="p-2 min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-subtle touch-manipulation"
                      >
                        <Edit3 className="w-4 h-4" strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingGoal(goal)}
                        aria-label="Hapus Target"
                        className="p-2 min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg text-text-secondary hover:text-expense hover:bg-expense/10 touch-manipulation"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>

                  {/* Progress Numbers */}
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between tabular-nums">
                      <span className="text-lg font-bold text-text-primary">
                        {formatIDR(goal.currentAmount)}
                      </span>
                      <span className="text-xs font-semibold text-brand">
                        {metrics.completionPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-subtle rounded-full overflow-hidden border border-border">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          metrics.isCompleted ? 'bg-income' : 'bg-brand'
                        }`}
                        style={{ width: `${metrics.completionPercentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-text-secondary tabular-nums">
                      <span>Target: {formatIDR(goal.targetAmount)}</span>
                      <span>Kurang: {formatIDR(metrics.shortfall)}</span>
                    </div>
                  </div>

                  {/* Deadline & Monthly Recommendation Box */}
                  <div className="p-3 rounded-lg bg-subtle/70 border border-border space-y-1.5 text-xs tabular-nums">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" strokeWidth={1.75} />
                        Target Tanggal:
                      </span>
                      <span className="font-semibold text-text-primary">
                        {formatDateID(goal.deadline)} ({metrics.daysRemaining} hr)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Rekomendasi / Bulan:</span>
                      <span className="font-bold text-brand">
                        {metrics.isCompleted
                          ? 'Target Tercapai'
                          : `${formatIDR(metrics.recommendedMonthlySaving)} / bln`}
                      </span>
                    </div>
                  </div>

                  {goal.notes ? (
                    <p className="text-xs text-text-secondary line-clamp-2">{goal.notes}</p>
                  ) : null}
                </div>

                <div className="pt-2 border-t border-border">
                  <Button
                    variant={metrics.isCompleted ? 'secondary' : 'outline'}
                    size="sm"
                    fullWidth
                    onClick={() => setAllocatingGoal(goal)}
                    leftIcon={
                      metrics.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-income" strokeWidth={1.75} />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-brand" strokeWidth={1.75} />
                      )
                    }
                  >
                    Top-Up / Tarik Dana
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Goal Modal */}
      <BottomSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Buat Rencana Tabungan Baru"
        subtitle="Hitung otomatis kebutuhan setoran bulanan menuju target"
      >
        <GoalForm
          onCancel={() => setIsCreateOpen(false)}
          onSubmit={(input) => {
            onAddGoal(input);
            setIsCreateOpen(false);
          }}
        />
      </BottomSheet>

      {/* Edit Goal Modal */}
      <BottomSheet
        isOpen={editingGoal !== null}
        onClose={() => setEditingGoal(null)}
        title="Edit Rencana Tabungan"
      >
        {editingGoal ? (
          <GoalForm
            initialData={editingGoal}
            onCancel={() => setEditingGoal(null)}
            onSubmit={(input) => {
              onUpdateGoal(editingGoal.id, input);
              setEditingGoal(null);
            }}
          />
        ) : null}
      </BottomSheet>

      {/* Quick Top-Up / Withdraw Modal */}
      <GoalAllocationModal
        goal={allocatingGoal}
        accounts={accounts}
        onClose={() => setAllocatingGoal(null)}
        onAllocate={onAllocateGoal}
      />

      {/* Delete Goal Confirmation */}
      <ConfirmDialog
        isOpen={deletingGoal !== null}
        onClose={() => setDeletingGoal(null)}
        onConfirm={() => {
          if (deletingGoal) onDeleteGoal(deletingGoal.id);
        }}
        title="Hapus Rencana Tabungan?"
        description={
          deletingGoal
            ? `Target "${deletingGoal.name}" beserta progres pencatatannya (${formatIDR(
                deletingGoal.currentAmount
              )}) akan dihapus.`
            : ''
        }
        confirmLabel="Hapus Target"
      />
    </div>
  );
};
