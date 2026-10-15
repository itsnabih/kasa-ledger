import {
  KasaBackupSchema,
  type Bill,
  type KasaBackupPayload,
  type SavingsGoal,
  type TimeDeposit,
  type Transaction
} from '../types/finance';
import { getTodayISO } from './formatters';
import { calculateMutationWithRunningBalance } from './math';

export function createBackupPayload(state: {
  accounts: string[];
  transactions: Transaction[];
  goals: SavingsGoal[];
  deposits: TimeDeposit[];
  bills?: Bill[];
}): KasaBackupPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    accounts: state.accounts,
    transactions: state.transactions,
    goals: state.goals,
    deposits: state.deposits,
    bills: state.bills ?? []
  };
}

export function exportBackupJSON(state: {
  accounts: string[];
  transactions: Transaction[];
  goals: SavingsGoal[];
  deposits: TimeDeposit[];
  bills?: Bill[];
}): string {
  const payload = createBackupPayload(state);
  const serialized = JSON.stringify(payload, null, 2);
  const blob = new Blob([serialized], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const filename = `Kasa_Ledger_Backup_${getTodayISO()}.json`;

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  return filename;
}

export function parseAndValidateBackupJSON(rawJson: string): {
  success: true;
  data: KasaBackupPayload;
} | {
  success: false;
  error: string;
} {
  try {
    const parsed: unknown = JSON.parse(rawJson);
    const validation = KasaBackupSchema.safeParse(parsed);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      const pathStr = firstIssue ? firstIssue.path.join('.') : 'root';
      const msg = firstIssue ? firstIssue.message : 'Skema JSON tidak valid';
      return {
        success: false,
        error: `Validasi gagal pada [${pathStr}]: ${msg}`
      };
    }
    return {
      success: true,
      data: validation.data
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Format JSON tidak dapat dibaca';
    return {
      success: false,
      error: `File bukan JSON yang valid: ${message}`
    };
  }
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportTransactionsCSV(transactions: readonly Transaction[]): string {
  const mutation = calculateMutationWithRunningBalance(transactions);
  const headers = [
    'ID',
    'Tanggal',
    'Tipe',
    'Akun',
    'Kategori',
    'Keterangan',
    'Debit_Keluar_IDR',
    'Kredit_Masuk_IDR',
    'Saldo_Berjalan_IDR'
  ];

  const lines: string[] = [headers.join(',')];
  for (const row of mutation.rows) {
    const debit = row.type === 'expense' ? row.amount : 0;
    const credit = row.type === 'income' ? row.amount : 0;
    const cells = [
      escapeCsvCell(row.id),
      escapeCsvCell(row.date),
      escapeCsvCell(row.type === 'income' ? 'PEMASUKAN' : 'PENGELUARAN'),
      escapeCsvCell(row.account),
      escapeCsvCell(row.category),
      escapeCsvCell(row.note),
      escapeCsvCell(debit),
      escapeCsvCell(credit),
      escapeCsvCell(row.runningBalance)
    ];
    lines.push(cells.join(','));
  }

  const csvContent = '\uFEFF' + lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const filename = `Kasa_Mutasi_Transaksi_${getTodayISO()}.csv`;

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  return filename;
}
