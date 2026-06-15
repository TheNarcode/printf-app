import {useCallback} from 'react';
import {Platform} from 'react-native';
import type {UploadedFile} from '../types';
import {estimatePageCount, generateId} from '../utils/formatters';

interface DocumentPickerResponse {
  uri: string;
  name: string | null;
  size: number | null;
  type: string | null;
}

/**
 * Hook for handling document picking using react-native-document-picker.
 * Falls back to mock files if the picker is not available.
 */
export function useFileUpload() {
  const pickFiles = useCallback(async (): Promise<UploadedFile[]> => {
    try {
      const {pick, types} = require('@react-native-documents/picker');
      const results: DocumentPickerResponse[] = await pick({
        type: [
          types.pdf,
          types.doc,
          types.docx,
          types.images,
        ],
        allowMultiSelection: true,
        copyTo: Platform.OS === 'android' ? 'cachesDirectory' : undefined,
      });

      return results.map(doc => ({
        id: generateId(),
        name: doc.name || 'Untitled',
        uri: doc.uri,
        size: doc.size || 0,
        type: doc.type || 'application/octet-stream',
        pages: estimatePageCount(doc.size || 0, doc.type || ''),
      }));
    } catch (err: any) {
      // User cancelled or picker not available
      if (err?.code === 'DOCUMENT_PICKER_CANCELED') {
        return [];
      }

      // Fallback: return mock files for demo
      console.log('Document picker not available, using mock files');
      return getMockFiles();
    }
  }, []);

  return {pickFiles};
}

function getMockFiles(): UploadedFile[] {
  return [
    {
      id: generateId(),
      name: 'project_report.pdf',
      uri: 'file:///mock/project_report.pdf',
      size: 662016, // ~646.5 KB
      type: 'application/pdf',
      pages: 8,
    },
    {
      id: generateId(),
      name: 'invoice_march.pdf',
      uri: 'file:///mock/invoice_march.pdf',
      size: 245760,
      type: 'application/pdf',
      pages: 4,
    },
    {
      id: generateId(),
      name: 'resume_final.pdf',
      uri: 'file:///mock/resume_final.pdf',
      size: 102400,
      type: 'application/pdf',
      pages: 1,
    },
  ];
}
