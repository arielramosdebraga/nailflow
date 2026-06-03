import { describe, expect, it } from 'vitest';

import { AuditLogFilterSchema } from '@/schemas/audit/audit-log-filter.schema';
import { AuditLogSchema, CreateAuditLogInputSchema } from '@/schemas/audit/audit-log.schema';

describe('audit schemas', () => {
  it('deve validar payload basico de criacao de audit log', () => {
    const parsed = CreateAuditLogInputSchema.parse({
      userId: 'user-001',
      userRole: 'super_admin',
      action: 'admin.dashboard.viewed',
      targetType: 'dashboard',
      targetId: 'global',
      metadata: {
        origin: 'admin_app',
        success: true,
      },
    });

    expect(parsed.action).toBe('admin.dashboard.viewed');
    expect(parsed.targetType).toBe('dashboard');
  });

  it('deve rejeitar action com caracteres invalidos', () => {
    const result = CreateAuditLogInputSchema.safeParse({
      userId: 'user-001',
      userRole: 'super_admin',
      action: 'admin dashboard viewed',
      targetType: 'dashboard',
      targetId: 'global',
      metadata: {},
    });

    expect(result.success).toBe(false);
  });

  it('deve validar audit log completo', () => {
    const parsed = AuditLogSchema.parse({
      id: 'audit-001',
      userId: 'user-001',
      userRole: 'super_admin',
      action: 'admin.dashboard.viewed',
      targetType: 'dashboard',
      targetId: 'global',
      metadata: {
        totalSalons: 3,
      },
      ipAddress: '189.1.2.3',
      userAgent: 'nailflow-mobile/1.0.0',
      requestId: 'req-001',
      timestamp: '2026-05-30T12:30:00.000Z',
    });

    expect(parsed.id).toBe('audit-001');
  });

  it('deve aplicar defaults nos filtros de audit log', () => {
    const parsed = AuditLogFilterSchema.parse({
      dateFrom: '2026-05-01T00:00:00.000Z',
      dateTo: '2026-05-30T23:59:59.999Z',
    });

    expect(parsed.limit).toBe(25);
    expect(parsed.order).toBe('desc');
  });

  it('deve rejeitar periodo invertido no filtro de audit log', () => {
    const result = AuditLogFilterSchema.safeParse({
      dateFrom: '2026-05-31T00:00:00.000Z',
      dateTo: '2026-05-01T00:00:00.000Z',
    });

    expect(result.success).toBe(false);
  });
});
