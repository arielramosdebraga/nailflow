import { describe, expect, it } from 'vitest';

import {
  isNotificationTypeEnabled,
  isWithinQuietHours,
} from './preferences';
import type { NotificationPreferences } from './models';

function createPreferences(
  overrides: Partial<NotificationPreferences> = {}
): NotificationPreferences {
  return {
    newAppointment: true,
    appointmentCanceled: true,
    appointmentRescheduled: true,
    preReminder: true,
    syncError: true,
    googleExpired: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    preReminderMinutes: 60,
    ...overrides,
  };
}

describe('notifications/preferences', () => {
  it('respeita preferencia por tipo de notificacao', () => {
    const preferences = createPreferences({ appointmentRescheduled: false });

    expect(
      isNotificationTypeEnabled('appointment_rescheduled', preferences)
    ).toBe(false);
    expect(
      isNotificationTypeEnabled('appointment_canceled', preferences)
    ).toBe(true);
  });

  it('retorna false quando quiet hours estiver desativado', () => {
    const preferences = createPreferences({
      quietHoursEnabled: false,
      quietHoursStart: '09:00',
      quietHoursEnd: '18:00',
    });

    const currentDate = new Date('2026-06-01T16:30:00.000Z');
    expect(isWithinQuietHours(preferences, currentDate, 'UTC')).toBe(false);
  });

  it('aplica janela normal quando horario inicial menor que final', () => {
    const preferences = createPreferences({
      quietHoursEnabled: true,
      quietHoursStart: '09:00',
      quietHoursEnd: '18:00',
    });

    const insideWindow = new Date('2026-06-01T11:30:00.000Z');
    const outsideWindow = new Date('2026-06-01T20:30:00.000Z');

    expect(isWithinQuietHours(preferences, insideWindow, 'UTC')).toBe(true);
    expect(isWithinQuietHours(preferences, outsideWindow, 'UTC')).toBe(false);
  });

  it('aplica janela overnight quando horario inicial maior que final', () => {
    const preferences = createPreferences({
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
    });

    const insideWindowLateNight = new Date('2026-06-01T23:30:00.000Z');
    const insideWindowEarlyMorning = new Date('2026-06-01T04:30:00.000Z');
    const outsideWindowAfternoon = new Date('2026-06-01T14:30:00.000Z');

    expect(isWithinQuietHours(preferences, insideWindowLateNight, 'UTC')).toBe(
      true
    );
    expect(isWithinQuietHours(preferences, insideWindowEarlyMorning, 'UTC')).toBe(
      true
    );
    expect(isWithinQuietHours(preferences, outsideWindowAfternoon, 'UTC')).toBe(
      false
    );
  });

  it('considera dia inteiro silenciado quando inicio e fim sao iguais', () => {
    const preferences = createPreferences({
      quietHoursEnabled: true,
      quietHoursStart: '00:00',
      quietHoursEnd: '00:00',
    });

    const currentDate = new Date('2026-06-01T16:30:00.000Z');
    expect(isWithinQuietHours(preferences, currentDate, 'UTC')).toBe(true);
  });
});
