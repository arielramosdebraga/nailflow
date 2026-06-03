import { z } from 'zod';

export const LgpdExportUserRecordSchema = z.object({
  uid: z.string().min(1),
  displayName: z.string(),
  email: z.string(),
  role: z.string().min(1),
  salonId: z.string().nullable(),
  active: z.boolean(),
});

export const LgpdExportSalonRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  ownerId: z.string().nullable(),
  active: z.boolean(),
});

export const LgpdExportAuditRecordSchema = z.object({
  id: z.string().min(1),
  action: z.string(),
  userId: z.string(),
  targetType: z.string(),
  targetId: z.string().nullable(),
  timestamp: z.string().nullable(),
});

export const LgpdExportPackageSchema = z.object({
  generatedAt: z.string().datetime(),
  summary: z.object({
    users: z.number().int().nonnegative(),
    salons: z.number().int().nonnegative(),
    auditLogs: z.number().int().nonnegative(),
  }),
  users: z.array(LgpdExportUserRecordSchema),
  salons: z.array(LgpdExportSalonRecordSchema),
  auditLogs: z.array(LgpdExportAuditRecordSchema),
});

export type LgpdExportPackage = z.infer<typeof LgpdExportPackageSchema>;
