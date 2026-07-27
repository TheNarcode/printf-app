import ReactNativeBlobUtil from 'react-native-blob-util';

/**
 * Parse a page range string like "1-5, 8, 11-13" into an array of 0-indexed page numbers.
 * Returns all pages (0..totalPages-1) if rangeStr is 'all' or empty.
 */
export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  if (
    !rangeStr ||
    rangeStr.trim() === '' ||
    rangeStr.trim().toLowerCase() === 'all'
  ) {
    return Array.from({ length: totalPages }, (_, i) => i);
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
        const from = Math.min(start, end);
        const to = Math.max(start, end);
        for (let i = Math.max(1, from); i <= Math.min(totalPages, to); i++) {
          result.add(i - 1);
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
  return sorted.length > 0
    ? sorted
    : Array.from({ length: totalPages }, (_, i) => i);
}

export function getSheetPages(
  allPages: number[],
  pagesPerSheet: number,
  sheetIndex: number,
): number[] {
  const safePps = Math.max(1, pagesPerSheet || 1);
  const safeIndex = Math.max(0, sheetIndex || 0);
  const start = safeIndex * safePps;
  return allPages.slice(start, start + safePps);
}

export function getTotalSheets(
  allPages: number[],
  pagesPerSheet: number,
): number {
  const safePps = Math.max(1, pagesPerSheet || 1);
  return Math.max(1, Math.ceil(allPages.length / safePps));
}

export async function generatePdfThumbnails(
  uri: string,
  pageIndices: number[],
): Promise<Record<number, string>> {
  const thumbnails: Record<number, string> = {};

  let PdfThumbnail: any = null;
  try {
    PdfThumbnail = require('react-native-pdf-thumbnail').default;
  } catch {
    return thumbnails;
  }

  let filePath = uri;
  let tempCopiedPath: string | null = null;

  if (filePath.startsWith('content://')) {
    try {
      const dest = `${
        ReactNativeBlobUtil.fs.dirs.CacheDir
      }/thumb_src_${Date.now()}.pdf`;
      await ReactNativeBlobUtil.fs.cp(filePath, dest);
      filePath = dest;
      tempCopiedPath = dest;
    } catch {
      return thumbnails;
    }
  }

  filePath = filePath.replace(/^file:\/\//, '');

  try {
    for (const pageIdx of pageIndices) {
      try {
        const result = await PdfThumbnail.generate(filePath, pageIdx);
        if (result?.uri) {
          thumbnails[pageIdx] = result.uri;
        }
      } catch {
        // Skip failed page render
      }
    }
  } finally {
    if (tempCopiedPath) {
      try {
        await ReactNativeBlobUtil.fs.unlink(tempCopiedPath);
      } catch {}
    }
  }

  return thumbnails;
}
