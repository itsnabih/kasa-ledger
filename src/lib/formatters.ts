import type { PeriodFilter, PeriodPreset } from '../types/finance';

const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

const numberDotsFormatter = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

/**
 * Formats an integer amount into Indonesian Rupiah (e.g. "Rp 1.500.000" or "-Rp 250.000").
 */
export function formatIDR(amount: number, showPlusSign = false): string {
  const rounded = Math.round(amount);
  const absFormatted = idrFormatter.format(Math.abs(rounded)).replace(/\u00A0/g, ' ');
  if (rounded < 0) {
    return `-${absFormatted}`;
  }
  if (rounded > 0 && showPlusSign) {
    return `+${absFormatted}`;
  }
  return absFormatted;
}

/**
 * Formats integer with thousand separator dots only (e.g. "1.500.000").
 */
export function formatNumberWithDots(amount: number): string {
  if (!Number.isFinite(amount)) return '0';
  return numberDotsFormatter.format(Math.round(amount));
}

/**
 * Parses a raw string containing digits/dots into a whole integer Rupiah amount.
 */
export function parseDigitsToInteger(raw: string): number {
  const digitsOnly = raw.replace(/[^\d]/g, '');
  if (!digitsOnly) return 0;
  const parsed = Number.parseInt(digitsOnly, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats compact IDR for mobile badges/axes (e.g., "Rp 12,5 Jt", "Rp 1,2 M", "Rp 750 Rb").
 */
export function formatCompactIDR(amount: number): string {
  const rounded = Math.round(amount);
  const abs = Math.abs(rounded);
  const sign = rounded < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    const val = (abs / 1_000_000_000).toFixed(2).replace('.', ',').replace(/,00$/, '');
    return `${sign}Rp ${val} M`;
  }
  if (abs >= 1_000_000) {
    const val = (abs / 1_000_000).toFixed(1).replace('.', ',').replace(/,0$/, '');
    return `${sign}Rp ${val} Jt`;
  }
  if (abs >= 1_000) {
    const val = Math.round(abs / 1_000);
    return `${sign}Rp ${val} Rb`;
  }
  return formatIDR(rounded);
}

const INDONESIAN_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const INDONESIAN_MONTHS_LONG = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Formats YYYY-MM-DD into "15 Okt 2026" or "15 Oktober 2026".
 */
export function formatDateID(isoDate: string, style: 'short' | 'long' = 'short'): string {
  if (!isoDate) return '-';
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return isoDate;
  const [year, month, day] = parts;
  const monthIdx = Math.max(0, Math.min(11, month - 1));
  const monthName =
    style === 'long' ? INDONESIAN_MONTHS_LONG[monthIdx] : INDONESIAN_MONTHS_SHORT[monthIdx];
  return `${String(day).padStart(2, '0')} ${monthName} ${year}`;
}

/**
 * Formats a full timestamp for PDF footers & audit trails.
 */
export function formatTimestampID(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${ formatDateID(`${yyyy}-${mm}-${dd}`, 'long') } pukul ${hh}:${min} WIB`;
}

/**
 * Returns today's date in YYYY-MM-DD local format.
 */
export function getTodayISO(reference: Date = new Date()): string {
  const yyyy = reference.getFullYear();
  const mm = String(reference.getMonth() + 1).padStart(2, '0');
  const dd = String(reference.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Computes start and end YYYY-MM-DD for a PeriodPreset.
 */
export function resolvePeriodRange(
  preset: PeriodPreset,
  reference: Date = new Date(),
  customStart?: string,
  customEnd?: string
): PeriodFilter {
  const year = reference.getFullYear();
  const month = reference.getMonth(); // 0-indexed

  if (preset === 'this_month') {
    const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { preset, startDate: start, endDate: end };
  }

  if (preset === 'last_month') {
    const prevDate = new Date(year, month - 1, 1);
    const pYear = prevDate.getFullYear();
    const pMonth = prevDate.getMonth();
    const lastDay = new Date(pYear, pMonth + 1, 0).getDate();
    const start = `${pYear}-${String(pMonth + 1).padStart(2, '0')}-01`;
    const end = `${pYear}-${String(pMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { preset, startDate: start, endDate: end };
  }

  if (preset === 'this_year') {
    return {
      preset,
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`
    };
  }

  if (preset === 'custom') {
    const fallback = getTodayISO(reference);
    return {
      preset: 'custom',
      startDate: customStart || `${year}-${String(month + 1).padStart(2, '0')}-01`,
      endDate: customEnd || fallback
    };
  }

  // all_time
  return {
    preset: 'all_time',
    startDate: '2000-01-01',
    endDate: '2099-12-31'
  };
}

export function getPeriodLabel(filter: PeriodFilter): string {
  switch (filter.preset) {
    case 'this_month':
      return `Bulan Ini (${formatDateID(filter.startDate)} – ${formatDateID(filter.endDate)})`;
    case 'last_month':
      return `Bulan Lalu (${formatDateID(filter.startDate)} – ${formatDateID(filter.endDate)})`;
    case 'this_year':
      return `Tahun Ini (${filter.startDate.slice(0, 4)})`;
    case 'all_time':
      return 'Semua Waktu (Historis Penuh)';
    case 'custom':
      return `${formatDateID(filter.startDate)} – ${formatDateID(filter.endDate)}`;
  }
}
