/* eslint-disable require-jsdoc */
export interface GoogleCalendarProfile {
  connected: boolean;
  calendarId: string | null;
  syncStatus: string;
  encryptedRefreshToken: string | null;
  tokenVersion: number | null;
  oauthStateHash: string | null;
  oauthStateExpiresAt: Date | null;
  lastSyncedAt: Date | null;
  lastErrorAt: Date | null;
  lastErrorMessage: string | null;
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
    lastErrorAt: toDate(googleCalendar.lastErrorAt),
    lastErrorMessage: readOptionalString(googleCalendar.lastErrorMessage),
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
