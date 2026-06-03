import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  where,
} from 'firebase/firestore';
import { z } from 'zod';

import {
  AuditLogActionSchema,
  AuditLogSchema,
  AuditLogTargetIdSchema,
  AuditLogTargetTypeSchema,
  type AuditLog,
} from '@/schemas/audit/audit-log.schema';
import { assertFirebaseConfigured, db } from '@/services/firebase';

function isIsoDateTime(value: string): boolean {
  const parsedTimestamp = Date.parse(value);
  return Number.isFinite(parsedTimestamp);
}

const AuditLogListFiltersSchema = z
  .object({
    userId: z.string().trim().min(1).max(120).optional(),
    targetId: AuditLogTargetIdSchema.optional(),
    action: AuditLogActionSchema.optional(),
    targetType: AuditLogTargetTypeSchema.optional(),
    dateFrom: z.string().refine(isIsoDateTime, 'Periodo inicial invalido.').optional(),
    dateTo: z.string().refine(isIsoDateTime, 'Periodo final invalido.').optional(),
    limit: z.number().int().min(1).max(100).default(25),
    order: z.enum(['asc', 'desc']).default('desc'),
  })
  .refine(
    (payload) => {
      if (!payload.dateFrom || !payload.dateTo) {
        return true;
      }

      return new Date(payload.dateFrom).getTime() <= new Date(payload.dateTo).getTime();
    },
    {
      message: 'A data inicial deve ser menor ou igual a data final.',
      path: ['dateFrom'],
    }
  );

export interface ListAuditLogsParams {
  userId?: string;
  targetId?: string;
  action?: string;
  targetType?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  order?: 'asc' | 'desc';
}

type ValidatedAuditLogFilters = z.infer<typeof AuditLogListFiltersSchema>;

function toIsoDateTime(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === 'string' && Number.isFinite(Date.parse(value))) {
    return new Date(value).toISOString();
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const maybeTimestamp = value as { toDate: () => Date };
    const convertedDate = maybeTimestamp.toDate();
    if (convertedDate instanceof Date && Number.isFinite(convertedDate.getTime())) {
      return convertedDate.toISOString();
    }
  }

  throw new Error('Timestamp invalido em audit log.');
}

function sanitizeMetadata(value: unknown): Record<string, string | number | boolean | null> {
  if (typeof value !== 'object' || value === null) {
    return {};
  }

  const metadata = value as Record<string, unknown>;
  const sanitized: Record<string, string | number | boolean | null> = {};

  for (const [key, rawValue] of Object.entries(metadata)) {
    if (!key.trim()) {
      continue;
    }

    if (typeof rawValue === 'string' || typeof rawValue === 'number' || typeof rawValue === 'boolean') {
      sanitized[key] = rawValue;
      continue;
    }

    if (rawValue === null) {
      sanitized[key] = null;
    }
  }

  return sanitized;
}

function mapAuditLogSnapshot(snapshot: QueryDocumentSnapshot<DocumentData>): AuditLog {
  const data = snapshot.data();
  const parsed = AuditLogSchema.safeParse({
    id: snapshot.id,
    userId: typeof data.userId === 'string' ? data.userId : '',
    userRole: typeof data.userRole === 'string' ? data.userRole : '',
    action: typeof data.action === 'string' ? data.action : '',
    targetType: typeof data.targetType === 'string' ? data.targetType : '',
    targetId: typeof data.targetId === 'string' ? data.targetId : '',
    metadata: sanitizeMetadata(data.metadata),
    ipAddress: typeof data.ipAddress === 'string' ? data.ipAddress : null,
    userAgent: typeof data.userAgent === 'string' ? data.userAgent : null,
    requestId: typeof data.requestId === 'string' ? data.requestId : null,
    timestamp: toIsoDateTime(data.timestamp),
  });

  if (!parsed.success) {
    throw new Error('Documento de auditoria com formato invalido.');
  }

  return parsed.data;
}

function buildBaseQueryConstraints(filters: ValidatedAuditLogFilters): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];

  if (filters.userId) {
    constraints.push(where('userId', '==', filters.userId));
  } else if (filters.targetId) {
    constraints.push(where('targetId', '==', filters.targetId));
  }

  if (filters.dateFrom) {
    constraints.push(where('timestamp', '>=', Timestamp.fromDate(new Date(filters.dateFrom))));
  }

  if (filters.dateTo) {
    constraints.push(where('timestamp', '<=', Timestamp.fromDate(new Date(filters.dateTo))));
  }

  constraints.push(orderBy('timestamp', filters.order));
  constraints.push(limit(filters.limit));

  return constraints;
}

function applyClientSideFilters(logs: AuditLog[], filters: ValidatedAuditLogFilters): AuditLog[] {
  const normalizedAction = filters.action?.toLowerCase() ?? '';
  const normalizedTargetType = filters.targetType?.toLowerCase() ?? '';

  return logs.filter((log) => {
    if (filters.userId && log.userId !== filters.userId) {
      return false;
    }

    if (filters.targetId && log.targetId !== filters.targetId) {
      return false;
    }

    if (normalizedAction && !log.action.toLowerCase().includes(normalizedAction)) {
      return false;
    }

    if (normalizedTargetType && !log.targetType.toLowerCase().includes(normalizedTargetType)) {
      return false;
    }

    return true;
  });
}

export async function listAuditLogs(params?: ListAuditLogsParams): Promise<AuditLog[]> {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponivel.');
  }

  const filters = AuditLogListFiltersSchema.parse({
    userId: params?.userId?.trim() || undefined,
    targetId: params?.targetId?.trim() || undefined,
    action: params?.action?.trim() || undefined,
    targetType: params?.targetType?.trim() || undefined,
    dateFrom: params?.dateFrom,
    dateTo: params?.dateTo,
    limit: params?.limit,
    order: params?.order,
  });

  const constraints = buildBaseQueryConstraints(filters);
  const logsQuery = query(collection(db, 'auditLogs'), ...constraints);
  const snapshot = await getDocs(logsQuery);
  const mappedLogs = snapshot.docs.map((item) => mapAuditLogSnapshot(item));

  return applyClientSideFilters(mappedLogs, filters);
}
