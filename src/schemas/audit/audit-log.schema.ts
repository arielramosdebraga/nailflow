import { z } from 'zod';

import { PersistedUserRoleSchema } from '@/schemas/users/user.schema';

const AUDIT_ACTION_PATTERN = /^[a-z0-9_.:-]+$/;
const AUDIT_TARGET_PATTERN = /^[a-z0-9_.:-]+$/;

function isIsoDateTime(value: string): boolean {
  const parsedTimestamp = Date.parse(value);
  return Number.isFinite(parsedTimestamp);
}

export const AuditLogIdSchema = z.string().trim().min(1).max(120);

export const AuditLogActionSchema = z
  .string()
  .trim()
  .min(3, 'Informe a acao de auditoria.')
  .max(80, 'A acao de auditoria deve ter no maximo 80 caracteres.')
  .regex(AUDIT_ACTION_PATTERN, 'A acao de auditoria possui caracteres invalidos.');

export const AuditLogTargetTypeSchema = z
  .string()
  .trim()
  .min(2, 'Informe o tipo do alvo da auditoria.')
  .max(64, 'O tipo do alvo deve ter no maximo 64 caracteres.')
  .regex(AUDIT_TARGET_PATTERN, 'O tipo do alvo possui caracteres invalidos.');

export const AuditLogTargetIdSchema = z.string().trim().min(1).max(120);

export const AuditLogMetadataSchema = z
  .record(z.string().trim().min(1).max(64), z.union([z.string(), z.number(), z.boolean(), z.null()]))
  .default({});

export const AuditLogSchema = z.object({
  id: AuditLogIdSchema,
  userId: z.string().trim().min(1).max(120),
  userRole: PersistedUserRoleSchema,
  action: AuditLogActionSchema,
  targetType: AuditLogTargetTypeSchema,
  targetId: AuditLogTargetIdSchema,
  metadata: AuditLogMetadataSchema,
  ipAddress: z.string().trim().min(1).max(128).nullable(),
  userAgent: z.string().trim().min(1).max(512).nullable(),
  requestId: z.string().trim().min(1).max(120).nullable(),
  timestamp: z.string().refine(isIsoDateTime, 'Timestamp invalido para audit log.'),
});

export const CreateAuditLogInputSchema = z.object({
  userId: z.string().trim().min(1).max(120),
  userRole: PersistedUserRoleSchema,
  action: AuditLogActionSchema,
  targetType: AuditLogTargetTypeSchema,
  targetId: AuditLogTargetIdSchema,
  metadata: AuditLogMetadataSchema,
});

export type AuditLog = z.infer<typeof AuditLogSchema>;
export type CreateAuditLogInput = z.infer<typeof CreateAuditLogInputSchema>;
