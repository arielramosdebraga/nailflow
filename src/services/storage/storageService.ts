import { assertFirebaseConfigured, storage } from '@/services/firebase';
import {
  getDownloadURL,
  ref,
  uploadBytes,
  type UploadMetadata,
  type UploadResult,
} from 'firebase/storage';

const DEFAULT_STORAGE_FOLDER = 'uploads';

type UploadableBinary = Blob | Uint8Array | ArrayBuffer;

export interface UploadSalonUserFileParams {
  salonId: string;
  userId: string;
  fileName: string;
  data: UploadableBinary;
  folder?: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface UploadSalonUserFileFromUriParams {
  salonId: string;
  userId: string;
  fileUri: string;
  fileName?: string;
  folder?: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface UploadedStorageFile {
  path: string;
  name: string;
  downloadURL: string;
  contentType: string | null;
}

function sanitizePathSegment(rawValue: string, fallback: string): string {
  const sanitized = rawValue.trim().replace(/[^a-zA-Z0-9_.-]/g, '-').replace(/-+/g, '-');
  return sanitized.length > 0 ? sanitized : fallback;
}

function normalizeFolder(folder?: string): string {
  if (!folder?.trim()) {
    return DEFAULT_STORAGE_FOLDER;
  }

  const segments = folder
    .split('/')
    .map((segment) => sanitizePathSegment(segment, 'segment'))
    .filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    return DEFAULT_STORAGE_FOLDER;
  }

  return segments.join('/');
}

function deriveFileNameFromUri(fileUri: string): string {
  const [withoutQueryString] = fileUri.split('?');
  const segments = withoutQueryString?.split('/') ?? [];
  const rawFileName = segments[segments.length - 1] ?? 'arquivo';

  return sanitizePathSegment(rawFileName, 'arquivo');
}

function buildStoragePath(params: {
  salonId: string;
  userId: string;
  folder?: string;
  fileName: string;
}): string {
  const safeSalonId = sanitizePathSegment(params.salonId, 'salon');
  const safeUserId = sanitizePathSegment(params.userId, 'user');
  const safeFolder = normalizeFolder(params.folder);
  const safeFileName = sanitizePathSegment(params.fileName, 'arquivo');
  const uniquePrefix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return `salons/${safeSalonId}/users/${safeUserId}/${safeFolder}/${uniquePrefix}-${safeFileName}`;
}

function toUploadMetadata(params: {
  contentType?: string;
  metadata?: Record<string, string>;
}): UploadMetadata | undefined {
  const metadata: UploadMetadata = {};

  if (params.contentType?.trim()) {
    metadata.contentType = params.contentType.trim();
  }

  if (params.metadata && Object.keys(params.metadata).length > 0) {
    metadata.customMetadata = params.metadata;
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

function mapUploadResult(result: UploadResult): Promise<UploadedStorageFile> {
  return getDownloadURL(result.ref).then((downloadURL) => ({
    path: result.ref.fullPath,
    name: result.metadata.name ?? result.ref.name,
    downloadURL,
    contentType: result.metadata.contentType ?? null,
  }));
}

export async function uploadSalonUserFileAsync(
  params: UploadSalonUserFileParams
): Promise<UploadedStorageFile> {
  assertFirebaseConfigured();
  if (!storage) {
    throw new Error('Servico de storage indisponivel.');
  }

  const path = buildStoragePath({
    salonId: params.salonId,
    userId: params.userId,
    folder: params.folder,
    fileName: params.fileName,
  });

  const targetRef = ref(storage, path);
  const uploadResult = await uploadBytes(
    targetRef,
    params.data,
    toUploadMetadata({ contentType: params.contentType, metadata: params.metadata })
  );

  return mapUploadResult(uploadResult);
}

export async function uploadSalonUserFileFromUriAsync(
  params: UploadSalonUserFileFromUriParams
): Promise<UploadedStorageFile> {
  const normalizedUri = params.fileUri.trim();
  if (!normalizedUri) {
    throw new Error('Arquivo invalido para upload.');
  }

  const response = await fetch(normalizedUri);
  if (!response.ok) {
    throw new Error('Nao foi possivel carregar o arquivo local para upload.');
  }

  const blob = await response.blob();
  const fileName = params.fileName?.trim() || deriveFileNameFromUri(normalizedUri);

  return uploadSalonUserFileAsync({
    salonId: params.salonId,
    userId: params.userId,
    fileName,
    data: blob,
    folder: params.folder,
    contentType: params.contentType ?? response.headers.get('content-type') ?? undefined,
    metadata: params.metadata,
  });
}
