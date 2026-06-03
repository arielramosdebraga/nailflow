/* eslint-disable require-jsdoc */
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {
  AuditMetadata,
  WriteAuditLogInput,
  parseWriteAuditLogInput,
} from "./audit-log.schema";

const SENSITIVE_KEY_PATTERN =
  /(password|passwd|token|secret|authorization|cookie|session|refresh|cpf|cnpj|email|phone)/i;
const REDACTED_VALUE = "[REDACTED]";

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

export async function writeAuditLog(input: WriteAuditLogInput): Promise<string> {
  const payload = parseWriteAuditLogInput(input);
  const metadata = sanitizeMetadata(payload.metadata ?? {});

  const auditLogRef = getFirestore().collection("auditLogs").doc();

  await auditLogRef.set({
    userId: payload.userId,
    userRole: payload.userRole,
    action: payload.action,
    targetType: payload.targetType,
    targetId: payload.targetId,
    metadata,
    ipAddress: payload.requestMetadata.ipAddress,
    userAgent: payload.requestMetadata.userAgent,
    requestId: payload.requestMetadata.requestId,
    timestamp: FieldValue.serverTimestamp(),
  });

  return auditLogRef.id;
}
