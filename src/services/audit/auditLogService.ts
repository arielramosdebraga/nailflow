import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type QueryConstraint,
} from 'firebase/firestore';

import { AuditLogSchema, type AuditLog } from '@/schemas/audit/audit-log.schema';
import { assertFirebaseConfigured, db } from '@/services/firebase';

interface ListAuditLogsParams {
  userId?: string;
  targetId?: string;
  limitCount?: number;
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return value;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    return value.toDate();
  }

  return null;
}

function mapAuditLogSnapshot(snapshot: DocumentSnapshot<DocumentData>): AuditLog {
  const data = snapshot.data();
  if (!data) {
    throw new Error('Log de auditoria nao encontrado.');
  }

  return AuditLogSchema.parse({
    id: snapshot.id,
    userId: typeof data.userId === 'string' ? data.userId : '',
    actorRole: typeof data.actorRole === 'string' ? data.actorRole : 'unknown',
    action: typeof data.action === 'string' ? data.action : '',
    targetType: typeof data.targetType === 'string' ? data.targetType : '',
    targetId: typeof data.targetId === 'string' ? data.targetId : null,
    salonId: typeof data.salonId === 'string' ? data.salonId : null,
    source: typeof data.source === 'string' ? data.source : 'manual',
    ipAddress: typeof data.ipAddress === 'string' ? data.ipAddress : null,
    metadata:
      typeof data.metadata === 'object' && data.metadata !== null
        ? data.metadata
        : {},
    timestamp: parseDate(data.timestamp),
  });
}

export async function listAuditLogs(params: ListAuditLogsParams = {}): Promise<AuditLog[]> {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponivel.');
  }

  const constraints: QueryConstraint[] = [];

  const normalizedUserId = params.userId?.trim() ?? '';
  if (normalizedUserId) {
    constraints.push(where('userId', '==', normalizedUserId));
  }

  const normalizedTargetId = params.targetId?.trim() ?? '';
  if (normalizedTargetId) {
    constraints.push(where('targetId', '==', normalizedTargetId));
  }

  constraints.push(orderBy('timestamp', 'desc'));
  constraints.push(limit(params.limitCount ?? 100));

  const logsQuery = query(collection(db, 'auditLogs'), ...constraints);
  const snapshot = await getDocs(logsQuery);

  return snapshot.docs.map((item) => mapAuditLogSnapshot(item));
}
