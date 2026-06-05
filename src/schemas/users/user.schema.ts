import { z } from 'zod';

export const PersistedUserRoleSchema = z.enum([
  'super_admin',
  'salon_owner',
  'nail_technician',
  'manicure',
]);
export const UserRoleSchema = z.enum(['super_admin', 'salon_owner', 'nail_technician']);

export function normalizeUserRole(role: z.infer<typeof PersistedUserRoleSchema>) {
  return role === 'manicure' ? 'nail_technician' : role;
}

export const NotificationPreferencesSchema = z.object({
  newAppointment: z.boolean().default(true),
  appointmentCanceled: z.boolean().default(true),
  appointmentRescheduled: z.boolean().default(true),
  preReminder: z.boolean().default(true),
  syncError: z.boolean().default(true),
  googleExpired: z.boolean().default(true),
  quietHoursEnabled: z.boolean().default(false),
  quietHoursStart: z.string().default('22:00'),
  quietHoursEnd: z.string().default('07:00'),
  preReminderMinutes: z.number().int().min(5).max(1440).default(60),
});

export const GoogleCalendarSchema = z.object({
  connected: z.boolean().default(false),
  encryptedRefreshToken: z.string().optional(),
  tokenVersion: z.number().int().nonnegative().default(1),
  calendarId: z.string().optional(),
  syncStatus: z
    .enum(['idle', 'pending', 'authorizing', 'synced', 'disabled', 'expired', 'error'])
    .default('idle'),
  lastSyncedAt: z.string().optional(),
  lastInboundSyncAt: z.string().optional(),
  lastErrorAt: z.string().optional(),
  lastErrorMessage: z.string().max(500).optional(),
  isRefreshingToken: z.boolean().default(false),
  watchChannelId: z.string().optional(),
  watchResourceId: z.string().optional(),
  watchChannelTokenHash: z.string().optional(),
  watchExpiration: z.string().optional(),
  syncToken: z.string().optional(),
});

export const UserSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(2),
  role: PersistedUserRoleSchema.transform(normalizeUserRole),
  salonId: z.string().nullable(),
  phone: z.string().optional(),
  photoURL: z.string().url().optional(),
  googleCalendar: GoogleCalendarSchema.default({
    connected: false,
    tokenVersion: 1,
    syncStatus: 'idle',
    isRefreshingToken: false,
  }),
  notificationPreferences: NotificationPreferencesSchema.default({
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
  }),
  fcmTokens: z.array(z.string()).default([]),
  createdAt: z.string(),
});

export type UserRole = z.infer<typeof UserRoleSchema>;
export type PersistedUserRole = z.infer<typeof PersistedUserRoleSchema>;
export type User = z.infer<typeof UserSchema>;
