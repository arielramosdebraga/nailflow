import { z } from 'zod';

import {
  AuditLogActionSchema,
  AuditLogTargetIdSchema,
  AuditLogTargetTypeSchema,
} from '@/schemas/audit/audit-log.schema';

function isIsoDateTime(value: string): boolean {
  const parsedTimestamp = Date.parse(value);
  return Number.isFinite(parsedTimestamp);
}

const AuditLogDateTimeSchema = z.string().refine(isIsoDateTime, 'Periodo de auditoria invalido.');

export const AuditLogFilterSchema = z
  .object({
    userId: z.string().trim().min(1).max(120).optional(),
    targetId: AuditLogTargetIdSchema.optional(),
    actions: z.array(AuditLogActionSchema).min(1).max(20).optional(),
    targetTypes: z.array(AuditLogTargetTypeSchema).min(1).max(20).optional(),
    dateFrom: AuditLogDateTimeSchema.optional(),
    dateTo: AuditLogDateTimeSchema.optional(),
    limit: z.number().int().min(1).max(100).default(25),
    order: z.enum(['asc', 'desc']).default('desc'),
    cursor: z.string().trim().min(1).max(120).optional(),
  })
  .refine(
    (payload) => {
      if (!payload.dateFrom || !payload.dateTo) {
        return true;
      }

      return new Date(payload.dateFrom).getTime() <= new Date(payload.dateTo).getTime();
    },
    {
      message: 'dateFrom deve ser menor ou igual a dateTo.',
      path: ['dateFrom'],
    },
  );

export type AuditLogFilter = z.infer<typeof AuditLogFilterSchema>;
