import { z } from 'zod';

export const UserRoleSchema = z.enum(['super_admin', 'salon_owner', 'manicure']);

export const NotificationPreferencesSchema = z.object({
  newAppointment: z.boolean().default(true),
  appointmentCanceled: z.boolean().default(true),
  appointmentRescheduled: z.boolean().default(true),
  preReminder: z.boolean().default(true),
  syncError: z.boolean().default(true),
  googleExpired: z.boolean().default(true),
});

export const GoogleCalendarSchema = z.object({
  connected: z.boolean().default(false),
  refreshToken: z.string().optional(),
  calendarId: z.string().optional(),
  watchChannelId: z.string().optional(),
  watchExpiration: z.string().optional(),
  syncToken: z.string().optional(),
});

export const UserSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(2),
  role: UserRoleSchema,
  salonId: z.string().nullable(),
  phone: z.string().optional(),
  photoURL: z.string().url().optional(),
  googleCalendar: GoogleCalendarSchema.default({ connected: false }),
  notificationPreferences: NotificationPreferencesSchema.default({
    newAppointment: true,
    appointmentCanceled: true,
    appointmentRescheduled: true,
    preReminder: true,
    syncError: true,
    googleExpired: true,
  }),
  fcmTokens: z.array(z.string()).default([]),
  createdAt: z.string(),
});

export type UserRole = z.infer<typeof UserRoleSchema>;
export type User = z.infer<typeof UserSchema>;
