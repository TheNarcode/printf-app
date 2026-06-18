import ReactNativeBlobUtil from 'react-native-blob-util';
import type { PrintSettings } from '../types';

// The API runs locally — change this to your machine's local IP
// when running on a physical device (localhost doesn't work from device).
// For emulator, 10.0.2.2 maps to host machine's localhost.
const API_BASE_URL = 'https://tar-disclosure-villa-favor.trycloudflare.com';

// ── Settings mapping (App → API/IPP) ───────────────────────────────

function mapColorMode(colorMode: 'color' | 'bw'): string {
  return colorMode === 'bw' ? 'Monochrome' : 'Color';
}

function mapSides(sides: 'single' | 'double-long' | 'double-short'): string {
  switch (sides) {
    case 'double-long': return 'two-sided-long-edge';
    case 'double-short': return 'two-sided-short-edge';
    default: return 'one-sided';
  }
}

function mapPaperFormat(paperSize: 'a4' | 'a3'): string {
  return paperSize === 'a3' ? 'iso_a3_297x420mm' : 'iso_a4_210x297mm';
}

function mapOrientation(orientation: 'portrait' | 'landscape'): string {
  return orientation === 'landscape' ? '4' : '3';
}

function mapPageRange(pageRange: string): string {
  // 'all' means no range restriction → empty string for IPP
  return pageRange === 'all' ? '' : pageRange;
}

export interface PrintConfigPayload {
  fileId: string;
  name: string;
  orientation: string;
  color: string;
  copies: string;
  paperFormat: string;
  pageRanges: string;
  numberUp: string;
  sides: string;
  printScaling: string;
  documentFormat: string;
}

export function buildPrintConfig(
  fileId: string,
  fileName: string,
  fileType: string,
  settings: PrintSettings,
): PrintConfigPayload {
  return {
    fileId,
    name: fileName,
    orientation: mapOrientation(settings.orientation),
    color: mapColorMode(settings.colorMode),
    copies: String(settings.copies),
    paperFormat: mapPaperFormat(settings.paperSize),
    pageRanges: mapPageRange(settings.pageRange),
    numberUp: String(settings.pagesPerSheet),
    sides: mapSides(settings.sides),
    printScaling: 'auto',
    documentFormat: fileType || 'application/pdf',
  };
}

// ── File Upload ─────────────────────────────────────────────────────

export async function uploadFile(
  uri: string,
  fileName: string,
  fileType: string,
  _idToken?: string | null,
): Promise<{ fileId: string }> {
  const response = await ReactNativeBlobUtil.fetch(
    'POST',
    `${API_BASE_URL}/file/create`,
    {
      'Content-Type': 'multipart/form-data',
      // ...(idToken ? {'xxx-auth-token': idToken} : {}),
    },
    [
      {
        name: 'file',
        filename: fileName,
        type: fileType,
        data: ReactNativeBlobUtil.wrap(uri.replace('file://', '')),
      },
    ],
  );

  const status = response.info().status;
  if (status !== 200) {
    throw new Error(`File upload failed with status ${status}: ${response.text()}`);
  }

  return response.json();
}

// ── Order Creation ──────────────────────────────────────────────────

export interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  localOrderId: string;
  [key: string]: any;
}

export async function createOrder(
  printConfigs: PrintConfigPayload[],
  idToken?: string | null,
): Promise<RazorpayOrderResponse> {
  const response = await fetch(`${API_BASE_URL}/order/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { 'xxx-auth-token': idToken } : {}),
    },
    body: JSON.stringify(printConfigs),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Order creation failed (${response.status}): ${text}`);
  }

  return response.json();
}

// ── Fetch Orders ────────────────────────────────────────────────────

export interface ApiFile {
  fileId: string;
  order: string;
  orientation: string;
  color: string;
  copies: string;
  paperFormat: string;
  pageRanges: string;
  numberUp: string;
  sides: string;
  printScaling: string;
  documentFormat: string;
  metadata: {
    fileId: string;
    name: string;
    type: string;
    pages: number;
  } | null;
}

export interface ApiOrder {
  id: string;
  email: string;
  amount: number;
  paymentRequestId: string;
  paid: boolean;
  status: number;
  createdAt: string;
  files: ApiFile[];
}

export async function fetchOrders(
  idToken?: string | null,
): Promise<ApiOrder[]> {
  const response = await fetch(`${API_BASE_URL}/order/list`, {
    method: 'GET',
    headers: {
      ...(idToken ? { 'xxx-auth-token': idToken } : {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Fetch orders failed (${response.status}): ${text}`);
  }

  return response.json();
}

// ── Convert API Order → App Order ───────────────────────────────────

import type { Order, FileWithSettings, OrderStatus } from '../types';

function mapApiStatus(status: number, paid: boolean): OrderStatus {
  // API status: 0 = pending, 1 = processing, 2 = printing, 3 = completed, 4 = failed
  if (!paid) return 'pending';
  switch (status) {
    case 1: return 'processing';
    case 2: return 'printing';
    case 3: return 'completed';
    case 4: return 'failed';
    default: return 'pending';
  }
}

function reverseMapColor(color: string): 'color' | 'bw' {
  return color === 'Monochrome' ? 'bw' : 'color';
}

function reverseMapSides(sides: string): 'single' | 'double-long' | 'double-short' {
  switch (sides) {
    case 'two-sided-long-edge': return 'double-long';
    case 'two-sided-short-edge': return 'double-short';
    default: return 'single';
  }
}

function reverseMapPaperFormat(paper: string): 'a4' | 'a3' {
  return paper.includes('a3') ? 'a3' : 'a4';
}

function reverseMapOrientation(orient: string): 'portrait' | 'landscape' {
  return orient === '4' ? 'landscape' : 'portrait';
}

export function apiOrderToAppOrder(apiOrder: ApiOrder): Order {
  const filesWithSettings: FileWithSettings[] = apiOrder.files.map(f => {
    const pages = f.metadata?.pages ?? 0;
    const copies = parseInt(f.copies, 10) || 1;
    return {
      file: {
        id: f.fileId,
        name: f.metadata?.name ?? 'Unknown file',
        uri: '',
        size: 0,
        type: f.metadata?.type ?? f.documentFormat,
        pages,
      },
      settings: {
        colorMode: reverseMapColor(f.color),
        paperSize: reverseMapPaperFormat(f.paperFormat),
        sides: reverseMapSides(f.sides),
        copies,
        pageRange: f.pageRanges || 'all',
        pagesPerSheet: parseInt(f.numberUp, 10) || 1,
        orientation: reverseMapOrientation(f.orientation),
      },
      price: apiOrder.amount,
    };
  });

  const totalPages = filesWithSettings.reduce((s, f) => s + f.file.pages, 0);
  const totalCopies = filesWithSettings.reduce((s, f) => s + f.settings.copies, 0);
  const appStatus = mapApiStatus(apiOrder.status, apiOrder.paid);

  return {
    id: apiOrder.id,
    orderRef: apiOrder.id.substring(0, 8).toUpperCase(),
    createdAt: apiOrder.createdAt,
    files: filesWithSettings,
    totalPrice: apiOrder.amount,
    convenienceFee: 0,
    status: appStatus,
    printerNumber: '--',
    printerName: 'Assigned on print',
    totalPages,
    totalCopies,
    progress: appStatus === 'completed' ? 100 : appStatus === 'printing' ? 50 : 0,
    estimatedCompletion: undefined,
  };
}

