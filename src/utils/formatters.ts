import type {Order, SpendingSummary} from '../types';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i > 0 ? 2 : 0)} ${units[i]}`;
}

export function formatCurrency(amount: number): string {
  return `\u20B9${amount.toFixed(2)}`;
}

export function truncateFilename(name: string, maxLen: number = 24): string {
  if (name.length <= maxLen) return name;
  const ext = name.lastIndexOf('.') !== -1 ? name.slice(name.lastIndexOf('.')) : '';
  const base = name.slice(0, name.lastIndexOf('.') !== -1 ? name.lastIndexOf('.') : name.length);
  return `${base.slice(0, maxLen - ext.length - 3)}...${ext}`;
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
  const effectiveSheets = Math.ceil(pages / pagesPerSheet);
  
  let pricePerSheet = 0;
  if (colorMode === 'color') {
    pricePerSheet = sides === 'single' ? 5 : 10;
  } else {
    pricePerSheet = sides === 'single' ? 3 : 2;
  }

  return effectiveSheets * copies * pricePerSheet;
}

export function calculateConvenienceFee(subtotal: number): number {
  return Math.round(subtotal * 0.05 * 100) / 100;
}

export function getFileTypeColor(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return '#E74C3C';
    case 'doc': case 'docx': return '#3498DB';
    case 'jpg': case 'jpeg': case 'png': return '#27AE60';
    default: return '#9CA3AF';
  }
}

export function getFileExtLabel(filename: string): string {
  return (filename.split('.').pop()?.toUpperCase()) || 'FILE';
}

export function estimatePageCount(sizeBytes: number, fileType: string): number {
  if (fileType.includes('image')) return 1;
  return Math.max(1, Math.ceil(sizeBytes / 1024 / 100));
}

export function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-IN', {month: 'short', day: 'numeric', year: 'numeric'});
}

export function formatDateTime(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleString('en-IN', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export function formatTime(isoDate: string): string {
  const d = new Date(isoDate);
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
  const filtered = orders.filter(
    o => new Date(o.createdAt) >= start && o.status !== 1,
  );
  return {
    totalSpent: filtered.reduce((s, o) => s + o.totalPrice, 0),
    orderCount: filtered.length,
    pageCount: filtered.reduce((s, o) => s + o.totalPages, 0),
  };
}

export function getStatusColor(status: string, colors: any) {
  switch (status) {
    case 'completed': return {bg: colors.successBg, text: colors.success, border: colors.successBorder};
    case 'printing': case 'processing': return {bg: colors.primaryBg, text: colors.primary, border: colors.primaryBorder};
    case 'pending': return {bg: 'rgba(245,158,11,0.1)', text: '#F59E0B', border: 'rgba(245,158,11,0.3)'};
    case 'failed': return {bg: colors.dangerBg, text: colors.danger, border: colors.danger + '30'};
    default: return {bg: colors.surface, text: colors.textMuted, border: colors.border};
  }
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pending', processing: 'Processing',
    printing: 'Printing', completed: 'Completed', failed: 'Failed',
  };
  return map[status] || status;
}
