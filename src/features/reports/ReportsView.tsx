import React, { useRef, useState } from 'react';
import {
  FileText,
  Download,
  Upload,
  FileSpreadsheet,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type {
  Bill,
  KasaBackupPayload,
  PeriodFilter,
  SavingsGoal,
  TimeDeposit,
  Transaction
} from '../../types/finance';
import { formatIDR, getPeriodLabel } from '../../lib/formatters';
import {
  generateAccountStatementPDF,
  generateAssetPortfolioPDF
} from '../../lib/pdfGenerator';
import {
  exportBackupJSON,
  exportTransactionsCSV,
  parseAndValidateBackupJSON
} from '../../lib/backup';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';

interface ReportsViewProps {
  accounts: string[];
  transactions: Transaction[];
  goals: SavingsGoal[];
  deposits: TimeDeposit[];
  bills?: Bill[];
  periodFilter: PeriodFilter;
  onImportBackup: (payload: KasaBackupPayload) => void;
  onResetDemo: () => void;
  onClearAll: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  accounts,
  transactions,
  goals,
  deposits,
  bills = [],
  periodFilter,
  onImportBackup,
  onResetDemo,
  onClearAll
}) => {
  const [pdfAccountFilter, setPdfAccountFilter] = useState<string>('ALL');
  const [isGeneratingMutasi, setIsGeneratingMutasi] = useState(false);
  const [isGeneratingAsset, setIsGeneratingAsset] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDownloadMutasiPDF = async () => {
    setIsGeneratingMutasi(true);
    setStatusBanner(null);
    try {
      const filename = await generateAccountStatementPDF({
        transactions,
        periodFilter,
        accountFilter: pdfAccountFilter
      });
      setStatusBanner({
        type: 'success',
        message: `Laporan Mutasi Rekening berhasil diunduh (${filename})`
      });
    } catch (err) {
      setStatusBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal membuat PDF Mutasi'
      });
    } finally {
      setIsGeneratingMutasi(false);
    }
  };

  const handleDownloadAssetPDF = async () => {
    setIsGeneratingAsset(true);
    setStatusBanner(null);
    try {
      const filename = await generateAssetPortfolioPDF({
        accounts,
        transactions,
        goals,
        deposits
      });
      setStatusBanner({
        type: 'success',
        message: `Laporan Detail Aset & Kekayaan berhasil diunduh (${filename})`
      });
    } catch (err) {
      setStatusBanner({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal membuat PDF Aset'
      });
    } finally {
      setIsGeneratingAsset(false);
    }
  };

  const handleExportJSON = () => {
    const filename = exportBackupJSON({ accounts, transactions, goals, deposits, bills });
    setStatusBanner({
      type: 'success',
      message: `Cadangan JSON tervalidasi berhasil diunduh (${filename})`
    });
  };

  const handleExportCSV = () => {
    const filename = exportTransactionsCSV(transactions);
    setStatusBanner({
      type: 'success',
      message: `Data mutasi CSV berhasil diunduh (${filename})`
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      const result = parseAndValidateBackupJSON(content);
      if (!result.success) {
        setStatusBanner({
          type: 'error',
          message: result.error
        });
      } else {
        onImportBackup(result.data);
        setStatusBanner({
          type: 'success',
          message: `Berhasil memulihkan ${result.data.transactions.length} transaksi, ${result.data.goals.length} target tabungan, dan ${result.data.deposits.length} deposito.`
        });
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {statusBanner ? (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
            statusBanner.type === 'success'
              ? 'bg-income/10 border-income/30 text-income'
              : 'bg-expense/10 border-expense/30 text-expense'
          }`}
        >
          {statusBanner.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" strokeWidth={1.75} />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" strokeWidth={1.75} />
          )}
          <span className="font-medium">{statusBanner.message}</span>
        </div>
      ) : null}

      {/* Bank-Grade Vector PDF Reports Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF 1: Laporan Mutasi Rekening */}
        <Card padding="lg" className="flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge tone="brand">PDF Vektor A4 • Standar Perbankan</Badge>
              <FileText className="w-5 h-5 text-brand" strokeWidth={1.75} />
            </div>
            <h2 className="text-lg font-bold text-text-primary">
              1. Laporan Mutasi Rekening (Account Statement)
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              Mencetak dokumen resmi mutasi transaksi lengkap dengan Saldo Awal Periode,
              Total Kredit (+), Total Debit (-), Arus Kas Bersih, dan Saldo Berjalan
              kronologis pada setiap baris.
            </p>

            <div className="p-3.5 rounded-xl bg-subtle border border-border space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Periode Terpilih:</span>
                <span className="font-semibold text-text-primary">
                  {getPeriodLabel(periodFilter)}
                </span>
              </div>

              <div>
                <label
                  htmlFor="pdf-account-select"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1"
                >
                  Filter Rekening untuk Dicetak
                </label>
                <select
                  id="pdf-account-select"
                  value={pdfAccountFilter}
                  onChange={(e) => setPdfAccountFilter(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 bg-surface border border-border rounded-lg text-xs font-medium text-text-primary"
                >
                  <option value="ALL">Semua Rekening & Dompet</option>
                  {accounts.map((acc) => (
                    <option key={acc} value={acc}>
                      {acc}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            fullWidth
            onClick={handleDownloadMutasiPDF}
            disabled={isGeneratingMutasi}
            leftIcon={<Download className="w-4 h-4" strokeWidth={1.75} />}
          >
            {isGeneratingMutasi
              ? 'Menyusun PDF Mutasi Rekening...'
              : 'Unduh PDF Mutasi Rekening'}
          </Button>
        </Card>

        {/* PDF 2: Laporan Detail Posisi Aset & Kekayaan */}
        <Card padding="lg" className="flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge tone="deposit">PDF Vektor A4 • Portofolio Penuh</Badge>
              <FileText className="w-5 h-5 text-deposit" strokeWidth={1.75} />
            </div>
            <h2 className="text-lg font-bold text-text-primary">
              2. Laporan Detail Posisi Aset & Kekayaan Bersih
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              Mencetak laporan kekayaan menyeluruh yang mencakup 4 tabel utama: Ringkasan
              Kekayaan Bersih, Rincian Saldo per Rekening Likuid, Rincian Sinking Funds,
              dan Portofolio Deposito Berjangka.
            </p>

            <div className="p-3.5 rounded-xl bg-subtle border border-border space-y-2 text-xs tabular-nums">
              <div className="flex justify-between">
                <span className="text-text-secondary">Rekening Likuid Terdaftar:</span>
                <span className="font-semibold text-text-primary">
                  {accounts.length} Akun
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Target Sinking Funds:</span>
                <span className="font-semibold text-text-primary">
                  {goals.length} Target ({formatIDR(goals.reduce((s, g) => s + g.currentAmount, 0))})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Instrumen Deposito:</span>
                <span className="font-semibold text-text-primary">
                  {deposits.length} Bilyet ({formatIDR(deposits.reduce((s, d) => s + d.principal, 0))})
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            fullWidth
            onClick={handleDownloadAssetPDF}
            disabled={isGeneratingAsset}
            leftIcon={<Download className="w-4 h-4" strokeWidth={1.75} />}
          >
            {isGeneratingAsset
              ? 'Menyusun PDF Laporan Aset...'
              : 'Unduh PDF Aset & Kekayaan'}
          </Button>
        </Card>
      </div>

      {/* Local-First Data Backup & Restore (JSON + CSV) */}
      <Card padding="lg" className="space-y-5">
        <div className="border-b border-border pb-4">
          <h2 className="text-base font-bold text-text-primary">
            Cadangan Lokal, Impor JSON (Zod Validated) & Ekspor CSV
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Seluruh data Kasa Ledger disimpan secara lokal pada perangkat Anda
            (localStorage: <code className="font-mono">kasa_ledger_v1</code>). Ekspor file
            JSON secara berkala untuk memindahkan data antar ponsel dan laptop.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <Button
            variant="outline"
            onClick={handleExportJSON}
            leftIcon={<Download className="w-4 h-4 text-brand" strokeWidth={1.75} />}
            fullWidth
          >
            Ekspor Backup (.JSON)
          </Button>

          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            leftIcon={<Upload className="w-4 h-4 text-income" strokeWidth={1.75} />}
            fullWidth
          >
            Impor & Validasi (.JSON)
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileUpload}
            className="hidden"
          />

          <Button
            variant="outline"
            onClick={handleExportCSV}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-deposit" strokeWidth={1.75} />}
            fullWidth
          >
            Ekspor Mutasi (.CSV)
          </Button>
        </div>

        <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-text-secondary">
            Ingin menguji ulang dengan data sampel awal atau mengosongkan seluruh buku besar?
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmResetOpen(true)}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />}
            >
              Muat Ulang Data Demo
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmClearOpen(true)}
              leftIcon={<Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />}
            >
              Hapus Semua Data
            </Button>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={() => {
          onResetDemo();
          setStatusBanner({
            type: 'success',
            message: 'Data simulasi Indonesia berhasil dimuat ulang.'
          });
        }}
        danger={false}
        title="Muat Ulang Data Sampel?"
        description="Data transaksi, target tabungan, dan deposito saat ini akan digantikan dengan data simulasi awal."
        confirmLabel="Ya, Muat Data Demo"
      />

      <ConfirmDialog
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={() => {
          onClearAll();
          setStatusBanner({
            type: 'success',
            message: 'Seluruh data berhasil dikosongkan.'
          });
        }}
        danger
        title="Kosongkan Seluruh Data Kasa Ledger?"
        description="Tindakan ini akan menghapus seluruh transaksi, target tabungan, dan deposito dari penyimpanan browser Anda. Pastikan Anda sudah mengunduh cadangan JSON."
        confirmLabel="Ya, Hapus Semua"
      />
    </div>
  );
};
