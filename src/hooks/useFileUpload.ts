import {useCallback} from 'react';
import {Platform} from 'react-native';
import type {UploadedFile} from '../types';
import {generateId} from '../utils/formatters';
import {PDFDocument} from 'pdf-lib';
import ReactNativeBlobUtil from 'react-native-blob-util';

interface DocumentPickerResponse {
  uri: string;
  name: string | null;
  size: number | null;
  type: string | null;
}

/**
 * Read a PDF file and return the actual page count.
 * Falls back to 1 if parsing fails.
 */
async function getActualPageCount(uri: string, fileType: string): Promise<number> {
  // Images are always 1 page
  if (fileType.includes('image')) {
    return 1;
  }

  // Only parse PDFs
  if (!fileType.includes('pdf')) {
    return 1;
  }

  try {
    const filePath = uri.replace('file://', '');
    const base64 = await ReactNativeBlobUtil.fs.readFile(filePath, 'base64');
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const pdfDoc = await PDFDocument.load(bytes, {ignoreEncryption: true});
    return pdfDoc.getPageCount();
  } catch (err) {
    console.warn('Failed to parse PDF for page count:', err);
    return 1;
  }
}

/**
 * Hook for handling document picking using react-native-document-picker.
 */
export function useFileUpload() {
  const pickFiles = useCallback(async (): Promise<UploadedFile[]> => {
    try {
      const {pick, types} = require('@react-native-documents/picker');
      const results: DocumentPickerResponse[] = await pick({
        type: [
          types.pdf,
          types.images,
        ],
        allowMultiSelection: true,
        copyTo: Platform.OS === 'android' ? 'cachesDirectory' : undefined,
      });

      // Parse each file to get accurate page count
      const files: UploadedFile[] = [];
      for (const doc of results) {
        const pages = await getActualPageCount(
          doc.uri,
          doc.type || '',
        );
        files.push({
          id: generateId(),
          name: doc.name || 'Untitled',
          uri: doc.uri,
          size: doc.size || 0,
          type: doc.type || 'application/octet-stream',
          pages,
        });
      }

      return files;
    } catch (err: any) {
      // User cancelled
      if (err?.code === 'DOCUMENT_PICKER_CANCELED') {
        return [];
      }
      console.error('File picker error:', err);
      return [];
    }
  }, []);

  return {pickFiles};
}