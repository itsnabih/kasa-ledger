import { z } from 'zod';

export type TransactionType = 'income' | 'expense';

export type NavigationTab = 'overview' | 'ledger' | 'goals' | 'deposits' | 'bills' | 'reports';

export type PeriodPreset = 'this_month' | 'last_month' | 'this_year' | 'all_time' | 'custom';

export interface PeriodFilter {
  preset: PeriodPreset;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export const DEFAULT_ACCOUNTS = [
  'Bank BCA',
  'Bank Mandiri',
  'SeaBank',
  'GoPay / QRIS',
  'Tunai (Kas)'
] as const;

export const INCOME_CATEGORIES = [
  'Gaji & Tunjangan',
  'Bonus & THR',
  'Proyek / Freelance',
  'Bunga & Dividen',
  'Pencairan Deposito',
  'Lainnya (Masuk)'
] as const;

export const EXPENSE_CATEGORIES = [
  'Makanan & Minuman',
  'Belanja Bulanan',
  'Transportasi & BBM',
  'Tagihan & Utilitas',
  'Hunian & Sewa',
  'Kesehatan & Asuransi',
  'Pendidikan & Kursus',
  'Alokasi Tabungan',
  'Hiburan & Gaya Hidup',
  'Keluarga & Sosial',
  'Lainnya (Keluar)'
] as const;

export const TransactionSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  type: z.enum(['income', 'expense']),
  amount: z.number().int().positive('Nominal harus bilangan bulat positif'),
  account: z.string().min(1, 'Akun wajib diisi'),
  category: z.string().min(1, 'Kategori wajib diisi'),
  note: z.string().max(240),
  createdAt: z.number().int()
});

export type Transaction = z.infer<typeof TransactionSchema>;

export type TransactionInput = Omit<Transaction, 'id' | 'createdAt'>;

export const SavingsGoalSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Nama target wajib diisi').max(100),
  targetAmount: z.number().int().positive('Target nominal harus lebih dari 0'),
  currentAmount: z.number().int().nonnegative('Nominal terkumpul tidak boleh negatif'),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  category: z.string().min(1),
  notes: z.string().max(240).optional(),
  createdAt: z.number().int()
});

export type SavingsGoal = z.infer<typeof SavingsGoalSchema>;

export type SavingsGoalInput = Omit<SavingsGoal, 'id' | 'createdAt'>;

export type DepositStatus = 'active' | 'matured' | 'closed';

export const TimeDepositSchema = z.object({
  id: z.string().min(1),
  bankName: z.string().min(1, 'Nama bank/instrumen wajib diisi').max(100),
  principal: z.number().int().positive('Pokok deposito harus lebih dari 0'),
  interestRatePa: z.number().nonnegative().max(100),
  taxRatePercent: z.number().nonnegative().max(100),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal mulai harus YYYY-MM-DD'),
  maturityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format jatuh tempo harus YYYY-MM-DD'),
  autoRollOver: z.boolean(),
  status: z.enum(['active', 'matured', 'closed']),
  notes: z.string().max(240).optional(),
  createdAt: z.number().int()
});

export type TimeDeposit = z.infer<typeof TimeDepositSchema>;

export type TimeDepositInput = Omit<TimeDeposit, 'id' | 'createdAt'>;

export type BillFrequency = 'monthly' | 'weekly' | 'biweekly' | 'custom' | 'lump_sum';

export const BillSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1, 'Asal/sumber tagihan wajib diisi').max(100),
  purpose: z.string().min(1, 'Tujuan/kebutuhan pinjaman wajib diisi').max(150),
  totalAmount: z.number().int().positive('Total tagihan harus lebih dari 0'),
  installmentAmount: z.number().int().positive('Pembayaran per periode harus lebih dari 0'),
  lateFee: z.number().int().nonnegative('Denda keterlambatan tidak boleh negatif').default(0),
  paidAmount: z.number().int().nonnegative().default(0),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  frequency: z.enum(['monthly', 'weekly', 'biweekly', 'custom', 'lump_sum']).default('monthly'),
  status: z.enum(['active', 'paid']).default('active'),
  notes: z.string().max(240).optional(),
  createdAt: z.number().int()
});

export type Bill = z.infer<typeof BillSchema>;

export type BillInput = Omit<Bill, 'id' | 'createdAt'>;

export const KasaBackupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  accounts: z.array(z.string().min(1)),
  transactions: z.array(TransactionSchema),
  goals: z.array(SavingsGoalSchema),
  deposits: z.array(TimeDepositSchema),
  bills: z.array(BillSchema).optional().default([])
});

export type KasaBackupPayload = z.infer<typeof KasaBackupSchema>;

export interface AccountBalanceSummary {
  account: string;
  totalInflow: number;
  totalOutflow: number;
  endingBalance: number;
  sharePercentage: number;
  transactionCount: number;
}

export interface MutationRow extends Transaction {
  runningBalance: number;
}

export interface MutationResult {
  openingBalance: number;
  totalCredit: number;
  totalDebit: number;
  netCashflow: number;
  endingBalance: number;
  rows: MutationRow[];
}

export interface GoalMetrics {
  completionPercentage: number;
  shortfall: number;
  daysRemaining: number;
  monthsRemaining: number;
  recommendedMonthlySaving: number;
  isCompleted: boolean;
  isOverdue: boolean;
}

export interface DepositYieldMetrics {
  tenureDays: number;
  grossInterest: number;
  taxAmount: number;
  netInterest: number;
  totalMaturityPayout: number;
  daysUntilMaturity: number;
  isMatured: boolean;
}

export interface BillMetrics {
  remainingPrincipal: number;
  totalDueWithLateFee: number;
  daysRemaining: number;
  isOverdue: boolean;
  isPaid: boolean;
  progressPercentage: number;
  estimatedPeriodsRemaining: number;
}

export interface BillsSummary {
  totalLiabilities: number;
  totalPrincipal: number;
  totalPaid: number;
  totalLateFee: number;
  activeBillsCount: number;
  overdueBillsCount: number;
  paidBillsCount: number;
  upcomingThisMonthAmount: number;
}

export interface NetWorthBreakdown {
  liquidCashBalance: number;
  totalSavedInGoals: number;
  totalActiveDepositsPrincipal: number;
  totalEstimatedNetInterest: number;
  totalAssets: number;
  totalLiabilities: number;
  totalNetWorth: number;
  liquidSharePercent: number;
  goalsSharePercent: number;
  depositsSharePercent: number;
  liabilitiesToAssetRatio: number;
}
