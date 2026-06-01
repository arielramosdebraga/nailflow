/* eslint-disable require-jsdoc */
import {NotificationPreferences, NotificationType} from "./models";

const SCHEDULER_TIMEZONE = "America/Sao_Paulo";

const TYPE_TO_PREFERENCE_KEY: Record<
  NotificationType,
  keyof NotificationPreferences
> = {
  new_appointment: "newAppointment",
  appointment_canceled: "appointmentCanceled",
  appointment_rescheduled: "appointmentRescheduled",
  pre_reminder: "preReminder",
  sync_error: "syncError",
  google_expired: "googleExpired",
};

function parseClockToMinutes(clockValue: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(clockValue.trim());

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function getCurrentMinutesInTimezone(
  now: Date,
  timeZone: string
): number | null {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const hourPart = parts.find((part) => part.type === "hour")?.value;
  const minutePart = parts.find((part) => part.type === "minute")?.value;

  if (!hourPart || !minutePart) {
    return null;
  }

  return parseClockToMinutes(`${hourPart}:${minutePart}`);
}

export function isNotificationTypeEnabled(
  type: NotificationType,
  preferences: NotificationPreferences
): boolean {
  const key = TYPE_TO_PREFERENCE_KEY[type];
  return preferences[key] === true;
}

export function isWithinQuietHours(
  preferences: NotificationPreferences,
  now: Date = new Date(),
  timeZone: string = SCHEDULER_TIMEZONE
): boolean {
  if (!preferences.quietHoursEnabled) {
    return false;
  }

  const nowMinutes = getCurrentMinutesInTimezone(now, timeZone);
  const startMinutes = parseClockToMinutes(preferences.quietHoursStart);
  const endMinutes = parseClockToMinutes(preferences.quietHoursEnd);

  if (nowMinutes === null || startMinutes === null || endMinutes === null) {
    return false;
  }

  if (startMinutes === endMinutes) {
    return true;
  }

  if (startMinutes < endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }

  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}

