import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import type {
  FileWithSettings,
  Order,
  PrintSettings,
  UploadedFile,
} from '../types';
import {
  calculateConvenienceFee,
  calculateFilePrice,
  generateId,
  generateOrderRef,
} from '../utils/formatters';
import { getStoredOrders, setStoredOrders } from '../services/storage';
import { fetchOrders, apiOrderToAppOrder } from '../services/api';
import { resetUploads } from '../services/fileUploadManager';
import { useAuth } from './AuthContext';
import { parsePageRange } from '../utils/previewUtils';

const defaultSettings: PrintSettings = {
  colorMode: 'bw',
  paperSize: 'a4',
  sides: 'single',
  copies: 1,
  pageRange: 'all',
  pagesPerSheet: 1,
  orientation: 'portrait',
};

interface State {
  files: UploadedFile[];
  fileSettings: Record<string, PrintSettings>;
  orders: Order[];
}

type Action =
  | { type: 'ADD_FILES'; payload: UploadedFile[] }
  | { type: 'REMOVE_FILE'; payload: string }
  | { type: 'CLEAR_FILES' }
  | {
      type: 'UPDATE_SETTINGS';
      payload: { fileId: string; settings: Partial<PrintSettings> };
    }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'RESET_FLOW' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_FILES': {
      const newSettings = { ...state.fileSettings };
      action.payload.forEach(f => {
        if (!newSettings[f.id]) newSettings[f.id] = { ...defaultSettings };
      });
      return {
        ...state,
        files: [...state.files, ...action.payload],
        fileSettings: newSettings,
      };
    }
    case 'REMOVE_FILE': {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [action.payload]: _removed, ...rest } = state.fileSettings;
      return {
        ...state,
        files: state.files.filter(f => f.id !== action.payload),
        fileSettings: rest,
      };
    }
    case 'CLEAR_FILES':
      return { ...state, files: [], fileSettings: {} };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        fileSettings: {
          ...state.fileSettings,
          [action.payload.fileId]: {
            ...state.fileSettings[action.payload.fileId],
            ...action.payload.settings,
          },
        },
      };
    case 'ADD_ORDER': {
      const newOrders = [action.payload, ...state.orders];
      setStoredOrders(newOrders);
      return { ...state, orders: newOrders };
    }
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    case 'RESET_FLOW':
      return { ...state, files: [], fileSettings: {} };
    default:
      return state;
  }
}

interface ContextValue {
  files: UploadedFile[];
  fileSettings: Record<string, PrintSettings>;
  orders: Order[];
  addFiles: (files: UploadedFile[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  updateFileSettings: (
    fileId: string,
    settings: Partial<PrintSettings>,
  ) => void;
  getFilesWithSettings: () => FileWithSettings[];
  getOrderSummary: () => {
    items: FileWithSettings[];
    subtotal: number;
    fee: number;
    total: number;
  };
  createOrder: () => Order;
  addOrder: (order: Order) => void;
  refreshOrders: () => Promise<void>;
  resetFlow: () => void;
}

const PrintJobContext = createContext<ContextValue | null>(null);

export function PrintJobProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, getValidToken } = useAuth();
  const [state, dispatch] = useReducer(reducer, {
    files: [],
    fileSettings: {},
    orders: [],
  });

  // Load orders: try API first, fall back to local storage
  const loadOrders = useCallback(
    async (throwOnError = false) => {
      if (isAuthenticated) {
        try {
          const token = await getValidToken();
          if (token) {
            const apiOrders = await fetchOrders(token);
            const appOrders = apiOrders.map(apiOrderToAppOrder);
            dispatch({ type: 'SET_ORDERS', payload: appOrders });
            setStoredOrders(appOrders); // cache locally
            return;
          }
        } catch (err) {
          console.warn(
            'Failed to fetch orders from API, falling back to local:',
            err,
          );
          if (throwOnError) throw err;
        }
      }
      // Fallback: local storage
      const stored = await getStoredOrders();
      dispatch({ type: 'SET_ORDERS', payload: stored });
    },
    [isAuthenticated, getValidToken],
  );

  useEffect(() => {
    loadOrders(false); // silent on mount
  }, [loadOrders]);

  const addFiles = useCallback(
    (files: UploadedFile[]) => dispatch({ type: 'ADD_FILES', payload: files }),
    [],
  );
  const removeFile = useCallback(
    (id: string) => dispatch({ type: 'REMOVE_FILE', payload: id }),
    [],
  );
  const clearFiles = useCallback(() => dispatch({ type: 'CLEAR_FILES' }), []);
  const updateFileSettings = useCallback(
    (fileId: string, settings: Partial<PrintSettings>) =>
      dispatch({ type: 'UPDATE_SETTINGS', payload: { fileId, settings } }),
    [],
  );
  const resetFlow = useCallback(() => {
    resetUploads();
    dispatch({ type: 'RESET_FLOW' });
  }, []);

  const getFilesWithSettings = useCallback((): FileWithSettings[] => {
    return state.files.map(file => {
      const s = state.fileSettings[file.id] || defaultSettings;
      const effectivePages = parsePageRange(s.pageRange, file.pages).length;
      const price = calculateFilePrice(
        effectivePages,
        s.colorMode,
        s.paperSize,
        s.sides,
        s.copies,
        s.pagesPerSheet,
      );
      return { file: { ...file, pages: effectivePages }, settings: s, price };
    });
  }, [state.files, state.fileSettings]);

  const getOrderSummary = useCallback(() => {
    const items = getFilesWithSettings();
    const subtotal = items.reduce((sum, i) => sum + i.price, 0);
    const fee = calculateConvenienceFee(subtotal);
    return {
      items,
      subtotal,
      fee,
      total: Math.round((subtotal + fee) * 100) / 100,
    };
  }, [getFilesWithSettings]);

  const createOrder = useCallback((): Order => {
    const { items, fee, total } = getOrderSummary();
    const totalPages = items.reduce((sum, i) => sum + i.file.pages, 0);
    const totalCopies = items.reduce((sum, i) => sum + i.settings.copies, 0);
    const order: Order = {
      id: generateId(),
      orderRef: generateOrderRef().replace('#PRN', 'ORD'),
      createdAt: new Date().toISOString(),
      files: items,
      totalPrice: total,
      convenienceFee: fee,
      status: 0,
      paid: false,
      paymentRequestId: undefined,
      printerNumber: '--',
      printerName: 'Assigned on print',
      totalPages,
      totalCopies,
      progress: 0,
      estimatedCompletion: new Date(Date.now() + 60 * 60000).toISOString(),
    };
    dispatch({ type: 'ADD_ORDER', payload: order });
    dispatch({ type: 'RESET_FLOW' });
    return order;
  }, [getOrderSummary]);

  const addOrder = useCallback((order: Order) => {
    dispatch({ type: 'ADD_ORDER', payload: order });
  }, []);

  const refreshOrders = useCallback(async () => {
    await loadOrders(true); // throw on error so callers can show alerts
  }, [loadOrders]);

  const value = useMemo(
    () => ({
      files: state.files,
      fileSettings: state.fileSettings,
      orders: state.orders,
      addFiles,
      removeFile,
      clearFiles,
      updateFileSettings,
      getFilesWithSettings,
      getOrderSummary,
      createOrder,
      addOrder,
      refreshOrders,
      resetFlow,
    }),
    [
      state.files,
      state.fileSettings,
      state.orders,
      addFiles,
      removeFile,
      clearFiles,
      updateFileSettings,
      getFilesWithSettings,
      getOrderSummary,
      createOrder,
      addOrder,
      refreshOrders,
      resetFlow,
    ],
  );

  return (
    <PrintJobContext.Provider value={value}>
      {children}
    </PrintJobContext.Provider>
  );
}

export function usePrintJob(): ContextValue {
  const ctx = useContext(PrintJobContext);
  if (!ctx) throw new Error('usePrintJob must be used within PrintJobProvider');
  return ctx;
}
