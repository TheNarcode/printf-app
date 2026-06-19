import { uploadFile } from './api';

// ── Background File Upload Manager ─────────────────────────────────
// Starts uploading files as soon as the user taps "Continue" on the
// Upload screen, so they're ready by the time Payment is reached.

type TokenGetter = () => Promise<string | null>;

interface UploadEntry {
  promise: Promise<string>;
  fileId: string | null;
}

const uploads = new Map<string, UploadEntry>();

/**
 * Kick off background uploads for all files.
 * Safe to call multiple times — already-started files are skipped.
 */
export function startUploads(
  files: { id: string; uri: string; name: string; type: string }[],
  getToken: TokenGetter,
) {
  for (const file of files) {
    if (uploads.has(file.id)) continue; // already in progress or done

    const entry: UploadEntry = { promise: null as any, fileId: null };

    entry.promise = (async () => {
      const token = await getToken();
      if (!token) throw new Error('No auth token for file upload');
      const { fileId } = await uploadFile(file.uri, file.name, file.type, token);
      entry.fileId = fileId;
      return fileId;
    })();

    uploads.set(file.id, entry);
  }
}

/**
 * Get the server fileId for a local file.
 * If the upload is still in progress, this awaits it.
 * If already done, it resolves instantly.
 */
export async function getFileId(localFileId: string): Promise<string> {
  const entry = uploads.get(localFileId);
  if (!entry) {
    throw new Error(`No upload started for file ${localFileId}`);
  }
  return entry.promise;
}

/**
 * Check if all uploads have completed successfully.
 */
export function isAllReady(): boolean {
  for (const entry of uploads.values()) {
    if (entry.fileId === null) return false;
  }
  return uploads.size > 0;
}

/**
 * Clear all cached uploads (call when flow is reset).
 */
export function resetUploads() {
  uploads.clear();
}
