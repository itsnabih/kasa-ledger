import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  DEFAULT_ACCOUNTS,
  type Bill,
  type BillInput,
  type KasaBackupPayload,
  type NavigationTab,
  type PeriodFilter,
  type PeriodPreset,
  type SavingsGoal,
  type SavingsGoalInput,
  type TimeDeposit,
  type TimeDepositInput,
  type Transaction,
  type TransactionInput
} from '../types/finance';
import { getTodayISO, resolvePeriodRange } from '../lib/formatters';
import { toWholeRupiah } from '../lib/math';

function createSeedData(): {
  accounts: string[];
  transactions: Transaction[];
  goals: SavingsGoal[];
  deposits: TimeDeposit[];
  bills: Bill[];
} {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prevMonthDate = new Date(yyyy, now.getMonth() - 1, 15);
  const prevYyyy = prevMonthDate.getFullYear();
  const prevMm = String(prevMonthDate.getMonth() + 1).padStart(2, '0');

  const baseTs = Date.now() - 86_400_000 * 40;

  const transactions: Transaction[] = [
    {
      id: 'tx-seed-01',
      date: `${prevYyyy}-${prevMm}-01`,
      type: 'income',
      amount: 18500000,
      account: 'Bank BCA',
      category: 'Gaji & Tunjangan',
      note: 'Gaji Bulanan & Tunjangan Transport',
      createdAt: baseTs + 1000
    },
    {
      id: 'tx-seed-02',
      date: `${prevYyyy}-${prevMm}-03`,
      type: 'expense',
      amount: 4200000,
      account: 'Bank BCA',
      category: 'Hunian & Sewa',
      note: 'Cicilan Apartemen & IPL Bulanan',
      createdAt: baseTs + 2000
    },
    {
      id: 'tx-seed-03',
      date: `${prevYyyy}-${prevMm}-08`,
      type: 'income',
      amount: 6500000,
      account: 'Bank Mandiri',
      category: 'Proyek / Freelance',
      note: 'Pelunasan UI/UX Audit Klien Fintech',
      createdAt: baseTs + 3000
    },
    {
      id: 'tx-seed-04',
      date: `${prevYyyy}-${prevMm}-14`,
      type: 'expense',
      amount: 1850000,
      account: 'GoPay / QRIS',
      category: 'Belanja Bulanan',
      note: 'Groceries Ranch Market & Kebutuhan Rumah',
      createdAt: baseTs + 4000
    },
    {
      id: 'tx-seed-05',
      date: `${prevYyyy}-${prevMm}-20`,
      type: 'income',
      amount: 8000000,
      account: 'SeaBank',
      category: 'Bonus & THR',
      note: 'Insentif Kuartal & Pemindahan Kas Likuid',
      createdAt: baseTs + 5000
    },
    {
      id: 'tx-seed-06',
      date: `${yyyy}-${mm}-01`,
      type: 'income',
      amount: 18500000,
      account: 'Bank BCA',
      category: 'Gaji & Tunjangan',
      note: 'Gaji Pokok & Tunjangan Kinerja Bulan Ini',
      createdAt: baseTs + 6000
    },
    {
      id: 'tx-seed-07',
      date: `${yyyy}-${mm}-02`,
      type: 'expense',
      amount: 3500000,
      account: 'Bank BCA',
      category: 'Alokasi Tabungan',
      note: 'Top-up Rutin Dana Darurat & Sinking Fund',
      createdAt: baseTs + 7000
    },
    {
      id: 'tx-seed-08',
      date: `${yyyy}-${mm}-04`,
      type: 'expense',
      amount: 925000,
      account: 'Bank Mandiri',
      category: 'Tagihan & Utilitas',
      note: 'Tagihan Listrik PLN, Biznet Fiber & Air PAM',
      createdAt: baseTs + 8000
    },
    {
      id: 'tx-seed-09',
      date: `${yyyy}-${mm}-06`,
      type: 'expense',
      amount: 640000,
      account: 'GoPay / QRIS',
      category: 'Makanan & Minuman',
      note: 'Kopi, Makan Siang Kantor & Katering Sehat',
      createdAt: baseTs + 9000
    },
    {
      id: 'tx-seed-10',
      date: `${yyyy}-${mm}-08`,
      type: 'income',
      amount: 4200000,
      account: 'GoPay / QRIS',
      category: 'Proyek / Freelance',
      note: 'Honorarium Workshop Frontend Architecture',
      createdAt: baseTs + 10000
    },
    {
      id: 'tx-seed-11',
      date: `${yyyy}-${mm}-10`,
      type: 'expense',
      amount: 480000,
      account: 'Tunai (Kas)',
      category: 'Transportasi & BBM',
      note: 'Pengisian BBM Pertamax & Parkir Bandara',
      createdAt: baseTs + 11000
    },
    {
      id: 'tx-seed-12',
      date: `${yyyy}-${mm}-11`,
      type: 'income',
      amount: 2500000,
      account: 'Tunai (Kas)',
      category: 'Lainnya (Masuk)',
      note: 'Penarikan Kas Operasional Dompet Tunai',
      createdAt: baseTs + 12000
    },
    {
      id: 'tx-seed-13',
      date: `${yyyy}-${mm}-12`,
      type: 'income',
      amount: 315000,
      account: 'SeaBank',
      category: 'Bunga & Dividen',
      note: 'Bunga Tabungan Harian SeaBank (Net setelah Pajak)',
      createdAt: baseTs + 13000
    }
  ];

  const goals: SavingsGoal[] = [
    {
      id: 'goal-seed-01',
      name: 'Dana Darurat Keluarga (6x Biaya Hidup)',
      targetAmount: 60000000,
      currentAmount: 42500000,
      deadline: `${yyyy + 1}-06-30`,
      category: 'Dana Darurat',
      notes: 'Disimpan terpisah pada rekening likuid bunga harian',
      createdAt: baseTs
    },
    {
      id: 'goal-seed-02',
      name: 'Dana Pendidikan & Sertifikasi Cloud',
      targetAmount: 18000000,
      currentAmount: 13500000,
      deadline: `${yyyy + 1}-02-28`,
      category: 'Pendidikan',
      notes: 'Ujian sertifikasi arsitek sistem & pembaruan perangkat kerja',
      createdAt: baseTs + 500
    },
    {
      id: 'goal-seed-03',
      name: 'Liburan Akhir Tahun Jepang (Sinking Fund)',
      targetAmount: 35000000,
      currentAmount: 21000000,
      deadline: `${yyyy}-12-20`,
      category: 'Perjalanan',
      notes: 'Tiket pesawat PP, JR Pass, dan akomodasi 9 malam',
      createdAt: baseTs + 900
    }
  ];

  const deposits: TimeDeposit[] = [
    {
      id: 'dep-seed-01',
      bankName: 'SeaBank Deposito Berjangka 3 Bulan',
      principal: 50000000,
      interestRatePa: 6.0,
      taxRatePercent: 20,
      startDate: `${prevYyyy}-${prevMm}-10`,
      maturityDate: `${yyyy + 1}-01-10`,
      autoRollOver: true,
      status: 'active',
      notes: 'ARO Pokok + Bunga • Dijamin sesuai ketentuan pajak deposito 20%',
      createdAt: baseTs
    },
    {
      id: 'dep-seed-02',
      bankName: 'Bank Mandiri Deposito Rupiah 6 Bulan',
      principal: 75000000,
      interestRatePa: 4.25,
      taxRatePercent: 20,
      startDate: `${yyyy}-07-01`,
      maturityDate: `${yyyy}-12-30`,
      autoRollOver: false,
      status: 'active',
      notes: 'Cadangan likuiditas tahun depan via Livin by Mandiri',
      createdAt: baseTs + 300
    },
    {
      id: 'dep-seed-03',
      bankName: 'BCA Tahapan Berjangka / Deposito Digital',
      principal: 30000000,
      interestRatePa: 3.75,
      taxRatePercent: 20,
      startDate: `${yyyy}-08-15`,
      maturityDate: `${yyyy}-11-15`,
      autoRollOver: true,
      status: 'active',
      notes: 'Penempatan dana kas cadangan via myBCA',
      createdAt: baseTs + 600
    }
  ];

  const bills: Bill[] = [
    {
      id: 'bill-seed-01',
      source: 'Shopee PayLater (SPayLater)',
      purpose: 'Beli Laptop Kerja Lenovo ThinkPad',
      totalAmount: 12000000,
      installmentAmount: 2000000,
      lateFee: 0,
      paidAmount: 6000000,
      dueDate: `${yyyy}-${mm}-25`,
      frequency: 'monthly',
      status: 'active',
      notes: 'Cicilan 6x • Sisa 3x pembayaran',
      createdAt: baseTs
    },
    {
      id: 'bill-seed-02',
      source: 'Bank Mandiri (KTA / Pinjaman Usaha)',
      purpose: 'Modal Renovasi Workshop & Studio',
      totalAmount: 25000000,
      installmentAmount: 2500000,
      lateFee: 0,
      paidAmount: 15000000,
      dueDate: `${yyyy}-${mm}-18`,
      frequency: 'monthly',
      status: 'active',
      notes: 'Autodebet rekening Bank Mandiri setiap tgl 18',
      createdAt: baseTs + 500
    }
  ];

  return {
    accounts: [...DEFAULT_ACCOUNTS],
    transactions,
    goals,
    deposits,
    bills
  };
}

function addOneMonthToIsoDate(isoDate: string): string {
  const [yStr, mStr, dStr] = isoDate.split('-');
  const y = Number.parseInt(yStr, 10);
  const m = Number.parseInt(mStr, 10);
  const d = Number.parseInt(dStr, 10);

  let nextYear = y;
  let nextMonth = m + 1;
  if (nextMonth > 12) {
    nextYear += 1;
    nextMonth = 1;
  }
  const daysInNextMonth = new Date(nextYear, nextMonth, 0).getDate();
  const nextDay = Math.min(d, daysInNextMonth);
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`;
}

interface FinanceStoreState {
  accounts: string[];
  transactions: Transaction[];
  goals: SavingsGoal[];
  deposits: TimeDeposit[];
  bills: Bill[];
  activeTab: NavigationTab;
  periodFilter: PeriodFilter;
  selectedAccountFilter: string;

  // Navigation & Filter actions
  setActiveTab: (tab: NavigationTab) => void;
  setPeriodPreset: (preset: PeriodPreset, customStart?: string, customEnd?: string) => void;
  setSelectedAccountFilter: (account: string) => void;

  // Account management
  addAccount: (name: string) => void;

  // Transaction CRUD
  addTransaction: (input: TransactionInput) => void;
  updateTransaction: (id: string, input: TransactionInput) => void;
  deleteTransaction: (id: string) => void;

  // Savings Goal CRUD
  addGoal: (input: SavingsGoalInput) => void;
  updateGoal: (id: string, input: SavingsGoalInput) => void;
  allocateGoalFunds: (
    id: string,
    deltaAmount: number,
    recordInLedger?: { account: string; note?: string }
  ) => void;
  deleteGoal: (id: string) => void;

  // Time Deposit CRUD
  addDeposit: (input: TimeDepositInput) => void;
  updateDeposit: (id: string, input: TimeDepositInput) => void;
  updateDepositStatus: (id: string, status: TimeDeposit['status']) => void;
  deleteDeposit: (id: string) => void;

  // Bills & Liabilities CRUD
  addBill: (input: BillInput) => void;
  updateBill: (id: string, input: BillInput) => void;
  payBillInstallment: (
    id: string,
    amount: number,
    recordInLedger?: { account: string; note?: string },
    advanceDueDate?: boolean
  ) => void;
  updateBillLateFee: (id: string, lateFee: number) => void;
  deleteBill: (id: string) => void;

  // Backup & Reset
  importBackupPayload: (payload: KasaBackupPayload) => void;
  resetToDemoSeed: () => void;
  clearAllData: () => void;
}

function generateId(prefix: string): string {
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${randomPart}`;
}

const initialSeed = createSeedData();

export const useFinanceStore = create<FinanceStoreState>()(
  persist(
    (set) => ({
      accounts: initialSeed.accounts,
      transactions: initialSeed.transactions,
      goals: initialSeed.goals,
      deposits: initialSeed.deposits,
      bills: initialSeed.bills,
      activeTab: 'overview',
      periodFilter: resolvePeriodRange('this_month'),
      selectedAccountFilter: 'ALL',

      setActiveTab: (tab) => set({ activeTab: tab }),

      setPeriodPreset: (preset, customStart, customEnd) =>
        set({
          periodFilter: resolvePeriodRange(preset, new Date(), customStart, customEnd)
        }),

      setSelectedAccountFilter: (account) => set({ selectedAccountFilter: account }),

      addAccount: (name) =>
        set((state) => {
          const trimmed = name.trim();
          if (!trimmed || state.accounts.includes(trimmed)) return state;
          return { accounts: [...state.accounts, trimmed] };
        }),

      addTransaction: (input) =>
        set((state) => {
          const newTx: Transaction = {
            ...input,
            id: generateId('tx'),
            amount: toWholeRupiah(input.amount),
            note: input.note.trim(),
            createdAt: Date.now()
          };
          const accounts = state.accounts.includes(newTx.account)
            ? state.accounts
            : [...state.accounts, newTx.account];
          return {
            accounts,
            transactions: [newTx, ...state.transactions]
          };
        }),

      updateTransaction: (id, input) =>
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id
              ? {
                  ...tx,
                  ...input,
                  amount: toWholeRupiah(input.amount),
                  note: input.note.trim()
                }
              : tx
          )
        })),

      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id)
        })),

      addGoal: (input) =>
        set((state) => {
          const newGoal: SavingsGoal = {
            ...input,
            id: generateId('goal'),
            name: input.name.trim(),
            targetAmount: toWholeRupiah(input.targetAmount),
            currentAmount: toWholeRupiah(input.currentAmount),
            createdAt: Date.now()
          };
          return { goals: [...state.goals, newGoal] };
        }),

      updateGoal: (id, input) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id
              ? {
                  ...g,
                  ...input,
                  name: input.name.trim(),
                  targetAmount: toWholeRupiah(input.targetAmount),
                  currentAmount: toWholeRupiah(input.currentAmount)
                }
              : g
          )
        })),

      allocateGoalFunds: (id, deltaAmount, recordInLedger) =>
        set((state) => {
          const wholeDelta = toWholeRupiah(deltaAmount);
          if (wholeDelta === 0) return state;

          const targetGoal = state.goals.find((g) => g.id === id);
          if (!targetGoal) return state;

          const updatedGoals = state.goals.map((g) =>
            g.id === id
              ? {
                  ...g,
                  currentAmount: Math.max(0, toWholeRupiah(g.currentAmount + wholeDelta))
                }
              : g
          );

          if (!recordInLedger) {
            return { goals: updatedGoals };
          }

          const isTopUp = wholeDelta > 0;
          const ledgerTx: Transaction = {
            id: generateId('tx'),
            date: getTodayISO(),
            type: isTopUp ? 'expense' : 'income',
            amount: Math.abs(wholeDelta),
            account: recordInLedger.account,
            category: isTopUp ? 'Alokasi Tabungan' : 'Lainnya (Masuk)',
            note:
              recordInLedger.note?.trim() ||
              (isTopUp
                ? `Alokasi Top-Up Sinking Fund: ${targetGoal.name}`
                : `Penarikan Dana Sinking Fund: ${targetGoal.name}`),
            createdAt: Date.now()
          };

          return {
            goals: updatedGoals,
            transactions: [ledgerTx, ...state.transactions]
          };
        }),

      deleteGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id)
        })),

      addDeposit: (input) =>
        set((state) => {
          const newDep: TimeDeposit = {
            ...input,
            id: generateId('dep'),
            bankName: input.bankName.trim(),
            principal: toWholeRupiah(input.principal),
            createdAt: Date.now()
          };
          return { deposits: [...state.deposits, newDep] };
        }),

      updateDeposit: (id, input) =>
        set((state) => ({
          deposits: state.deposits.map((d) =>
            d.id === id
              ? {
                  ...d,
                  ...input,
                  bankName: input.bankName.trim(),
                  principal: toWholeRupiah(input.principal)
                }
              : d
          )
        })),

      updateDepositStatus: (id, status) =>
        set((state) => ({
          deposits: state.deposits.map((d) => (d.id === id ? { ...d, status } : d))
        })),

      deleteDeposit: (id) =>
        set((state) => ({
          deposits: state.deposits.filter((d) => d.id !== id)
        })),

      // Bills & Liabilities CRUD
      addBill: (input) =>
        set((state) => {
          const newBill: Bill = {
            ...input,
            id: generateId('bill'),
            source: input.source.trim(),
            purpose: input.purpose.trim(),
            totalAmount: toWholeRupiah(input.totalAmount),
            installmentAmount: toWholeRupiah(input.installmentAmount),
            lateFee: toWholeRupiah(input.lateFee || 0),
            paidAmount: toWholeRupiah(input.paidAmount || 0),
            status: input.status ?? 'active',
            notes: input.notes?.trim(),
            createdAt: Date.now()
          };
          return { bills: [newBill, ...state.bills] };
        }),

      updateBill: (id, input) =>
        set((state) => ({
          bills: state.bills.map((b) =>
            b.id === id
              ? {
                  ...b,
                  ...input,
                  source: input.source.trim(),
                  purpose: input.purpose.trim(),
                  totalAmount: toWholeRupiah(input.totalAmount),
                  installmentAmount: toWholeRupiah(input.installmentAmount),
                  lateFee: toWholeRupiah(input.lateFee || 0),
                  paidAmount: toWholeRupiah(input.paidAmount || 0),
                  notes: input.notes?.trim()
                }
              : b
          )
        })),

      payBillInstallment: (id, amount, recordInLedger, advanceDueDate = true) =>
        set((state) => {
          const wholeAmount = toWholeRupiah(amount);
          if (wholeAmount <= 0) return state;

          const targetBill = state.bills.find((b) => b.id === id);
          if (!targetBill) return state;

          const updatedPaidAmount = toWholeRupiah(targetBill.paidAmount + wholeAmount);
          const totalRequired = toWholeRupiah(targetBill.totalAmount + (targetBill.lateFee || 0));
          const isFullySettled = updatedPaidAmount >= totalRequired;

          const nextDueDate =
            advanceDueDate && !isFullySettled
              ? addOneMonthToIsoDate(targetBill.dueDate)
              : targetBill.dueDate;

          const updatedBills = state.bills.map((b) =>
            b.id === id
              ? {
                  ...b,
                  paidAmount: updatedPaidAmount,
                  dueDate: nextDueDate,
                  status: (isFullySettled ? 'paid' : 'active') as Bill['status']
                }
              : b
          );

          if (!recordInLedger) {
            return { bills: updatedBills };
          }

          const ledgerTx: Transaction = {
            id: generateId('tx'),
            date: getTodayISO(),
            type: 'expense',
            amount: wholeAmount,
            account: recordInLedger.account,
            category: 'Tagihan & Utilitas',
            note:
              recordInLedger.note?.trim() ||
              `Bayar Tagihan ${targetBill.source}: ${targetBill.purpose}`,
            createdAt: Date.now()
          };

          return {
            bills: updatedBills,
            transactions: [ledgerTx, ...state.transactions]
          };
        }),

      updateBillLateFee: (id, lateFee) =>
        set((state) => ({
          bills: state.bills.map((b) =>
            b.id === id
              ? {
                  ...b,
                  lateFee: Math.max(0, toWholeRupiah(lateFee))
                }
              : b
          )
        })),

      deleteBill: (id) =>
        set((state) => ({
          bills: state.bills.filter((b) => b.id !== id)
        })),

      importBackupPayload: (payload) =>
        set({
          accounts:
            payload.accounts.length > 0 ? payload.accounts : [...DEFAULT_ACCOUNTS],
          transactions: payload.transactions,
          goals: payload.goals,
          deposits: payload.deposits,
          bills: payload.bills ?? []
        }),

      resetToDemoSeed: () => {
        const freshSeed = createSeedData();
        set({
          accounts: freshSeed.accounts,
          transactions: freshSeed.transactions,
          goals: freshSeed.goals,
          deposits: freshSeed.deposits,
          bills: freshSeed.bills
        });
      },

      clearAllData: () =>
        set({
          accounts: [...DEFAULT_ACCOUNTS],
          transactions: [],
          goals: [],
          deposits: [],
          bills: []
        })
    }),
    {
      name: 'kasa_ledger_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accounts: state.accounts,
        transactions: state.transactions,
        goals: state.goals,
        deposits: state.deposits,
        bills: state.bills
      })
    }
  )
);
