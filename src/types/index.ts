export interface UploadedFile {
  id: string;
  name: string;
  uri: string;
  size: number;
  type: string;
  pages: number;
}

export interface PrintSettings {
  colorMode: 'color' | 'bw';
  paperSize: 'a4' | 'a3';
  sides: 'single' | 'double-long' | 'double-short';
  copies: number;
  pageRange: string;
  pagesPerSheet: number;
  orientation: 'portrait' | 'landscape';
}

export interface FileWithSettings {
  file: UploadedFile;
  settings: PrintSettings;
  price: number;
}

export type OrderStatus = 0 | 1 | 2;

export interface Order {
  id: string;
  orderRef: string;
  createdAt: string;
  files: FileWithSettings[];
  totalPrice: number;
  convenienceFee: number;
  status: OrderStatus;
  printerNumber: string;
  printerName: string;
  totalPages: number;
  totalCopies: number;
  progress: number; // 0-100
  estimatedCompletion?: string;
  paymentRequestId?: string;
}

export interface OrderTimeline {
  label: string;
  time: string;
  completed: boolean;
}

export type ThemeMode = 'dark' | 'light' | 'system';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photo: string | null;
}

export interface SpendingSummary {
  totalSpent: number;
  orderCount: number;
  pageCount: number;
}
