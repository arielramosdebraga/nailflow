/* eslint-disable require-jsdoc */
import {calendar_v3} from "googleapis";

export interface GoogleCalendarProfile {
  connected: boolean;
  calendarId: string | null;
  syncStatus: string;
  encryptedRefreshToken: string | null;
  tokenVersion: number | null;
  oauthStateHash: string | null;
  oauthStateExpiresAt: Date | null;
  lastSyncedAt: Date | null;
  lastInboundSyncAt: Date | null;
  lastErrorAt: Date | null;
  lastErrorMessage: string | null;
  watchChannelId: string | null;
  watchResourceId: string | null;
  watchChannelTokenHash: string | null;
  watchExpiration: Date | null;
  syncToken: string | null;
}

export interface AppointmentData {
  id: string;
  salonId: string;
  manicureId: string;
  clientId: string;
  status: string;
  notes: string;
  priceCents: number;
  startTime: Date | null;
  endTime: Date | null;
  googleEventId: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface NormalizedGoogleCalendarEvent {
  id: string;
  status: string;
  summary: string | null;
  description: string | null;
  startTime: Date | null;
  endTime: Date | null;
  updatedAt: Date | null;
  appointmentId: string | null;
  salonId: string | null;
  manicureId: string | null;
  clientId: string | null;
}

function readRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ?
    (value as Record<string, unknown>) :
    {};
}

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function readOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function readBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function toDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  const maybeTimestamp = value as {toDate?: () => Date};

  if (typeof maybeTimestamp.toDate === "function") {
    return maybeTimestamp.toDate();
  }

  return null;
}

export function toDateFromIso(value: string | null | undefined): Date | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

export function toIsoString(value: unknown): string | null {
  const parsedDate = toDate(value);
  return parsedDate ? parsedDate.toISOString() : null;
}

export function readGoogleCalendarProfile(
  userData: Record<string, unknown> | undefined
): GoogleCalendarProfile {
  const rootData = userData ?? {};
  const googleCalendar = readRecord(rootData.googleCalendar);

  return {
    connected: readBoolean(googleCalendar.connected),
    calendarId: readOptionalString(googleCalendar.calendarId),
    syncStatus: readString(googleCalendar.syncStatus, "disabled"),
    encryptedRefreshToken: readOptionalString(
      googleCalendar.encryptedRefreshToken
    ),
    tokenVersion:
      typeof googleCalendar.tokenVersion === "number" ?
        googleCalendar.tokenVersion :
        null,
    oauthStateHash: readOptionalString(googleCalendar.oauthStateHash),
    oauthStateExpiresAt: toDate(googleCalendar.oauthStateExpiresAt),
    lastSyncedAt: toDate(googleCalendar.lastSyncedAt),
    lastInboundSyncAt: toDate(googleCalendar.lastInboundSyncAt),
    lastErrorAt: toDate(googleCalendar.lastErrorAt),
    lastErrorMessage: readOptionalString(googleCalendar.lastErrorMessage),
    watchChannelId: readOptionalString(googleCalendar.watchChannelId),
    watchResourceId: readOptionalString(googleCalendar.watchResourceId),
    watchChannelTokenHash: readOptionalString(googleCalendar.watchChannelTokenHash),
    watchExpiration: toDate(googleCalendar.watchExpiration),
    syncToken: readOptionalString(googleCalendar.syncToken),
  };
}

export function readAppointmentData(
  id: string,
  sourceData: Record<string, unknown> | undefined
): AppointmentData {
  const data = sourceData ?? {};

  return {
    id,
    salonId: readString(data.salonId),
    manicureId: readString(data.manicureId),
    clientId: readString(data.clientId),
    status: readString(data.status, "scheduled"),
    notes: readString(data.notes),
    priceCents: readNumber(data.priceCents),
    startTime: toDate(data.startTime),
    endTime: toDate(data.endTime),
    googleEventId: readOptionalString(data.googleEventId),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function hasEssentialAppointmentFields(
  appointment: AppointmentData
): boolean {
  return Boolean(
    appointment.salonId &&
      appointment.manicureId &&
      appointment.clientId &&
      appointment.startTime &&
      appointment.endTime
  );
}

function readGoogleEventDateTime(
  dateTime: calendar_v3.Schema$EventDateTime | null | undefined
): Date | null {
  if (!dateTime) {
    return null;
  }

  if (typeof dateTime.dateTime === "string" && dateTime.dateTime.trim().length > 0) {
    return toDateFromIso(dateTime.dateTime);
  }

  if (typeof dateTime.date === "string" && dateTime.date.trim().length > 0) {
    return toDateFromIso(`${dateTime.date}T00:00:00.000Z`);
  }

  return null;
}

export function normalizeGoogleCalendarEvent(
  event: calendar_v3.Schema$Event
): NormalizedGoogleCalendarEvent | null {
  const eventId = readOptionalString(event.id);

  if (!eventId) {
    return null;
  }

  const privateMetadata = readRecord(event.extendedProperties?.private);
  const updatedAt =
    toDateFromIso(event.updated ?? null) ??
    toDateFromIso(event.created ?? null);

  return {
    id: eventId,
    status: readString(event.status, "confirmed"),
    summary: readOptionalString(event.summary),
    description: readOptionalString(event.description),
    startTime: readGoogleEventDateTime(event.start),
    endTime: readGoogleEventDateTime(event.end),
    updatedAt,
    appointmentId: readOptionalString(privateMetadata.appointmentId),
    salonId: readOptionalString(privateMetadata.salonId),
    manicureId: readOptionalString(privateMetadata.manicureId),
    clientId: readOptionalString(privateMetadata.clientId),
  };
}
