/* eslint-disable require-jsdoc */
import {FieldValue, QueryDocumentSnapshot, getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {listGoogleCalendarEventsIncremental} from "./calendar-client";
import {getGoogleCalendarReconcileLookbackDays} from "./config";
import {
  AppointmentData,
  NormalizedGoogleCalendarEvent,
  normalizeGoogleCalendarEvent,
  readAppointmentData,
  readGoogleCalendarProfile,
} from "./models";
import {decryptRefreshToken} from "./token-crypto";

export interface InboundGoogleCalendarSyncInput {
  userId: string;
  calendarId?: string | null;
  forceFullSync?: boolean;
}

export interface InboundGoogleCalendarSyncResult {
  processedEvents: number;
  createdAppointments: number;
  updatedAppointments: number;
  canceledAppointments: number;
  skippedEvents: number;
  nextSyncToken: string | null;
  usedFullSyncFallback: boolean;
}

interface AppointmentComparableData {
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

interface UserSyncContext {
  salonId: string | null;
  calendarId: string;
  refreshToken: string;
  currentSyncToken: string | null;
}

interface EventApplyResult {
  created: number;
  updated: number;
  canceled: number;
  skipped: number;
}

async function ensureImportedClient(
  clientId: string,
  salonId: string,
  event: NormalizedGoogleCalendarEvent
): Promise<void> {
  const clientRef = getFirestore().collection("clients").doc(clientId);
  const clientSnapshot = await clientRef.get();

  if (clientSnapshot.exists) {
    return;
  }

  await clientRef.set(
    {
      salonId,
      name: event.summary ?? "Cliente importado do Google Agenda",
      phone: "",
      email: "",
      notes: "Registro criado automaticamente durante sincronizacao Google -> App.",
      lastVisit: event.startTime,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true}
  );
}

function readOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function normalizeGoogleEventStatus(status: string): string {
  const normalized = status.trim().toLowerCase();

  if (normalized === "cancelled") {
    return "cancelled";
  }

  if (normalized === "confirmed") {
    return "confirmed";
  }

  return "scheduled";
}

function toComparableTimestamp(value: Date | null): number | null {
  return value ? value.getTime() : null;
}

function shouldApplyGoogleEvent(
  appointmentUpdatedAt: Date | null,
  eventUpdatedAt: Date | null
): boolean {
  if (!eventUpdatedAt) {
    return true;
  }

  if (!appointmentUpdatedAt) {
    return true;
  }

  return eventUpdatedAt.getTime() >= appointmentUpdatedAt.getTime();
}

function isSameAppointmentData(
  appointment: AppointmentData,
  candidate: AppointmentComparableData
): boolean {
  const appointmentStart = toComparableTimestamp(appointment.startTime);
  const candidateStart = toComparableTimestamp(candidate.startTime);
  const appointmentEnd = toComparableTimestamp(appointment.endTime);
  const candidateEnd = toComparableTimestamp(candidate.endTime);

  return (
    appointment.salonId === candidate.salonId &&
    appointment.manicureId === candidate.manicureId &&
    appointment.clientId === candidate.clientId &&
    appointment.status === candidate.status &&
    appointment.notes === candidate.notes &&
    appointment.priceCents === candidate.priceCents &&
    appointmentStart === candidateStart &&
    appointmentEnd === candidateEnd &&
    appointment.googleEventId === candidate.googleEventId
  );
}

function extractGoogleErrorReason(error: unknown): string | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const maybeError = error as {
    code?: unknown;
    message?: unknown;
    response?: {
      data?: {
        error?: {
          message?: unknown;
          errors?: {reason?: unknown}[];
        };
      };
    };
  };

  const reason = maybeError.response?.data?.error?.errors?.[0]?.reason;

  if (typeof reason === "string" && reason.trim().length > 0) {
    return reason.trim();
  }

  const responseMessage = maybeError.response?.data?.error?.message;

  if (typeof responseMessage === "string" && responseMessage.trim().length > 0) {
    return responseMessage.trim();
  }

  if (typeof maybeError.message === "string" && maybeError.message.trim().length > 0) {
    return maybeError.message.trim();
  }

  if (typeof maybeError.code === "number") {
    return String(maybeError.code);
  }

  return null;
}

function isInvalidSyncTokenError(error: unknown): boolean {
  const reason = extractGoogleErrorReason(error)?.toLowerCase() ?? "";

  return (
    reason.includes("sync token") ||
    reason.includes("fullsyncrequired") ||
    reason === "410" ||
    reason.includes("gone")
  );
}

function isRevokedOrInvalidGrantError(error: unknown): boolean {
  const reason = extractGoogleErrorReason(error)?.toLowerCase() ?? "";

  if (reason.includes("invalid_grant") || reason.includes("unauthorized")) {
    return true;
  }

  return reason === "401";
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  const reason = extractGoogleErrorReason(error);

  if (reason && reason.trim().length > 0) {
    return reason;
  }

  return "Erro inesperado na sincronizacao inbound do Google Calendar.";
}

function buildComparableFromGoogleEvent(
  event: NormalizedGoogleCalendarEvent,
  userId: string,
  userSalonId: string | null,
  existingAppointment: AppointmentData | null
): AppointmentComparableData | null {
  const salonId =
    event.salonId ??
    existingAppointment?.salonId ??
    userSalonId ??
    null;
  const manicureId = event.manicureId ?? existingAppointment?.manicureId ?? userId;
  const clientId =
    event.clientId ??
    existingAppointment?.clientId ??
    `google-import-client-${event.id}`;

  if (!salonId || !manicureId || !clientId) {
    return null;
  }

  const startTime = event.startTime ?? existingAppointment?.startTime ?? null;
  const endTime = event.endTime ?? existingAppointment?.endTime ?? null;

  if (!startTime || !endTime || endTime.getTime() <= startTime.getTime()) {
    return null;
  }

  return {
    salonId,
    manicureId,
    clientId,
    status: normalizeGoogleEventStatus(event.status),
    notes: event.description ?? existingAppointment?.notes ?? "",
    priceCents: existingAppointment?.priceCents ?? 0,
    startTime,
    endTime,
    googleEventId: event.id,
  };
}

async function findAppointmentByGoogleEventId(
  googleEventId: string
): Promise<QueryDocumentSnapshot | null> {
  const query = await getFirestore()
    .collection("appointments")
    .where("googleEventId", "==", googleEventId)
    .limit(1)
    .get();

  if (query.empty) {
    return null;
  }

  return query.docs[0] ?? null;
}

async function resolveAppointmentSnapshot(
  event: NormalizedGoogleCalendarEvent
): Promise<QueryDocumentSnapshot | null> {
  if (event.appointmentId) {
    const byIdSnapshot = await getFirestore()
      .collection("appointments")
      .doc(event.appointmentId)
      .get();

    if (byIdSnapshot.exists) {
      return byIdSnapshot as QueryDocumentSnapshot;
    }
  }

  return findAppointmentByGoogleEventId(event.id);
}

async function applyCancelledEvent(
  event: NormalizedGoogleCalendarEvent,
  snapshot: QueryDocumentSnapshot | null
): Promise<EventApplyResult> {
  if (!snapshot) {
    return {
      created: 0,
      updated: 0,
      canceled: 0,
      skipped: 1,
    };
  }

  const appointment = readAppointmentData(snapshot.id, snapshot.data());

  if (!shouldApplyGoogleEvent(appointment.updatedAt, event.updatedAt)) {
    return {
      created: 0,
      updated: 0,
      canceled: 0,
      skipped: 1,
    };
  }

  if (appointment.status === "cancelled" && appointment.googleEventId === event.id) {
    return {
      created: 0,
      updated: 0,
      canceled: 0,
      skipped: 1,
    };
  }

  await snapshot.ref.set(
    {
      status: "cancelled",
      googleEventId: event.id,
      syncStatus: "synced",
      syncUpdatedAt: FieldValue.serverTimestamp(),
      syncErrorMessage: null,
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true}
  );

  return {
    created: 0,
    updated: 0,
    canceled: 1,
    skipped: 0,
  };
}

async function applyActiveEvent(
  event: NormalizedGoogleCalendarEvent,
  snapshot: QueryDocumentSnapshot | null,
  userId: string,
  userSalonId: string | null
): Promise<EventApplyResult> {
  const existingAppointment =
    snapshot ? readAppointmentData(snapshot.id, snapshot.data()) : null;

  if (
    existingAppointment &&
    !shouldApplyGoogleEvent(existingAppointment.updatedAt, event.updatedAt)
  ) {
    return {
      created: 0,
      updated: 0,
      canceled: 0,
      skipped: 1,
    };
  }

  const comparable = buildComparableFromGoogleEvent(
    event,
    userId,
    userSalonId,
    existingAppointment
  );

  if (!comparable) {
    return {
      created: 0,
      updated: 0,
      canceled: 0,
      skipped: 1,
    };
  }

  if (existingAppointment && isSameAppointmentData(existingAppointment, comparable)) {
    return {
      created: 0,
      updated: 0,
      canceled: 0,
      skipped: 1,
    };
  }

  const targetRef =
    snapshot?.ref ??
    (event.appointmentId ?
      getFirestore().collection("appointments").doc(event.appointmentId) :
      getFirestore().collection("appointments").doc());

  const createPayload =
    snapshot ?
      {} :
      {
        createdAt: FieldValue.serverTimestamp(),
      };

  if (!snapshot) {
    await ensureImportedClient(comparable.clientId, comparable.salonId, event);
  }

  await targetRef.set(
    {
      ...createPayload,
      salonId: comparable.salonId,
      manicureId: comparable.manicureId,
      clientId: comparable.clientId,
      status: comparable.status,
      notes: comparable.notes,
      priceCents: comparable.priceCents,
      startTime: comparable.startTime,
      endTime: comparable.endTime,
      googleEventId: comparable.googleEventId,
      syncStatus: "synced",
      syncUpdatedAt: FieldValue.serverTimestamp(),
      syncErrorMessage: null,
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true}
  );

  return {
    created: snapshot ? 0 : 1,
    updated: snapshot ? 1 : 0,
    canceled: 0,
    skipped: 0,
  };
}

function readUserSyncContext(
  userData: Record<string, unknown> | undefined,
  userId: string,
  calendarIdOverride: string | null | undefined
): UserSyncContext {
  const googleCalendar = readGoogleCalendarProfile(userData);

  if (!googleCalendar.connected) {
    throw new Error("Usuario sem conexao ativa com Google Calendar.");
  }

  const calendarId = calendarIdOverride ?? googleCalendar.calendarId;

  if (!calendarId) {
    throw new Error("Usuario conectado sem calendarId para sync inbound.");
  }

  if (!googleCalendar.encryptedRefreshToken) {
    throw new Error("Usuario conectado sem refresh token criptografado.");
  }

  const refreshToken = decryptRefreshToken(googleCalendar.encryptedRefreshToken);
  const userRecord = (userData ?? {}) as {salonId?: unknown};

  return {
    salonId: readOptionalString(userRecord.salonId),
    calendarId,
    refreshToken,
    currentSyncToken: googleCalendar.syncToken,
  };
}

async function markUserSyncExpired(userId: string, error: unknown): Promise<void> {
  await getFirestore().collection("users").doc(userId).set(
    {
      googleCalendar: {
        connected: false,
        syncStatus: "expired",
        lastErrorAt: FieldValue.serverTimestamp(),
        lastErrorMessage: "Conexao com Google expirou. Reconecte o Google Calendar.",
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true}
  );

  logger.error("Google token revoked/expired during inbound sync", {
    userId,
    error: normalizeErrorMessage(error),
  });
}

async function markUserSyncFailure(userId: string, error: unknown): Promise<void> {
  await getFirestore().collection("users").doc(userId).set(
    {
      googleCalendar: {
        syncStatus: "error",
        lastErrorAt: FieldValue.serverTimestamp(),
        lastErrorMessage: normalizeErrorMessage(error),
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true}
  );
}

async function markUserSyncSuccess(
  userId: string,
  syncToken: string | null
): Promise<void> {
  await getFirestore().collection("users").doc(userId).set(
    {
      googleCalendar: {
        syncStatus: "synced",
        syncToken,
        lastInboundSyncAt: FieldValue.serverTimestamp(),
        lastSyncedAt: FieldValue.serverTimestamp(),
        lastErrorAt: null,
        lastErrorMessage: null,
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true}
  );
}

export async function syncInboundGoogleCalendarIncremental(
  input: InboundGoogleCalendarSyncInput
): Promise<InboundGoogleCalendarSyncResult> {
  const userId = input.userId.trim();

  if (userId.length === 0) {
    throw new Error("userId e obrigatorio para sync inbound.");
  }

  const userSnapshot = await getFirestore().collection("users").doc(userId).get();

  if (!userSnapshot.exists) {
    throw new Error("Usuario nao encontrado para sync inbound.");
  }

  const context = readUserSyncContext(
    userSnapshot.data(),
    userId,
    input.calendarId
  );

  const syncResult: InboundGoogleCalendarSyncResult = {
    processedEvents: 0,
    createdAppointments: 0,
    updatedAppointments: 0,
    canceledAppointments: 0,
    skippedEvents: 0,
    nextSyncToken: context.currentSyncToken,
    usedFullSyncFallback: false,
  };
  const lookbackDays = getGoogleCalendarReconcileLookbackDays();
  const lookbackStartIso = new Date(
    Date.now() - lookbackDays * 24 * 60 * 60 * 1000
  ).toISOString();

  const shouldUseIncremental =
    !input.forceFullSync &&
    typeof context.currentSyncToken === "string" &&
    context.currentSyncToken.trim().length > 0;

  let events = [] as NormalizedGoogleCalendarEvent[];

  try {
    const listed = await listGoogleCalendarEventsIncremental(
      context.refreshToken,
      context.calendarId,
      {
        syncToken: shouldUseIncremental ? context.currentSyncToken : null,
        timeMin: shouldUseIncremental ? null : lookbackStartIso,
      }
    );

    syncResult.nextSyncToken = listed.nextSyncToken ?? context.currentSyncToken;
    events = listed.events
      .map((event) => normalizeGoogleCalendarEvent(event))
      .filter((event): event is NormalizedGoogleCalendarEvent => event !== null);
  } catch (error) {
    if (isRevokedOrInvalidGrantError(error)) {
      await markUserSyncExpired(userId, error);
      throw error;
    }

    if (shouldUseIncremental && isInvalidSyncTokenError(error)) {
      syncResult.usedFullSyncFallback = true;

      const fullListed = await listGoogleCalendarEventsIncremental(
        context.refreshToken,
        context.calendarId,
        {
          syncToken: null,
          timeMin: lookbackStartIso,
        }
      );

      syncResult.nextSyncToken = fullListed.nextSyncToken ?? null;
      events = fullListed.events
        .map((event) => normalizeGoogleCalendarEvent(event))
        .filter((event): event is NormalizedGoogleCalendarEvent => event !== null);
    } else {
      await markUserSyncFailure(userId, error);
      throw error;
    }
  }

  for (const event of events) {
    const snapshot = await resolveAppointmentSnapshot(event);

    const partialResult =
      event.status.trim().toLowerCase() === "cancelled" ?
        await applyCancelledEvent(event, snapshot) :
        await applyActiveEvent(event, snapshot, userId, context.salonId);

    syncResult.createdAppointments += partialResult.created;
    syncResult.updatedAppointments += partialResult.updated;
    syncResult.canceledAppointments += partialResult.canceled;
    syncResult.skippedEvents += partialResult.skipped;
  }

  syncResult.processedEvents = events.length;

  await markUserSyncSuccess(userId, syncResult.nextSyncToken);

  return syncResult;
}
