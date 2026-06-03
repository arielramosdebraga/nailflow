/* eslint-disable require-jsdoc */
import {HttpsError} from "firebase-functions/v2/https";
import {UserRole} from "../shared/user-context";

const USER_ROLES: ReadonlySet<string> = new Set([
  "super_admin",
  "salon_owner",
  "nail_technician",
  "manicure",
]);

const AUDIT_ACTION_PATTERN = /^[a-z0-9_.:-]+$/;
const AUDIT_TARGET_PATTERN = /^[a-z0-9_.:-]+$/;

const MAX_USER_ID_LENGTH = 120;
const MAX_ACTION_LENGTH = 80;
const MAX_TARGET_TYPE_LENGTH = 64;
const MAX_TARGET_ID_LENGTH = 120;
const MAX_SALON_ID_LENGTH = 120;
const MAX_METADATA_ENTRIES = 50;
const MAX_METADATA_KEY_LENGTH = 64;
const MAX_METADATA_STRING_LENGTH = 500;
const MAX_IP_LENGTH = 128;
const MAX_USER_AGENT_LENGTH = 512;
const MAX_REQUEST_ID_LENGTH = 120;

export type AuditSource = "callable" | "trigger" | "scheduler" | "manual";
export type AuditMetadataValue = string | number | boolean | null;
export type AuditMetadata = Record<string, AuditMetadataValue>;

export interface AuditRequestMetadata {
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
}

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

export interface ParsedAuditLogInput {
  userId: string;
  actorRole: UserRole;
  action: string;
  targetType: string;
  targetId: string | null;
  salonId: string | null;
  source: AuditSource;
  ipAddress: string | null;
  metadata: AuditMetadata;
}

export interface WriteAuditLogInput {
  userId: string;
  userRole: UserRole;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: AuditMetadata;
  requestMetadata: AuditRequestMetadata;
}

function assertNonEmptyString(
  value: unknown,
  fieldName: string,
  maxLength: number
): string {
  if (typeof value !== "string") {
    throw new HttpsError(
      "invalid-argument",
      `${fieldName} precisa ser string nao vazia.`
    );
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new HttpsError(
      "invalid-argument",
      `${fieldName} precisa ser string nao vazia.`
    );
  }

  if (trimmedValue.length > maxLength) {
    throw new HttpsError(
      "invalid-argument",
      `${fieldName} excede o limite permitido de tamanho.`
    );
  }

  return trimmedValue;
}

function assertOptionalString(
  value: unknown,
  fieldName: string,
  maxLength: number
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return assertNonEmptyString(value, fieldName, maxLength);
}

function assertUserRole(value: unknown, fieldName = "userRole"): UserRole {
  if (typeof value !== "string" || !USER_ROLES.has(value)) {
    throw new HttpsError("invalid-argument", `${fieldName} invalido para audit log.`);
  }

  return value as UserRole;
}

function assertAction(value: unknown): string {
  const action = assertNonEmptyString(value, "action", MAX_ACTION_LENGTH);

  if (action.length < 3 || !AUDIT_ACTION_PATTERN.test(action)) {
    throw new HttpsError("invalid-argument", "action invalida para audit log.");
  }

  return action;
}

function assertTargetType(value: unknown): string {
  const targetType = assertNonEmptyString(
    value,
    "targetType",
    MAX_TARGET_TYPE_LENGTH
  );

  if (targetType.length < 2 || !AUDIT_TARGET_PATTERN.test(targetType)) {
    throw new HttpsError("invalid-argument", "targetType invalido para audit log.");
  }

  return targetType;
}

function assertTargetId(value: unknown): string {
  return assertNonEmptyString(value, "targetId", MAX_TARGET_ID_LENGTH);
}

function assertAuditSource(value: unknown): AuditSource {
  if (
    value === "callable" ||
    value === "trigger" ||
    value === "scheduler" ||
    value === "manual"
  ) {
    return value;
  }

  throw new HttpsError("invalid-argument", "source invalido para audit log.");
}

function assertMetadataValue(
  value: unknown,
  key: string
): AuditMetadataValue {
  if (value === null) {
    return null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new HttpsError(
        "invalid-argument",
        `metadata.${key} possui numero invalido.`
      );
    }

    return value;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();

    if (trimmedValue.length > MAX_METADATA_STRING_LENGTH) {
      throw new HttpsError(
        "invalid-argument",
        `metadata.${key} excede o limite permitido de tamanho.`
      );
    }

    return trimmedValue;
  }

  throw new HttpsError(
    "invalid-argument",
    `metadata.${key} possui tipo nao suportado.`
  );
}

function assertMetadata(value: unknown): AuditMetadata {
  if (value === undefined || value === null) {
    return {};
  }

  if (typeof value !== "object") {
    throw new HttpsError("invalid-argument", "metadata deve ser um objeto.");
  }

  const entries = Object.entries(value as Record<string, unknown>);

  if (entries.length > MAX_METADATA_ENTRIES) {
    throw new HttpsError(
      "invalid-argument",
      "metadata excede a quantidade maxima de chaves permitidas."
    );
  }

  const normalizedMetadata: AuditMetadata = {};

  for (const [key, rawValue] of entries) {
    const normalizedKey = assertNonEmptyString(
      key,
      "metadata key",
      MAX_METADATA_KEY_LENGTH
    );
    normalizedMetadata[normalizedKey] = assertMetadataValue(
      rawValue,
      normalizedKey
    );
  }

  return normalizedMetadata;
}

function assertRequestMetadata(value: unknown): AuditRequestMetadata {
  if (typeof value !== "object" || value === null) {
    throw new HttpsError(
      "invalid-argument",
      "requestMetadata deve ser um objeto para audit log."
    );
  }

  const data = value as Record<string, unknown>;

  return {
    ipAddress: assertOptionalString(data.ipAddress, "ipAddress", MAX_IP_LENGTH),
    userAgent: assertOptionalString(
      data.userAgent,
      "userAgent",
      MAX_USER_AGENT_LENGTH
    ),
    requestId: assertOptionalString(
      data.requestId,
      "requestId",
      MAX_REQUEST_ID_LENGTH
    ),
  };
}

function legacyRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} obrigatorio.`);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error(`${fieldName} obrigatorio.`);
  }

  return trimmedValue;
}

function legacyOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
}

export function parseAuditLogInput(input: AuditLogInput): ParsedAuditLogInput {
  return {
    userId: legacyRequiredString(input.userId, "userId"),
    actorRole: assertUserRole(legacyRequiredString(input.actorRole, "actorRole"), "actorRole"),
    action: legacyRequiredString(input.action, "action"),
    targetType: legacyRequiredString(input.targetType, "targetType"),
    targetId: legacyOptionalString(input.targetId),
    salonId: legacyOptionalString(input.salonId),
    source: assertAuditSource(input.source),
    ipAddress: legacyOptionalString(input.ipAddress),
    metadata: assertMetadata(input.metadata),
  };
}

export function parseWriteAuditLogInput(data: unknown): WriteAuditLogInput {
  if (typeof data !== "object" || data === null) {
    throw new HttpsError("invalid-argument", "Payload de audit log invalido.");
  }

  const payload = data as Record<string, unknown>;

  return {
    userId: assertNonEmptyString(payload.userId, "userId", MAX_USER_ID_LENGTH),
    userRole: assertUserRole(payload.userRole),
    action: assertAction(payload.action),
    targetType: assertTargetType(payload.targetType),
    targetId: assertTargetId(payload.targetId),
    metadata: assertMetadata(payload.metadata),
    requestMetadata: assertRequestMetadata(payload.requestMetadata),
  };
}

export function parseOptionalSalonId(value: unknown): string | null {
  return assertOptionalString(value, "salonId", MAX_SALON_ID_LENGTH);
}
