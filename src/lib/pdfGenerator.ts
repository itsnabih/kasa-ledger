import type {
  PeriodFilter,
  SavingsGoal,
  TimeDeposit,
  Transaction
} from '../types/finance';
import {
  calculateBalancesByAccount,
  calculateDepositYield,
  calculateGoalMetrics,
  calculateMutationWithRunningBalance,
  calculateNetWorth
} from './math';
import {
  formatDateID,
  formatIDR,
  formatTimestampID,
  getPeriodLabel,
  getTodayISO
} from './formatters';

interface AccountStatementOptions {
  transactions: readonly Transaction[];
  periodFilter: PeriodFilter;
  accountFilter: string; // 'ALL' or specific account name
}

interface AssetPortfolioOptions {
  accounts: readonly string[];
  transactions: readonly Transaction[];
  goals: readonly SavingsGoal[];
  deposits: readonly TimeDeposit[];
}

/**
 * Lazy-loads jsPDF and jspdf-autotable only when the user triggers a PDF export.
 */
async function loadPdfEngines() {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);
  const autoTable = autoTableModule.default;
  return { jsPDF, autoTable };
}

/**
 * PDF 1: Laporan Mutasi Rekening (generateAccountStatementPDF)
 */
export async function generateAccountStatementPDF({
  transactions,
  periodFilter,
  accountFilter
}: AccountStatementOptions): Promise<string> {
  const { jsPDF, autoTable } = await loadPdfEngines();

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const startDate = periodFilter.preset === 'all_time' ? undefined : periodFilter.startDate;
  const endDate = periodFilter.preset === 'all_time' ? undefined : periodFilter.endDate;

  const mutation = calculateMutationWithRunningBalance(transactions, {
    startDate,
    endDate,
    account: accountFilter
  });

  const accountLabel = accountFilter === 'ALL' ? 'Semua Rekening & Dompet' : accountFilter;
  const periodLabel = getPeriodLabel(periodFilter);
  const printedAt = formatTimestampID(new Date());

  // Header Banner (Institutional Swiss Layout - White Background, Crisp Slate Borders)
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('KASA LEDGER', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('SISTEM ADMINISTRASI KEUANGAN & ARUS KAS PRIBADI', 14, 21);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN MUTASI REKENING (ACCOUNT STATEMENT)', 196, 16, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Rekening: ${accountLabel}`, 196, 21, { align: 'right' });
  doc.text(`Periode: ${periodLabel}`, 196, 25.5, { align: 'right' });
  doc.text(`Dicetak: ${printedAt}`, 196, 30, { align: 'right' });

  // Horizontal rule
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, 34, 196, 34);

  // Summary KPI Box (5 Columns)
  const kpiY = 38;
  const kpiWidth = 182;
  const colWidth = kpiWidth / 5;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(14, kpiY, kpiWidth, 18, 'FD');

  const kpiItems = [
    { label: 'SALDO AWAL', value: formatIDR(mutation.openingBalance), color: [15, 23, 42] as const },
    { label: 'TOTAL KREDIT (+)', value: formatIDR(mutation.totalCredit, true), color: [16, 185, 129] as const },
    { label: 'TOTAL DEBIT (-)', value: formatIDR(-mutation.totalDebit), color: [239, 68, 68] as const },
    { label: 'ARUS KAS BERSIH', value: formatIDR(mutation.netCashflow, true), color: [37, 99, 235] as const },
    { label: 'SALDO AKHIR', value: formatIDR(mutation.endingBalance), color: [15, 23, 42] as const }
  ];

  kpiItems.forEach((item, index) => {
    const cellX = 14 + index * colWidth;
    if (index > 0) {
      doc.setDrawColor(226, 232, 240);
      doc.line(cellX, kpiY, cellX, kpiY + 18);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, cellX + 3, kpiY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(item.color[0], item.color[1], item.color[2]);
    doc.text(item.value, cellX + 3, kpiY + 13.5);
  });

  // Build Table Rows
  const tableBody: (string | number)[][] = [
    [
      '-',
      startDate ? formatDateID(startDate) : '-',
      accountFilter === 'ALL' ? 'Semua Akun' : accountFilter,
      'Saldo Awal',
      'Saldo Awal Periode (Opening Balance)',
      '-',
      '-',
      formatIDR(mutation.openingBalance)
    ]
  ];

  mutation.rows.forEach((row, idx) => {
    tableBody.push([
      String(idx + 1),
      formatDateID(row.date),
      row.account,
      row.category,
      row.note || '-',
      row.type === 'expense' ? formatIDR(row.amount) : '-',
      row.type === 'income' ? formatIDR(row.amount) : '-',
      formatIDR(row.runningBalance)
    ]);
  });

  autoTable(doc, {
    startY: 61,
    margin: { left: 14, right: 14, bottom: 20 },
    head: [
      [
        'No',
        'Tanggal',
        'Akun',
        'Kategori',
        'Keterangan / Catatan',
        'Debit (-)',
        'Kredit (+)',
        'Saldo Berjalan'
      ]
    ],
    body: tableBody,
    foot: [
      [
        '',
        '',
        '',
        '',
        'TOTAL MUTASI & SALDO AKHIR',
        formatIDR(mutation.totalDebit),
        formatIDR(mutation.totalCredit),
        formatIDR(mutation.endingBalance)
      ]
    ],
    showFoot: 'lastPage',
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.25
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7.8,
      lineColor: [203, 213, 225]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 21 },
      2: { cellWidth: 24 },
      3: { cellWidth: 25 },
      4: { cellWidth: 37 },
      5: { cellWidth: 21, halign: 'right' },
      6: { cellWidth: 21, halign: 'right' },
      7: { cellWidth: 24, halign: 'right', fontStyle: 'bold' }
    }
  });

  // Page Footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 284, 196, 284);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Kasa Ledger — Dokumen Resmi Mutasi Rekening • Dicetak ${printedAt}`,
      14,
      289
    );
    doc.text(`Halaman ${i} dari ${totalPages}`, 196, 289, { align: 'right' });
  }

  const sanitizedAccount =
    accountFilter === 'ALL'
      ? 'Semua_Rekening'
      : accountFilter.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  const filename = `Kasa_Mutasi_Rekening_${sanitizedAccount}_${getTodayISO()}.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * PDF 2: Laporan Detail Posisi Aset & Kekayaan (generateAssetPortfolioPDF)
 */
export async function generateAssetPortfolioPDF({
  accounts,
  transactions,
  goals,
  deposits
}: AssetPortfolioOptions): Promise<string> {
  const { jsPDF, autoTable } = await loadPdfEngines();

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const todayIso = getTodayISO();
  const printedAt = formatTimestampID(new Date());
  const netWorth = calculateNetWorth(transactions, goals, deposits);
  const accountBalances = calculateBalancesByAccount(transactions, accounts);

  // Header Block
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('KASA LEDGER', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('LAPORAN POSISI KEKAYAAN, TABUNGAN TERENCANA & DEPOSITO', 14, 21);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    'LAPORAN DETAIL ASET & KEKAYAAN BERSIH (WEALTH & ASSET REPORT)',
    196,
    16,
    { align: 'right' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Tanggal Snapshot: ${formatDateID(todayIso, 'long')}`, 196, 21, { align: 'right' });
  doc.text(`Dicetak: ${printedAt}`, 196, 25.5, { align: 'right' });

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, 30, 196, 30);

  // Section 1 — Ringkasan Kekayaan Bersih (Net Worth Summary Table)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. RINGKASAN KEKAYAAN BERSIH (NET WORTH SUMMARY)', 14, 37);

  autoTable(doc, {
    startY: 40,
    margin: { left: 14, right: 14 },
    head: [['Kelas Aset / Instrumen', 'Keterangan Alokasi', 'Nominal (IDR)', 'Porsi (%)']],
    body: [
      [
        '1. Kas & Rekening Likuid',
        `${accountBalances.length} Rekening / Dompet Aktif`,
        formatIDR(netWorth.liquidCashBalance),
        `${netWorth.liquidSharePercent.toFixed(1)}%`
      ],
      [
        '2. Dana Tabungan Terencana (Sinking Funds)',
        `${goals.length} Target Keuangan Terdaftar`,
        formatIDR(netWorth.totalSavedInGoals),
        `${netWorth.goalsSharePercent.toFixed(1)}%`
      ],
      [
        '3. Uang Deposit & Dana Terkunci',
        `${deposits.filter((d) => d.status !== 'closed').length} Instrumen Deposito Aktif`,
        formatIDR(netWorth.totalActiveDepositsPrincipal),
        `${netWorth.depositsSharePercent.toFixed(1)}%`
      ]
    ],
    foot: [
      [
        'TOTAL KEKAYAAN BERSIH (NET WORTH)',
        `Est. Bunga Bersih Deposito: +${formatIDR(netWorth.totalEstimatedNetInterest)}`,
        formatIDR(netWorth.totalNetWorth),
        '100.0%'
      ]
    ],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.25
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 64, fontStyle: 'bold' },
      1: { cellWidth: 58 },
      2: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 22, halign: 'right' }
    }
  });

  // Section 2 — Rincian Saldo per Rekening Likuid
  const afterSec1Y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. RINCIAN SALDO PER REKENING LIKUID (LIQUID ACCOUNTS)', 14, afterSec1Y);

  autoTable(doc, {
    startY: afterSec1Y + 3,
    margin: { left: 14, right: 14 },
    head: [
      [
        'Nama Rekening / Dompet',
        'Total Pemasukan',
        'Total Pengeluaran',
        'Saldo Tersedia',
        'Porsi Kas (%)'
      ]
    ],
    body: accountBalances.map((acc) => [
      acc.account,
      formatIDR(acc.totalInflow),
      formatIDR(acc.totalOutflow),
      formatIDR(acc.endingBalance),
      `${acc.sharePercentage.toFixed(1)}%`
    ]),
    foot: [
      [
        'TOTAL KAS LIKUID',
        formatIDR(accountBalances.reduce((s, a) => s + a.totalInflow, 0)),
        formatIDR(accountBalances.reduce((s, a) => s + a.totalOutflow, 0)),
        formatIDR(netWorth.liquidCashBalance),
        '100.0%'
      ]
    ],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.8,
      cellPadding: 2.3,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.25
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 36, halign: 'right' },
      2: { cellWidth: 36, halign: 'right' },
      3: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 22, halign: 'right' }
    }
  });

  // Section 3 — Rincian Rencana Tabungan (Savings Goals Table)
  const afterSec2Y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. RINCIAN RENCANA TABUNGAN (SINKING FUNDS & GOALS)', 14, afterSec2Y);

  const goalsBody =
    goals.length === 0
      ? [['Belum ada target tabungan', '-', '-', '-', '-', '-', '-']]
      : goals.map((goal) => {
          const m = calculateGoalMetrics(goal, todayIso);
          return [
            goal.name,
            formatIDR(goal.targetAmount),
            formatIDR(goal.currentAmount),
            formatIDR(m.shortfall),
            `${m.completionPercentage.toFixed(1)}%`,
            formatDateID(goal.deadline),
            formatIDR(m.recommendedMonthlySaving)
          ];
        });

  autoTable(doc, {
    startY: afterSec2Y + 3,
    margin: { left: 14, right: 14 },
    head: [
      [
        'Nama Target',
        'Target Nominal',
        'Terkumpul',
        'Kekurangan',
        'Progres (%)',
        'Target Tanggal',
        'Rekomendasi/Bulan'
      ]
    ],
    body: goalsBody,
    foot: [
      [
        'TOTAL TABUNGAN TERENCANA',
        formatIDR(goals.reduce((s, g) => s + g.targetAmount, 0)),
        formatIDR(netWorth.totalSavedInGoals),
        formatIDR(
          goals.reduce((s, g) => s + Math.max(0, g.targetAmount - g.currentAmount), 0)
        ),
        '-',
        '-',
        '-'
      ]
    ],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.25
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 38, fontStyle: 'bold' },
      1: { cellWidth: 27, halign: 'right' },
      2: { cellWidth: 27, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 27, halign: 'right' },
      4: { cellWidth: 18, halign: 'right' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 25, halign: 'right' }
    }
  });

  // Section 4 — Portofolio Uang Deposit & Dana Terkunci (Deposits Table)
  const afterSec3Y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('4. PORTOFOLIO UANG DEPOSIT & DANA TERKUNCI (TIME DEPOSITS)', 14, afterSec3Y);

  const depositsBody =
    deposits.length === 0
      ? [['Belum ada instrumen deposito', '-', '-', '-', '-', '-', '-', '-']]
      : deposits.map((dep) => {
          const y = calculateDepositYield(dep, todayIso);
          const statusLabel =
            dep.status === 'closed'
              ? 'Dicairkan'
              : y.isMatured || dep.status === 'matured'
              ? 'Jatuh Tempo'
              : `Aktif (${y.daysUntilMaturity} hr)`;
          return [
            dep.bankName,
            formatIDR(dep.principal),
            `${dep.interestRatePa.toFixed(2)}%`,
            `${dep.taxRatePercent.toFixed(0)}%`,
            formatIDR(y.netInterest),
            formatIDR(y.totalMaturityPayout),
            formatDateID(dep.maturityDate),
            statusLabel
          ];
        });

  autoTable(doc, {
    startY: afterSec3Y + 3,
    margin: { left: 14, right: 14, bottom: 20 },
    head: [
      [
        'Instrumen / Bank',
        'Pokok (Principal)',
        'Bunga p.a.',
        'Pajak',
        'Est. Bunga Bersih',
        'Total Saat Cair',
        'Jatuh Tempo',
        'Status'
      ]
    ],
    body: depositsBody,
    foot: [
      [
        'TOTAL DEPOSITO AKTIF',
        formatIDR(netWorth.totalActiveDepositsPrincipal),
        '-',
        '-',
        formatIDR(netWorth.totalEstimatedNetInterest),
        formatIDR(
          netWorth.totalActiveDepositsPrincipal + netWorth.totalEstimatedNetInterest
        ),
        '-',
        '-'
      ]
    ],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.25
    },
    headStyles: {
      fillColor: [217, 119, 6],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 34, fontStyle: 'bold' },
      1: { cellWidth: 27, halign: 'right', fontStyle: 'bold' },
      2: { cellWidth: 16, halign: 'right' },
      3: { cellWidth: 13, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 27, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 20, halign: 'center' },
      7: { cellWidth: 20, halign: 'center' }
    }
  });

  // Page Footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 284, 196, 284);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Kasa Ledger — Laporan Posisi Aset & Kekayaan Bersih • Dicetak ${printedAt}`,
      14,
      289
    );
    doc.text(`Halaman ${i} dari ${totalPages}`, 196, 289, { align: 'right' });
  }

  const filename = `Kasa_Laporan_Aset_Kekayaan_${todayIso}.pdf`;
  doc.save(filename);
  return filename;
}
