import React, { useState } from 'react';
import {
  Sun,
  Moon,
  FileText,
  Calendar,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import type { NavigationTab, PeriodFilter, PeriodPreset } from '../../types/finance';
import type { ThemeMode } from '../../hooks/useTheme';
import { Button } from '../ui/Button';

interface HeaderProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  periodFilter: PeriodFilter;
  onChangePreset: (preset: PeriodPreset, customStart?: string, customEnd?: string) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onQuickExportMutasiPDF: () => Promise<void>;
  canInstallPWA: boolean;
  onInstallPWA: () => void;
}

const TAB_TITLES: Record<NavigationTab, { title: string; subtitle: string }> = {
  overview: {
    title: 'Ringkasan Kekayaan & Arus Kas',
    subtitle: 'Posisi likuiditas real-time, alokasi kas per bank, dan arus kas bersih'
  },
  ledger: {
    title: 'Buku Besar & Mutasi Rekening',
    subtitle: 'Pencatatan transaksi harian dengan perhitungan saldo berjalan otomatis'
  },
  goals: {
    title: 'Dana Tabungan Terencana (Sinking Funds)',
    subtitle: 'Alokasi dana masa depan, target nominal, dan rekomendasi setoran bulanan'
  },
  deposits: {
    title: 'Portofolio Uang Deposit & Dana Terkunci',
    subtitle: 'Kalkulasi imbal hasil bunga deposito p.a., pajak 20%, dan jatuh tempo'
  },
  bills: {
    title: 'Manajemen Tagihan & Pinjaman',
    subtitle: 'Kontrol sumber pinjaman, cicilan per periode, denda keterlambatan, dan tenggat waktu'
  },
  reports: {
    title: 'Laporan PDF Vektor & Cadangan Data',
    subtitle: 'Cetak laporan mutasi rekening standar perbankan, laporan aset, dan cadangan JSON/CSV'
  }
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  periodFilter,
  onChangePreset,
  theme,
  onToggleTheme,
  onQuickExportMutasiPDF,
  canInstallPWA,
  onInstallPWA
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const currentMeta = TAB_TITLES[activeTab];

  const handleExportClick = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await onQuickExportMutasiPDF();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border px-4 md:px-7 py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Top Row on Mobile: Brand + Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="md:hidden w-8 h-8 rounded-lg bg-text-primary text-surface flex items-center justify-center font-bold text-sm">
              K
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold text-text-primary tracking-tight">
                {currentMeta.title}
              </h1>
              <p className="hidden sm:block text-xs text-text-secondary">
                {currentMeta.subtitle}
              </p>
            </div>
          </div>

          {/* Mobile right controls */}
          <div className="flex items-center gap-1.5 md:hidden">
            {canInstallPWA ? (
              <button
                type="button"
                onClick={onInstallPWA}
                aria-label="Instal PWA"
                className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg border border-border bg-subtle text-text-primary touch-manipulation"
              >
                <Download className="w-4 h-4" strokeWidth={1.75} />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onSelectTab('reports')}
              aria-label="Buka Laporan & Backup"
              className={`inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg border touch-manipulation ${
                activeTab === 'reports'
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-border bg-subtle text-text-primary'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Ganti Tema Terang/Gelap"
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg border border-border bg-subtle text-text-primary touch-manipulation"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-deposit" strokeWidth={1.75} />
              ) : (
                <Moon className="w-4 h-4 text-text-primary" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>

        {/* Period Filter & Desktop Quick PDF Export */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-subtle border border-border rounded-lg px-2.5 min-h-[44px] flex-1 sm:flex-initial">
            <Calendar className="w-4 h-4 text-text-secondary mr-2 shrink-0" strokeWidth={1.75} />
            <label htmlFor="header-period-select" className="sr-only">
              Pilih Periode Laporan
            </label>
            <select
              id="header-period-select"
              value={periodFilter.preset}
              onChange={(e) => onChangePreset(e.target.value as PeriodPreset)}
              className="bg-transparent text-xs sm:text-sm font-medium text-text-primary focus:outline-none w-full pr-2 py-1"
            >
              <option value="this_month" className="bg-surface text-text-primary">
                Periode: Bulan Ini
              </option>
              <option value="last_month" className="bg-surface text-text-primary">
                Periode: Bulan Lalu
              </option>
              <option value="this_year" className="bg-surface text-text-primary">
                Periode: Tahun Ini
              </option>
              <option value="all_time" className="bg-surface text-text-primary">
                Periode: Semua Waktu
              </option>
              <option value="custom" className="bg-surface text-text-primary">
                Periode: Rentang Kustom
              </option>
            </select>
          </div>

          {periodFilter.preset === 'custom' ? (
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <input
                type="date"
                aria-label="Tanggal Mulai"
                value={periodFilter.startDate}
                onChange={(e) =>
                  onChangePreset('custom', e.target.value, periodFilter.endDate)
                }
                className="min-h-[44px] px-2.5 py-1.5 text-xs bg-subtle border border-border rounded-lg text-text-primary tabular-nums"
              />
              <span className="text-xs text-text-secondary">s/d</span>
              <input
                type="date"
                aria-label="Tanggal Akhir"
                value={periodFilter.endDate}
                onChange={(e) =>
                  onChangePreset('custom', periodFilter.startDate, e.target.value)
                }
                className="min-h-[44px] px-2.5 py-1.5 text-xs bg-subtle border border-border rounded-lg text-text-primary tabular-nums"
              />
            </div>
          ) : null}

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportClick}
            disabled={isExporting}
            leftIcon={<FileText className="w-4 h-4 text-brand" strokeWidth={1.75} />}
            className="hidden sm:inline-flex"
          >
            {isExporting ? 'Mencetak PDF...' : 'Cetak Mutasi PDF'}
          </Button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Ganti Tema Terang/Gelap"
            className="hidden md:inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg border border-border bg-subtle hover:bg-border/60 text-text-primary transition-colors touch-manipulation"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-deposit" strokeWidth={1.75} />
            ) : (
              <Moon className="w-4 h-4 text-text-primary" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
