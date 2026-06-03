/* eslint-disable require-jsdoc */
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {
  AuditLogInput,
  AuditMetadata,
  WriteAuditLogInput,
  parseAuditLogInput,
  parseWriteAuditLogInput,
} from "./audit-log.schema";

const SENSITIVE_KEY_PATTERN =
  /(password|passwd|token|secret|authorization|cookie|session|refresh|cpf|cnpj|email|phone)/i;
const REDACTED_VALUE = "[REDACTED]";

interface PersistedAuditLogPayload {
  userId: string;
  userRole: string;
  action: string;
  targetType: string;
  targetId: string | null;
  salonId?: string | null;
  source?: string | null;
  metadata: AuditMetadata;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
}

function sanitizeMetadata(metadata: AuditMetadata): AuditMetadata {
  const sanitizedMetadata: AuditMetadata = {};

  for (const [rawKey, rawValue] of Object.entries(metadata)) {
    const key = rawKey.trim();

    if (!key) {
      continue;
    }

    if (SENSITIVE_KEY_PATTERN.test(key)) {
      sanitizedMetadata[key] = REDACTED_VALUE;
      continue;
    }

    sanitizedMetadata[key] = rawValue;
  }

  return sanitizedMetadata;
}

function normalizeAuditPayload(
  input: WriteAuditLogInput | AuditLogInput
): PersistedAuditLogPayload {
  if ("requestMetadata" in input || "userRole" in input) {
    const payload = parseWriteAuditLogInput(input);
    return {
      userId: payload.userId,
      userRole: payload.userRole,
      action: payload.action,
      targetType: payload.targetType,
      targetId: payload.targetId,
      metadata: sanitizeMetadata(payload.metadata ?? {}),
      ipAddress: payload.requestMetadata.ipAddress,
      userAgent: payload.requestMetadata.userAgent,
      requestId: payload.requestMetadata.requestId,
    };
  }

  const payload = parseAuditLogInput(input);

  return {
    userId: payload.userId,
    userRole: payload.actorRole,
    action: payload.action,
    targetType: payload.targetType,
    targetId: payload.targetId,
    salonId: payload.salonId,
    source: payload.source,
    metadata: sanitizeMetadata(payload.metadata),
    ipAddress: payload.ipAddress,
    userAgent: null,
    requestId: null,
  };
}

export async function writeAuditLog(
  input: WriteAuditLogInput | AuditLogInput
): Promise<string> {
  const payload = normalizeAuditPayload(input);
  const auditLogRef = getFirestore().collection("auditLogs").doc();

  await auditLogRef.set({
    userId: payload.userId,
    userRole: payload.userRole,
    action: payload.action,
    targetType: payload.targetType,
    targetId: payload.targetId,
    salonId: payload.salonId ?? null,
    source: payload.source ?? null,
    metadata: payload.metadata,
    ipAddress: payload.ipAddress,
    userAgent: payload.userAgent,
    requestId: payload.requestId,
    timestamp: FieldValue.serverTimestamp(),
  });

  return auditLogRef.id;
}
