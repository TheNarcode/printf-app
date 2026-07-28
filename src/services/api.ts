import ReactNativeBlobUtil from 'react-native-blob-util';
import type { PrintSettings } from '../types';

export const API_BASE_URL = 'https://printfs.thenarcode.workers.dev';

function mapColorMode(colorMode: 'color' | 'bw'): string {
  return colorMode === 'bw' ? 'Monochrome' : 'Color';
}

function mapSides(sides: 'single' | 'double-long' | 'double-short'): string {
  switch (sides) {
    case 'double-long':
      return 'two-sided-long-edge';
    case 'double-short':
      return 'two-sided-short-edge';
    default:
      return 'one-sided';
  }
}

function mapPaperFormat(paperSize: 'a4' | 'a3'): string {
  return paperSize === 'a3' ? 'iso_a3_297x420mm' : 'iso_a4_210x297mm';
}

function mapOrientation(orientation: 'portrait' | 'landscape'): string {
  return orientation === 'landscape' ? '4' : '3';
}

function mapPageRange(pageRange: string): string {
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

const API_TIMEOUT_MS = 15000; 

function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = API_TIMEOUT_MS,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      reject(
        new Error(
          'Request timed out. Please check your connection and try again.'
        ),
      );
    }, timeoutMs);

    fetch(url, { ...options, signal: controller.signal })
      .then(res => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch(err => {
        clearTimeout(timer);
        if (err.name === 'AbortError') {
          reject(
            new Error(
              'Request timed out. Please check your connection and try again.',
            ),
          );
        } else {
          reject(
            new Error('Unable to connect right now. Please try again later.'),
          );
        }
      });
  });
}

export async function uploadFile(
  uri: string,
  fileName: string,
  fileType: string,
  idToken?: string | null,
  onTask?: (task: any) => void,
): Promise<{ fileId: string }> {
  try {
    const task = ReactNativeBlobUtil.fetch(
      'POST',
      `${API_BASE_URL}/file/create`,
      {
        'Content-Type': 'multipart/form-data',
        ...(idToken ? { 'xxx-auth-token': idToken } : {}),
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

    if (onTask) onTask(task);
    const response = await task;

    const status = response.info().status;
    if (status !== 200) {
      throw new Error(`File upload failed (${status}): ${response.text()}`);
    }

    return response.json();
  } catch (err: any) {
    if (err.message?.includes('File upload failed')) throw err;
    throw new Error(
      'Unable to upload file. Please check your connection and try again.',
    );
  }
}

export interface CreateOrderResponse {
  id?: string;
  amount: number | string;  
  currency?: string;
  receipt?: string;
  status?: string;
  localOrderId: string;
  payments_session_id?: string; 
  [key: string]: any;
}

export async function createOrder(
  printConfigs: PrintConfigPayload[],
  idToken?: string | null,
): Promise<CreateOrderResponse> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/order/create`, {
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
  printerName?: string;
  files: ApiFile[];
}

export async function fetchOrders(
  idToken?: string | null,
): Promise<ApiOrder[]> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/order/list`, {
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

import type { Order, FileWithSettings, OrderStatus } from '../types';
import { calculateFilePrice } from '../utils/formatters';
import { parsePageRange } from '../utils/previewUtils';

function mapApiStatus(status: number, paid: boolean): OrderStatus {
  if (!paid) return 0;
  if (status === 1) return 1;
  if (status === 2) return 2;
  if (status === 3) return 3;
  return 0;
}

function reverseMapColor(color: string): 'color' | 'bw' {
  return color === 'Monochrome' ? 'bw' : 'color';
}

function reverseMapSides(
  sides: string,
): 'single' | 'double-long' | 'double-short' {
  switch (sides) {
    case 'two-sided-long-edge':
      return 'double-long';
    case 'two-sided-short-edge':
      return 'double-short';
    default:
      return 'single';
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
      price: calculateFilePrice(
        parsePageRange(f.pageRanges || 'all', pages).length,
        reverseMapColor(f.color),
        reverseMapPaperFormat(f.paperFormat),
        reverseMapSides(f.sides),
        copies,
        parseInt(f.numberUp, 10) || 1,
      ),
    };
  });

  const totalPages = filesWithSettings.reduce((s, f) => s + f.file.pages, 0);
  const totalCopies = filesWithSettings.reduce(
    (s, f) => s + f.settings.copies,
    0,
  );
  const appStatus = mapApiStatus(apiOrder.status, apiOrder.paid);

  const totalAmountNum = typeof apiOrder.amount === 'string' ? parseFloat(apiOrder.amount) : apiOrder.amount;
  const itemsPriceSum = filesWithSettings.reduce((s, f) => s + f.price, 0);

  return {
    id: apiOrder.id,
    orderRef: apiOrder.id.substring(0, 8).toUpperCase(),
    createdAt: apiOrder.createdAt,
    files: filesWithSettings,
    totalPrice: totalAmountNum,
    convenienceFee: Math.max(0, Math.round((totalAmountNum - itemsPriceSum) * 100) / 100),
    paymentRequestId: apiOrder.paymentRequestId,
    status: appStatus,
    paid: apiOrder.paid,
    printerNumber: '--',
    printerName: apiOrder.printerName || 'Assigned on print',
    totalPages,
    totalCopies,
    progress: appStatus === 1 ? 50 : appStatus === 3 ? 100 : appStatus === 2 ? 100 : 0,
    estimatedCompletion: undefined,
  };
}