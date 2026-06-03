/* eslint-disable require-jsdoc */
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {calendar_v3} from "googleapis";
import {
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  updateGoogleCalendarEvent,
} from "./calendar-client";
import {
  AppointmentData,
  hasEssentialAppointmentFields,
  readGoogleCalendarProfile,
} from "./models";
import {decryptRefreshToken} from "./token-crypto";

interface GoogleCalendarAccess {
  calendarId: string;
  refreshToken: string;
}

type SyncOutcome =
  | {kind: "ready"; access: GoogleCalendarAccess}
  | {kind: "disabled"; reason: string}
  | {kind: "error"; reason: string};

function mapAppointmentStatus(status: string): string {
  switch (status) {
  case "scheduled":
    return "Agendado";
  case "confirmed":
    return "Confirmado";
  case "completed":
    return "Concluido";
  case "cancelled":
    return "Cancelado";
  default:
    return "Agendado";
  }
}

function formatPrice(priceCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceCents / 100);
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Erro inesperado ao sincronizar com Google Calendar.";
}

function extractGoogleErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const maybeError = error as {
    code?: unknown;
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
    return reason;
  }

  const message = maybeError.response?.data?.error?.message;

  if (typeof message === "string" && message.includes("invalid_grant")) {
    return "invalid_grant";
  }

  if (
    typeof maybeError.code === "number" &&
    maybeError.code === 401
  ) {
    return "unauthorized";
  }

  return null;
}

function mapSyncErrorToFriendlyMessage(error: unknown): string {
  const reason = extractGoogleErrorCode(error);

  if (reason === "invalid_grant" || reason === "unauthorized") {
    return "Conexao com Google expirou. Reconecte o Google Calendar.";
  }

  return normalizeErrorMessage(error);
}

function isExpiredGoogleConnection(error: unknown): boolean {
  const reason = extractGoogleErrorCode(error);

  return reason === "invalid_grant" || reason === "unauthorized";
}

async function readGoogleCalendarAccess(
  userId: string
): Promise<SyncOutcome> {
  const userSnapshot = await getFirestore().collection("users").doc(userId).get();
  const googleCalendar = readGoogleCalendarProfile(userSnapshot.data());

  if (!googleCalendar.connected) {
    return {
      kind: "disabled",
      reason: "Usuario sem conexao ativa com Google Calendar.",
    };
  }

  if (!googleCalendar.calendarId) {
    return {
      kind: "disabled",
      reason: "Usuario conectado sem calendarId configurado.",
    };
  }

  if (!googleCalendar.encryptedRefreshToken) {
    return {
      kind: "disabled",
      reason: "Usuario conectado sem refresh token criptografado.",
    };
  }

  try {
    const refreshToken = decryptRefreshToken(googleCalendar.encryptedRefreshToken);

    return {
      kind: "ready",
      access: {
        calendarId: googleCalendar.calendarId,
        refreshToken,
      },
    };
  } catch (error) {
    logger.error("Failed to decrypt Google refresh token", {
      userId,
      error: normalizeErrorMessage(error),
    });

    return {
      kind: "error",
      reason: "Falha ao decodificar token do Google Calendar.",
    };
  }
}

async function readDisplayNameOrId(
  collectionName: string,
  id: string,
  fieldName: string
): Promise<string> {
  const snapshot = await getFirestore().collection(collectionName).doc(id).get();

  if (!snapshot.exists) {
    return id;
  }

  const value = snapshot.data()?.[fieldName];

  if (typeof value !== "string" || value.trim().length === 0) {
    return id;
  }

  return value.trim();
}

async function buildCalendarEventPayload(
  appointment: AppointmentData
): Promise<calendar_v3.Schema$Event> {
  const [clientName, manicureName] = await Promise.all([
    readDisplayNameOrId("clients", appointment.clientId, "name"),
    readDisplayNameOrId("users", appointment.manicureId, "displayName"),
  ]);

  const statusText = mapAppointmentStatus(appointment.status);
  const details: string[] = [
    `Status: ${statusText}`,
    `Cliente: ${clientName}`,
    `Manicure: ${manicureName}`,
    `Valor: ${formatPrice(appointment.priceCents)}`,
    `Atendimento ID: ${appointment.id}`,
  ];

  if (appointment.notes.trim().length > 0) {
    details.push(`Observacoes: ${appointment.notes.trim()}`);
  }

  return {
    summary: `Atendimento NailFlow - ${clientName}`,
    description: details.join("\n"),
    start: {
      dateTime: appointment.startTime?.toISOString(),
      timeZone: "America/Sao_Paulo",
    },
    end: {
      dateTime: appointment.endTime?.toISOString(),
      timeZone: "America/Sao_Paulo",
    },
    extendedProperties: {
      private: {
        appointmentId: appointment.id,
        salonId: appointment.salonId,
        manicureId: appointment.manicureId,
      },
    },
  };
}

export async function markUserSyncSuccess(userId: string): Promise<void> {
  await getFirestore().collection("users").doc(userId).set(
    {
      googleCalendar: {
        syncStatus: "synced",
        lastSyncedAt: FieldValue.serverTimestamp(),
        lastErrorAt: null,
        lastErrorMessage: null,
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true}
  );
}

export async function markUserSyncFailure(
  userId: string,
  error: unknown
): Promise<void> {
  const friendlyErrorMessage = mapSyncErrorToFriendlyMessage(error);
  const expiredConnection = isExpiredGoogleConnection(error);

  await getFirestore().collection("users").doc(userId).set(
    {
      googleCalendar: {
        connected: expiredConnection ? false : true,
        syncStatus: expiredConnection ? "expired" : "error",
        lastErrorAt: FieldValue.serverTimestamp(),
        lastErrorMessage: friendlyErrorMessage,
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true}
  );
}

export async function markAppointmentSyncSuccess(
  appointmentId: string,
  googleEventId?: string | null
): Promise<void> {
  const payload: Record<string, unknown> = {
    syncStatus: "synced",
    syncUpdatedAt: FieldValue.serverTimestamp(),
    syncErrorMessage: null,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (googleEventId) {
    payload.googleEventId = googleEventId;
  }

  await getFirestore().collection("appointments").doc(appointmentId).set(
    payload,
    {merge: true}
  );
}

export async function markAppointmentSyncFailure(
  appointmentId: string,
  error: unknown
): Promise<void> {
  await getFirestore().collection("appointments").doc(appointmentId).set(
    {
      syncStatus: "error",
      syncUpdatedAt: FieldValue.serverTimestamp(),
      syncErrorMessage: mapSyncErrorToFriendlyMessage(error),
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true}
  );
}

export async function markAppointmentSyncDisabled(
  appointmentId: string,
  message: string
): Promise<void> {
  await getFirestore().collection("appointments").doc(appointmentId).set(
    {
      syncStatus: "disabled",
      syncUpdatedAt: FieldValue.serverTimestamp(),
      syncErrorMessage: message,
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true}
  );
}

function didCoreAppointmentFieldsChange(
  before: AppointmentData,
  after: AppointmentData
): boolean {
  const beforeStart = before.startTime?.toISOString() ?? null;
  const afterStart = after.startTime?.toISOString() ?? null;
  const beforeEnd = before.endTime?.toISOString() ?? null;
  const afterEnd = after.endTime?.toISOString() ?? null;

  return (
    before.salonId !== after.salonId ||
    before.manicureId !== after.manicureId ||
    before.clientId !== after.clientId ||
    before.status !== after.status ||
    before.notes !== after.notes ||
    before.priceCents !== after.priceCents ||
    beforeStart !== afterStart ||
    beforeEnd !== afterEnd
  );
}

export function shouldHandleAppointmentUpdate(
  before: AppointmentData,
  after: AppointmentData
): boolean {
  if (!didCoreAppointmentFieldsChange(before, after)) {
    return false;
  }

  return true;
}

export async function syncCreatedAppointmentToGoogle(
  appointment: AppointmentData
): Promise<void> {
  if (!hasEssentialAppointmentFields(appointment)) {
    await markAppointmentSyncFailure(
      appointment.id,
      new Error("Atendimento com campos obrigatorios ausentes para sincronizacao.")
    );
    return;
  }

  const calendarAccess = await readGoogleCalendarAccess(appointment.manicureId);

  if (calendarAccess.kind !== "ready") {
    await markAppointmentSyncDisabled(appointment.id, calendarAccess.reason);

    if (calendarAccess.kind === "error") {
      await markUserSyncFailure(appointment.manicureId, new Error(calendarAccess.reason));
    }

    return;
  }

  try {
    const eventPayload = await buildCalendarEventPayload(appointment);
    const googleEventId = await createGoogleCalendarEvent(
      calendarAccess.access.refreshToken,
      calendarAccess.access.calendarId,
      eventPayload
    );

    await Promise.all([
      markAppointmentSyncSuccess(appointment.id, googleEventId),
      markUserSyncSuccess(appointment.manicureId),
    ]);
  } catch (error) {
    await Promise.all([
      markAppointmentSyncFailure(appointment.id, error),
      markUserSyncFailure(appointment.manicureId, error),
    ]);
    throw error;
  }
}

export async function syncUpdatedAppointmentToGoogle(
  before: AppointmentData,
  after: AppointmentData
): Promise<void> {
  if (!hasEssentialAppointmentFields(after)) {
    await markAppointmentSyncFailure(
      after.id,
      new Error("Atendimento atualizado com campos obrigatorios ausentes.")
    );
    return;
  }

  if (before.manicureId !== after.manicureId) {
    await migrateAppointmentEventOwnership(before, after);
    return;
  }

  const calendarAccess = await readGoogleCalendarAccess(after.manicureId);

  if (calendarAccess.kind !== "ready") {
    await markAppointmentSyncDisabled(after.id, calendarAccess.reason);

    if (calendarAccess.kind === "error") {
      await markUserSyncFailure(after.manicureId, new Error(calendarAccess.reason));
    }

    return;
  }

  try {
    const eventPayload = await buildCalendarEventPayload(after);

    if (after.googleEventId) {
      await updateGoogleCalendarEvent(
        calendarAccess.access.refreshToken,
        calendarAccess.access.calendarId,
        after.googleEventId,
        eventPayload
      );

      await Promise.all([
        markAppointmentSyncSuccess(after.id),
        markUserSyncSuccess(after.manicureId),
      ]);
      return;
    }

    const createdEventId = await createGoogleCalendarEvent(
      calendarAccess.access.refreshToken,
      calendarAccess.access.calendarId,
      eventPayload
    );

    await Promise.all([
      markAppointmentSyncSuccess(after.id, createdEventId),
      markUserSyncSuccess(after.manicureId),
    ]);
  } catch (error) {
    await Promise.all([
      markAppointmentSyncFailure(after.id, error),
      markUserSyncFailure(after.manicureId, error),
    ]);
    throw error;
  }
}

async function migrateAppointmentEventOwnership(
  before: AppointmentData,
  after: AppointmentData
): Promise<void> {
  const oldAccess = await readGoogleCalendarAccess(before.manicureId);

  if (oldAccess.kind === "ready" && before.googleEventId) {
    try {
      await deleteGoogleCalendarEvent(
        oldAccess.access.refreshToken,
        oldAccess.access.calendarId,
        before.googleEventId
      );
      await markUserSyncSuccess(before.manicureId);
    } catch (error) {
      await markUserSyncFailure(before.manicureId, error);
      logger.error("Failed to remove event from old manicure calendar", {
        appointmentId: before.id,
        oldManicureId: before.manicureId,
        error: normalizeErrorMessage(error),
      });
    }
  }

  await syncCreatedAppointmentToGoogle(after);
}

export async function syncDeletedAppointmentToGoogle(
  appointment: AppointmentData
): Promise<void> {
  if (!appointment.googleEventId) {
    return;
  }

  const calendarAccess = await readGoogleCalendarAccess(appointment.manicureId);

  if (calendarAccess.kind !== "ready") {
    return;
  }

  try {
    await deleteGoogleCalendarEvent(
      calendarAccess.access.refreshToken,
      calendarAccess.access.calendarId,
      appointment.googleEventId
    );

    await markUserSyncSuccess(appointment.manicureId);
  } catch (error) {
    await markUserSyncFailure(appointment.manicureId, error);
    throw error;
  }
}
