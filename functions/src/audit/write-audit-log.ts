/* eslint-disable require-jsdoc */
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {AuditLogInput, parseAuditLogInput} from "./audit-log.schema";

const AUDIT_LOGS_COLLECTION = "auditLogs";

export async function writeAuditLog(input: AuditLogInput): Promise<string> {
  const parsed = parseAuditLogInput(input);

  const logRef = await getFirestore().collection(AUDIT_LOGS_COLLECTION).add({
    userId: parsed.userId,
    actorRole: parsed.actorRole,
    action: parsed.action,
    targetType: parsed.targetType,
    targetId: parsed.targetId,
    salonId: parsed.salonId,
    source: parsed.source,
    ipAddress: parsed.ipAddress,
    metadata: parsed.metadata,
    timestamp: FieldValue.serverTimestamp(),
  });

  return logRef.id;
}
