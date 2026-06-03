/* eslint-disable require-jsdoc */
import {DocumentData} from "firebase-admin/firestore";

export type NotificationType =
  | "new_appointment"
  | "appointment_canceled"
  | "appointment_rescheduled"
  | "pre_reminder"
  | "sync_error"
  | "google_expired";

export interface NotificationRecordInput {
  userId: string;
  salonId: string | null;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  dedupeKey?: string | null;
}

export interface NotificationPreferences {
  newAppointment: boolean;
  appointmentCanceled: boolean;
  appointmentRescheduled: boolean;
  preReminder: boolean;
  syncError: boolean;
  googleExpired: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  preReminderMinutes: number;
}

export interface UserNotificationProfile {
  uid: string;
  role: NotificationUserRole | null;
  salonId: string | null;
  displayName: string;
  fcmTokens: string[];
  preferences: NotificationPreferences;
}

export interface NotificationCreationResult {
  id: string;
  created: boolean;
}

export type NotificationUserRole =
  | "super_admin"
  | "salon_owner"
  | "nail_technician";

function readRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  return value as Record<string, unknown>;
}

function readOptionalString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readNullableString(value: unknown): string | null {
  const normalizedValue = readOptionalString(value);
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readNumber(value: unknown, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return value;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalizedTokens = value
    .filter((token): token is string => typeof token === "string")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  return [...new Set(normalizedTokens)];
}

function readUserRole(value: unknown): NotificationUserRole | null {
  const normalizedValue = readOptionalString(value).toLowerCase();

  if (normalizedValue === "manicure") {
    return "nail_technician";
  }

  if (
    normalizedValue === "super_admin" ||
    normalizedValue === "salon_owner" ||
    normalizedValue === "nail_technician"
  ) {
    return normalizedValue;
  }

  return null;
}

function normalizePreReminderMinutes(value: number): number {
  const boundedValue = Math.floor(value);

  if (boundedValue < 5) {
    return 5;
  }

  if (boundedValue > 1440) {
    return 1440;
  }

  return boundedValue;
}

export function readUserNotificationProfile(
  uid: string,
  userData: DocumentData | undefined
): UserNotificationProfile {
  const root = readRecord(userData);
  const preferences = readRecord(root.notificationPreferences);

  return {
    uid,
    role: readUserRole(root.role),
    salonId: readNullableString(root.salonId),
    displayName: readOptionalString(root.displayName),
    fcmTokens: readStringArray(root.fcmTokens),
    preferences: {
      newAppointment: readBoolean(preferences.newAppointment, true),
      appointmentCanceled: readBoolean(preferences.appointmentCanceled, true),
      appointmentRescheduled: readBoolean(
        preferences.appointmentRescheduled,
        true
      ),
      preReminder: readBoolean(preferences.preReminder, true),
      syncError: readBoolean(preferences.syncError, true),
      googleExpired: readBoolean(preferences.googleExpired, true),
      quietHoursEnabled: readBoolean(preferences.quietHoursEnabled, false),
      quietHoursStart: readOptionalString(preferences.quietHoursStart) || "22:00",
      quietHoursEnd: readOptionalString(preferences.quietHoursEnd) || "07:00",
      preReminderMinutes: normalizePreReminderMinutes(
        readNumber(preferences.preReminderMinutes, 60)
      ),
    },
  };
}

