import { describe, expect, it } from 'vitest';

import { NotificationPreferencesSchema, UserSchema } from '@/schemas/users/user.schema';

describe('UserSchema', () => {
  it('normaliza role legado manicure para nail_technician', () => {
    const payload = {
      uid: 'uid-123',
      email: 'manicure@nailflow.app',
      displayName: 'Profissional Teste',
      role: 'manicure',
      salonId: null,
      createdAt: new Date().toISOString(),
    };

    const result = UserSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data.role).toBe('nail_technician');
  });

  it('aplica defaults de preferencias de notificacao', () => {
    const result = NotificationPreferencesSchema.parse({});

    expect(result.newAppointment).toBe(true);
    expect(result.appointmentCanceled).toBe(true);
    expect(result.appointmentRescheduled).toBe(true);
    expect(result.preReminder).toBe(true);
    expect(result.syncError).toBe(true);
    expect(result.googleExpired).toBe(true);
    expect(result.quietHoursEnabled).toBe(false);
    expect(result.quietHoursStart).toBe('22:00');
    expect(result.quietHoursEnd).toBe('07:00');
    expect(result.preReminderMinutes).toBe(60);
  });
});
