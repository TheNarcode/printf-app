import type {Order, SpendingSummary} from '../types';

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i > 0 ? 2 : 0)} ${units[i]}`;
}

export function formatCurrency(amount: number): string {
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return `\u20B9${safeAmount.toFixed(2)}`;
}

export function truncateFilename(name: string, maxLen: number = 24): string {
  if (!name || name.length <= maxLen) return name || '';
  const dotIdx = name.lastIndexOf('.');
  const ext = dotIdx > 0 ? name.slice(dotIdx) : '';
  const base = dotIdx > 0 ? name.slice(0, dotIdx) : name;
  const availBaseLen = Math.max(1, maxLen - ext.length - 3);
  return `${base.slice(0, availBaseLen)}...${ext}`;
}

export function generateOrderRef(): string {
  const year = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `#PRN-${year}-${num}`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function calculateFilePrice(
  pages: number,
  colorMode: 'color' | 'bw',
  paperSize: 'a4' | 'a3',
  sides: 'single' | 'double-long' | 'double-short',
  copies: number = 1,
  pagesPerSheet: number = 1,
): number {
  const safePages = Math.max(1, pages || 1);
  const safePps = Math.max(1, pagesPerSheet || 1);
  const safeCopies = Math.max(1, copies || 1);

  const effectiveSheets = Math.ceil(safePages / safePps);
  let pricePerSheet = 0;
  if (colorMode === 'color') {
    pricePerSheet = sides === 'single' ? 6 : 12;
  } else {
    if (sides === 'single') {
      pricePerSheet = (effectiveSheets * safeCopies === 1) ? 3 : 2.5;
    } else {
      pricePerSheet = 2;
    }
  }

  return effectiveSheets * safeCopies * pricePerSheet;
}

export function calculateConvenienceFee(subtotal: number): number {
  const safeSubtotal = Math.max(0, subtotal || 0);
  return Math.round(safeSubtotal * 0.05 * 100) / 100;
}

export function getFileTypeColor(filename: string): string {
  const ext = filename?.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return '#E74C3C';
    case 'doc': case 'docx': return '#3498DB';
    case 'jpg': case 'jpeg': case 'png': return '#27AE60';
    default: return '#9CA3AF';
  }
}

export function getFileExtLabel(filename: string): string {
  return (filename?.split('.').pop()?.toUpperCase()) || 'FILE';
}

export function estimatePageCount(sizeBytes: number, fileType: string): number {
  if (fileType?.includes('image')) return 1;
  return Math.max(1, Math.ceil((sizeBytes || 0) / 1024 / 100));
}

export function formatDate(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {month: 'short', day: 'numeric', year: 'numeric'});
}

export function formatDateTime(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export function formatTime(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit', hour12: true});
}

export function calculateSpending(
  orders: Order[],
  period: 'day' | 'week' | 'month',
): SpendingSummary {
  const now = new Date();
  let start: Date;
  if (period === 'day') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'week') {
    start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const safeOrders = orders || [];
  const filtered = safeOrders.filter(
    o => new Date(o.createdAt) >= start && o.paid,
  );

  let bwPages = 0;
  let colorPages = 0;

  filtered.forEach(o => {
    (o.files || []).forEach(f => {
      const pagesPerSheet = f.settings?.pagesPerSheet || 1;
      const pages = f.file?.pages || 1;
      const effectiveSheets = Math.ceil(pages / pagesPerSheet);
      const totalForFile = effectiveSheets * (f.settings?.copies || 1);
      if (f.settings?.colorMode === 'color') {
        colorPages += totalForFile;
      } else {
        bwPages += totalForFile;
      }
    });
  });

  return {
    totalSpent: filtered.reduce((s, o) => s + (o.totalPrice || 0), 0),
    orderCount: filtered.length,
    pageCount: bwPages + colorPages,
    bwPages,
    colorPages,
  };
}

export function getStatusColor(status: string, colors: any) {
  switch (status) {
    case 'completed': case 'collected': return {bg: colors.successBg, text: colors.success, border: colors.successBorder};
    case 'printing': case 'processing': return {bg: colors.primaryBg, text: colors.primary, border: colors.primaryBorder};
    case 'pending': return {bg: colors.warningBg, text: colors.warning, border: colors.warningBorder};
    case 'failed': return {bg: colors.dangerBg, text: colors.danger, border: colors.dangerBorder || (colors.danger + '30')};
    default: return {bg: colors.surface, text: colors.textMuted, border: colors.border};
  }
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pending', processing: 'Processing',
    printing: 'Printing', completed: 'Completed', failed: 'Failed',
    collected: 'Ready for Pickup',
  };
  return map[status] || status;
}