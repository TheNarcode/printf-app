import React, {createContext, useCallback, useContext, useMemo, useReducer} from 'react';
import type {FileWithSettings, Order, PrintSettings, UploadedFile} from '../types';
import {calculateConvenienceFee, calculateFilePrice, generateId, generateOrderRef} from '../utils/formatters';
import {getMockOrders} from '../services/dummyApi';

const defaultSettings: PrintSettings = {
  colorMode: 'color',
  paperSize: 'letter',
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
  | {type: 'ADD_FILES'; payload: UploadedFile[]}
  | {type: 'REMOVE_FILE'; payload: string}
  | {type: 'CLEAR_FILES'}
  | {type: 'UPDATE_SETTINGS'; payload: {fileId: string; settings: Partial<PrintSettings>}}
  | {type: 'ADD_ORDER'; payload: Order}
  | {type: 'RESET_FLOW'};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_FILES': {
      const newSettings = {...state.fileSettings};
      action.payload.forEach(f => {
        if (!newSettings[f.id]) newSettings[f.id] = {...defaultSettings};
      });
      return {...state, files: [...state.files, ...action.payload], fileSettings: newSettings};
    }
    case 'REMOVE_FILE': {
      const {[action.payload]: _, ...rest} = state.fileSettings;
      return {...state, files: state.files.filter(f => f.id !== action.payload), fileSettings: rest};
    }
    case 'CLEAR_FILES':
      return {...state, files: [], fileSettings: {}};
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        fileSettings: {
          ...state.fileSettings,
          [action.payload.fileId]: {...state.fileSettings[action.payload.fileId], ...action.payload.settings},
        },
      };
    case 'ADD_ORDER':
      return {...state, orders: [action.payload, ...state.orders]};
    case 'RESET_FLOW':
      return {...state, files: [], fileSettings: {}};
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
  updateFileSettings: (fileId: string, settings: Partial<PrintSettings>) => void;
  getFilesWithSettings: () => FileWithSettings[];
  getOrderSummary: () => {items: FileWithSettings[]; subtotal: number; fee: number; total: number};
  createOrder: () => Order;
  resetFlow: () => void;
}

const PrintJobContext = createContext<ContextValue | null>(null);

export function PrintJobProvider({children}: {children: React.ReactNode}) {
  const [state, dispatch] = useReducer(reducer, {
    files: [],
    fileSettings: {},
    orders: getMockOrders(),
  });

  const addFiles = useCallback((files: UploadedFile[]) => dispatch({type: 'ADD_FILES', payload: files}), []);
  const removeFile = useCallback((id: string) => dispatch({type: 'REMOVE_FILE', payload: id}), []);
  const clearFiles = useCallback(() => dispatch({type: 'CLEAR_FILES'}), []);
  const updateFileSettings = useCallback((fileId: string, settings: Partial<PrintSettings>) =>
    dispatch({type: 'UPDATE_SETTINGS', payload: {fileId, settings}}), []);
  const resetFlow = useCallback(() => dispatch({type: 'RESET_FLOW'}), []);

  const getFilesWithSettings = useCallback((): FileWithSettings[] => {
    return state.files.map(file => {
      const s = state.fileSettings[file.id] || defaultSettings;
      const price = calculateFilePrice(file.pages, s.colorMode, s.paperSize, s.sides, s.copies, s.pagesPerSheet);
      return {file, settings: s, price};
    });
  }, [state.files, state.fileSettings]);

  const getOrderSummary = useCallback(() => {
    const items = getFilesWithSettings();
    const subtotal = items.reduce((sum, i) => sum + i.price, 0);
    const fee = calculateConvenienceFee(subtotal);
    return {items, subtotal, fee, total: Math.round((subtotal + fee) * 100) / 100};
  }, [getFilesWithSettings]);

  const createOrder = useCallback((): Order => {
    const {items, fee, total} = getOrderSummary();
    const totalPages = items.reduce((sum, i) => sum + i.file.pages, 0);
    const totalCopies = items.reduce((sum, i) => sum + i.settings.copies, 0);
    const order: Order = {
      id: generateId(),
      orderRef: generateOrderRef().replace('#PRN', 'ORD'),
      createdAt: new Date().toISOString(),
      files: items,
      totalPrice: total,
      convenienceFee: fee,
      status: 'pending',
      printerNumber: String(Math.floor(Math.random() * 15) + 1).padStart(2, '0'),
      printerName: 'Default Printer',
      totalPages,
      totalCopies,
      progress: 0,
      estimatedCompletion: new Date(Date.now() + 60 * 60000).toISOString(),
    };
    dispatch({type: 'ADD_ORDER', payload: order});
    dispatch({type: 'RESET_FLOW'});
    return order;
  }, [getOrderSummary]);

  const value = useMemo(() => ({
    files: state.files,
    fileSettings: state.fileSettings,
    orders: state.orders,
    addFiles, removeFile, clearFiles, updateFileSettings,
    getFilesWithSettings, getOrderSummary, createOrder, resetFlow,
  }), [state.files, state.fileSettings, state.orders, addFiles, removeFile, clearFiles,
    updateFileSettings, getFilesWithSettings, getOrderSummary, createOrder, resetFlow]);

  return <PrintJobContext.Provider value={value}>{children}</PrintJobContext.Provider>;
}

export function usePrintJob(): ContextValue {
  const ctx = useContext(PrintJobContext);
  if (!ctx) throw new Error('usePrintJob must be used within PrintJobProvider');
  return ctx;
}
