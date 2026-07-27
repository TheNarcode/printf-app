import { uploadFile } from './api';

type TokenGetter = () => Promise<string | null>;
export type UploadStatus = 'pending' | 'done' | 'error';

interface UploadEntry {
  status: UploadStatus;
  fileId: string | null;
  error: string | null;
  attempts: number;
  uri: string;
  name: string;
  type: string;
  cancelFn?: () => void;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [2000, 4000, 8000];

const uploads = new Map<string, UploadEntry>();

async function doUpload(
  id: string,
  getToken: TokenGetter,
  attempt: number,
): Promise<void> {
  const entry = uploads.get(id);
  if (!entry) return;

  try {
    const token = await getToken();
    if (!token) throw new Error('No auth token');
    const { fileId } = await uploadFile(
      entry.uri,
      entry.name,
      entry.type,
      token,
      (task) => {
        entry.cancelFn = () => {
          try {
            task.cancel();
          } catch {
          }
        };
      }
    );
    entry.fileId = fileId;
    entry.status = 'done';
    entry.error = null;
  } catch (err: any) {
    if (err.message === 'cancelled') return; 
    const msg = err instanceof Error ? err.message : String(err);
    entry.attempts = attempt + 1;
    if (attempt < MAX_RETRIES - 1) {
      setTimeout(() => doUpload(id, getToken, attempt + 1), RETRY_DELAYS_MS[attempt]);
    } else {
      entry.status = 'error';
      entry.error = msg;
    }
  }
}

export function startUploads(
  files: { id: string; uri: string; name: string; type: string }[],
  getToken: TokenGetter,
): void {
  for (const file of files) {
    if (uploads.has(file.id)) continue;
    const entry: UploadEntry = {
      status: 'pending',
      fileId: null,
      error: null,
      attempts: 0,
      uri: file.uri,
      name: file.name,
      type: file.type,
    };
    uploads.set(file.id, entry);
    doUpload(file.id, getToken, 0);
  }
}

export function retryFailed(
  files: { id: string; uri: string; name: string; type: string }[],
  getToken: TokenGetter,
): void {
  for (const f of files) {
    const entry = uploads.get(f.id);
    if (entry && entry.status === 'error') {
      entry.status = 'pending';
      entry.error = null;
      entry.attempts = 0;
      doUpload(f.id, getToken, 0);
    }
  }
}

export function getStatuses(): Record<string, UploadStatus> {
  const out: Record<string, UploadStatus> = {};
  for (const [id, entry] of uploads.entries()) {
    out[id] = entry.status;
  }
  return out;
}

export function getFileId(localFileId: string): string {
  const entry = uploads.get(localFileId);
  if (!entry || entry.status !== 'done' || !entry.fileId) {
    throw new Error(`Upload not complete for file ${localFileId}`);
  }
  return entry.fileId;
}

export function resetUploads(): void {
  for (const entry of uploads.values()) {
    if (entry.cancelFn) entry.cancelFn();
  }
  uploads.clear();
}