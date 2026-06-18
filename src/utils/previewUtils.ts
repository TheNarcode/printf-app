import ReactNativeBlobUtil from 'react-native-blob-util';

/**
 * Parse a page range string like "1-5, 8, 11-13" into an array of 0-indexed page numbers.
 * Returns all pages (0..totalPages-1) if rangeStr is 'all' or empty.
 */
export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr || rangeStr.trim() === '' || rangeStr.trim().toLowerCase() === 'all') {
    return Array.from({length: totalPages}, (_, i) => i);
  }

  const result: Set<number> = new Set();
  const parts = rangeStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr.trim(), 10);
      const end = parseInt(endStr.trim(), 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
          result.add(i - 1); // convert to 0-indexed
        }
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        result.add(p - 1);
      }
    }
  }

  const sorted = Array.from(result).sort((a, b) => a - b);
  return sorted.length > 0 ? sorted : Array.from({length: totalPages}, (_, i) => i);
}

/**
 * Get which page indices to display on a given "sheet" of paper.
 * E.g. with pagesPerSheet=4 and sheetIndex=1, returns pages[4..7].
 */
export function getSheetPages(allPages: number[], pagesPerSheet: number, sheetIndex: number): number[] {
  const start = sheetIndex * pagesPerSheet;
  return allPages.slice(start, start + pagesPerSheet);
}

/**
 * Total number of physical sheets needed to print all selected pages.
 */
export function getTotalSheets(allPages: number[], pagesPerSheet: number): number {
  return Math.max(1, Math.ceil(allPages.length / pagesPerSheet));
}

/**
 * Generate page thumbnail images from a PDF using react-native-pdf-thumbnail.
 * Returns an object mapping 0-indexed page numbers to image URIs.
 * Falls back gracefully if thumbnail generation fails for any page.
 */
export async function generatePdfThumbnails(
  uri: string,
  pageIndices: number[],
): Promise<Record<number, string>> {
  const thumbnails: Record<number, string> = {};

  let PdfThumbnail: any = null;
  try {
    PdfThumbnail = require('react-native-pdf-thumbnail').default;
  } catch (_) {
    console.warn('react-native-pdf-thumbnail not available');
    return thumbnails;
  }

  // Normalize the URI for the native module
  let filePath = uri;
  
  // Handle content:// URIs by copying to cache
  if (filePath.startsWith('content://')) {
    try {
      const dest = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/thumb_src_${Date.now()}.pdf`;
      await ReactNativeBlobUtil.fs.cp(filePath, dest);
      filePath = dest;
    } catch (e) {
      console.warn('Failed to copy content URI for thumbnails:', e);
      return thumbnails;
    }
  }

  // Strip file:// prefix if present — the native module expects a plain path
  filePath = filePath.replace(/^file:\/\//, '');

  // Generate thumbnails for each requested page
  for (const pageIdx of pageIndices) {
    try {
      const result = await PdfThumbnail.generate(filePath, pageIdx);
      if (result?.uri) {
        thumbnails[pageIdx] = result.uri;
      }
    } catch (e) {
      console.warn(`Failed to generate thumbnail for page ${pageIdx}:`, e);
      // Skip failed pages — we'll show a placeholder for them
    }
  }

  return thumbnails;
}
