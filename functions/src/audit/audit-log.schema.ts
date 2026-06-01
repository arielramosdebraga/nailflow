/* eslint-disable require-jsdoc */
export type AuditSource = "callable" | "trigger" | "scheduler" | "manual";

export interface AuditLogInput {
  userId: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  salonId?: string | null;
  source: AuditSource;
  ipAddress?: string | null;
  metadata?: Record<string, unknown>;
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

export function parseAuditLogInput(input: AuditLogInput): {
  userId: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string | null;
  salonId: string | null;
  source: AuditSource;
  ipAddress: string | null;
  metadata: Record<string, unknown>;
} {
  const userId = normalizeString(input.userId);
  const action = normalizeString(input.action);
  const targetType = normalizeString(input.targetType);

  if (!userId) {
    throw new Error("Audit log invalido: userId obrigatorio.");
  }

  if (!action) {
    throw new Error("Audit log invalido: action obrigatoria.");
  }

  if (!targetType) {
    throw new Error("Audit log invalido: targetType obrigatorio.");
  }

  const actorRole = normalizeString(input.actorRole) ?? "unknown";
  const targetId = normalizeString(input.targetId);
  const salonId = normalizeString(input.salonId);
  const ipAddress = normalizeString(input.ipAddress);
  const metadata =
    typeof input.metadata === "object" && input.metadata !== null ?
      input.metadata :
      {};

  return {
    userId,
    actorRole,
    action,
    targetType,
    targetId,
    salonId,
    source: input.source,
    ipAddress,
    metadata,
  };
}
