import { PDFDocument } from 'pdf-lib';
import ReactNativeBlobUtil from 'react-native-blob-util';
import type { PrintSettings } from '../types';

export async function getSafePreviewUri(uri: string): Promise<string> {
  try {
    const realUri = uri.replace('file://', '');
    if (realUri.startsWith('content://')) {
      const dest = `${
        ReactNativeBlobUtil.fs.dirs.CacheDir
      }/safe_${Date.now()}.pdf`;
      // We must copy the file out of scoped storage for react-native-pdf to read it reliably on modern Android
      await ReactNativeBlobUtil.fs.cp(realUri, dest);
      return `file://${dest}`;
    }
    return uri;
  } catch (error) {
    console.error('Failed to create safe preview URI:', error);
    return uri;
  }
}

export async function generatePreviewPdf(
  uri: string,
  settings: PrintSettings,
): Promise<string | null> {
  try {
    const realUri = uri.replace('file://', '');

    // Attempt to read the file. This will fail safely (catch block) if it's a mock file, preventing a native crash!
    let pdfBytesBase64: string;
    try {
      pdfBytesBase64 = await ReactNativeBlobUtil.fs.readFile(realUri, 'base64');
    } catch {
      console.warn(
        'Could not read local file (likely a mock URI). Generating blank PDF for preview.',
      );
      // Create a dummy 5-page PDF for preview purposes
      const dummyDoc = await PDFDocument.create();
      for (let i = 0; i < 5; i++) {
        const page = dummyDoc.addPage();
        page.drawText(
          `Mock Document Preview\nPage ${
            i + 1
          }\n\nActual file not found on device.`,
          { x: 50, y: 700, size: 24 },
        );
      }
      pdfBytesBase64 = await dummyDoc.saveAsBase64();
    }

    const pdfDoc = await PDFDocument.load(pdfBytesBase64);
    const totalPages = pdfDoc.getPageCount();

    // 1. Filter by pageRange
    let pagesToKeep: number[] = [];
    if (settings.pageRange && settings.pageRange !== 'all') {
      const parts = settings.pageRange.split(',');
      for (const part of parts) {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(n => parseInt(n.trim(), 10));
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= totalPages) pagesToKeep.push(i - 1);
          }
        } else {
          const p = parseInt(part.trim(), 10);
          if (p >= 1 && p <= totalPages) pagesToKeep.push(p - 1);
        }
      }
    }

    // Default to keeping all pages if parsing failed or no range
    if (pagesToKeep.length === 0) {
      for (let i = 0; i < totalPages; i++) pagesToKeep.push(i);
    }

    // We can also simulate "pagesPerSheet" by rendering scaled pages, but for now we just filter the pages.
    // N-up generation in pure JS is complex math, so we stick to page subsets.

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdfDoc, pagesToKeep);
    copiedPages.forEach(p => newPdf.addPage(p));

    const finalBase64 = await newPdf.saveAsBase64();
    const tempPath = `${
      ReactNativeBlobUtil.fs.dirs.CacheDir
    }/preview_${Date.now()}.pdf`;
    await ReactNativeBlobUtil.fs.writeFile(tempPath, finalBase64, 'base64');

    return `file://${tempPath}`;
  } catch (error) {
    console.error('Failed to generate preview PDF:', error);
    return null;
  }
}
