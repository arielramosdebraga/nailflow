import { z } from 'zod';

const AuditLogSourceSchema = z.enum(['callable', 'trigger', 'scheduler', 'manual']);

export const AuditLogSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  actorRole: z.string().min(1),
  action: z.string().min(1),
  targetType: z.string().min(1),
  targetId: z.string().nullable(),
  salonId: z.string().nullable(),
  source: AuditLogSourceSchema,
  ipAddress: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  timestamp: z.date().nullable(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;
