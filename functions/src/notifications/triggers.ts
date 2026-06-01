/* eslint-disable require-jsdoc */
import {QueryDocumentSnapshot, getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {dispatchNotificationToUser} from "./dispatcher";
import {readUserNotificationProfile} from "./models";

const SCHEDULER_TIMEZONE = "America/Sao_Paulo";
const PRE_REMINDER_USER_LIMIT = 250;
const APPOINTMENT_STATUSES_FOR_REMINDER = ["scheduled", "confirmed"];

interface AppointmentSummary {
  id: string;
  salonId: string | null;
  manicureId: string;
  status: string;
  startTime: Date | null;
  endTime: Date | null;
  updatedAt: Date | null;
}

function readRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  return value as Record<string, unknown>;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readNullableString(value: unknown): string | null {
  const normalizedValue = readString(value);
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value !== "object" || value === null) {
    return null;
  }

  const maybeTimestamp = value as {toDate?: () => Date};

  if (typeof maybeTimestamp.toDate !== "function") {
    return null;
  }

  return maybeTimestamp.toDate();
}

function formatDateTime(date: Date | null): string {
  if (!date) {
    return "horario indisponivel";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: SCHEDULER_TIMEZONE,
  }).format(date);
}

function formatTime(date: Date | null): string {
  if (!date) {
    return "horario indisponivel";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: SCHEDULER_TIMEZONE,
  }).format(date);
}

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function readAppointmentSummary(
  id: string,
  sourceData: Record<string, unknown> | undefined
): AppointmentSummary {
  const data = sourceData ?? {};

  return {
    id,
    salonId: readNullableString(data.salonId),
    manicureId: readString(data.manicureId),
    status: readString(data.status).toLowerCase() || "scheduled",
    startTime: toDate(data.startTime),
    endTime: toDate(data.endTime),
    updatedAt: toDate(data.updatedAt),
  };
}

function hasAppointmentBeenRescheduled(
  before: AppointmentSummary,
  after: AppointmentSummary
): boolean {
  return toIso(before.startTime) !== toIso(after.startTime) ||
    toIso(before.endTime) !== toIso(after.endTime);
}

function buildAppointmentTargets(
  beforeManicureId: string,
  afterManicureId: string
): string[] {
  const targets = new Set<string>();

  if (beforeManicureId.trim().length > 0) {
    targets.add(beforeManicureId.trim());
  }

  if (afterManicureId.trim().length > 0) {
    targets.add(afterManicureId.trim());
  }

  return [...targets];
}

function readGoogleSyncStatus(userData: Record<string, unknown>): string {
  const googleCalendar = readRecord(userData.googleCalendar);
  return readString(googleCalendar.syncStatus).toLowerCase();
}

function readGoogleLastErrorMessage(userData: Record<string, unknown>): string {
  const googleCalendar = readRecord(userData.googleCalendar);
  const errorMessage = readString(googleCalendar.lastErrorMessage);

  if (errorMessage.length > 0) {
    return errorMessage;
  }

  return "Falha ao sincronizar com Google Agenda.";
}

function readGoogleLastErrorDate(userData: Record<string, unknown>): Date | null {
  const googleCalendar = readRecord(userData.googleCalendar);
  return toDate(googleCalendar.lastErrorAt);
}

export const onAppointmentCreatedNotifyUsers = onDocumentCreated(
  "appointments/{appointmentId}",
  async (event) => {
    const snapshot = event.data;

    if (!snapshot) {
      return;
    }

    const appointment = readAppointmentSummary(snapshot.id, snapshot.data());

    if (!appointment.salonId || appointment.manicureId.length === 0) {
      return;
    }

    await dispatchNotificationToUser({
      userId: appointment.manicureId,
      salonId: appointment.salonId,
      type: "new_appointment",
      title: "Novo agendamento",
      body: `Voce recebeu um novo agendamento para ${formatDateTime(
        appointment.startTime
      )}.`,
      data: {
        appointmentId: appointment.id,
        type: "new_appointment",
        startTime: toIso(appointment.startTime),
      },
      dedupeKey: `new_appointment:${appointment.id}`,
    });
  }
);

export const onAppointmentUpdatedNotifyUsers = onDocumentUpdated(
  "appointments/{appointmentId}",
  async (event) => {
    const beforeSnapshot = event.data?.before;
    const afterSnapshot = event.data?.after;

    if (!beforeSnapshot || !afterSnapshot) {
      return;
    }

    const before = readAppointmentSummary(beforeSnapshot.id, beforeSnapshot.data());
    const after = readAppointmentSummary(afterSnapshot.id, afterSnapshot.data());

    const targets = buildAppointmentTargets(before.manicureId, after.manicureId);

    if (targets.length === 0 || !after.salonId) {
      return;
    }

    if (before.status !== "cancelled" && after.status === "cancelled") {
      await Promise.all(
        targets.map((targetUserId) =>
          dispatchNotificationToUser({
            userId: targetUserId,
            salonId: after.salonId,
            type: "appointment_canceled",
            title: "Atendimento cancelado",
            body: `O atendimento de ${formatDateTime(
              after.startTime
            )} foi cancelado.`,
            data: {
              appointmentId: after.id,
              type: "appointment_canceled",
              startTime: toIso(after.startTime),
            },
            dedupeKey: `appointment_canceled:${targetUserId}:${
              after.id
            }:${toIso(after.updatedAt) ?? "no-updated-at"}`,
          })
        )
      );
      return;
    }

    if (after.status !== "cancelled" && hasAppointmentBeenRescheduled(before, after)) {
      await Promise.all(
        targets.map((targetUserId) =>
          dispatchNotificationToUser({
            userId: targetUserId,
            salonId: after.salonId,
            type: "appointment_rescheduled",
            title: "Atendimento reagendado",
            body: `O atendimento foi reagendado para ${formatDateTime(
              after.startTime
            )}.`,
            data: {
              appointmentId: after.id,
              type: "appointment_rescheduled",
              previousStartTime: toIso(before.startTime),
              newStartTime: toIso(after.startTime),
            },
            dedupeKey: `appointment_rescheduled:${targetUserId}:${
              after.id
            }:${toIso(after.startTime) ?? "no-start-time"}`,
          })
        )
      );
    }
  }
);

export const onUserGoogleStatusUpdatedNotifyUsers = onDocumentUpdated(
  "users/{userId}",
  async (event) => {
    const beforeSnapshot = event.data?.before;
    const afterSnapshot = event.data?.after;

    if (!beforeSnapshot || !afterSnapshot) {
      return;
    }

    const beforeData = beforeSnapshot.data() ?? {};
    const afterData = afterSnapshot.data() ?? {};
    const userId = afterSnapshot.id;
    const salonId = readNullableString(afterData.salonId);

    const beforeStatus = readGoogleSyncStatus(beforeData);
    const afterStatus = readGoogleSyncStatus(afterData);

    if (beforeStatus === afterStatus) {
      return;
    }

    if (afterStatus === "error") {
      const errorDateIso =
        toIso(readGoogleLastErrorDate(afterData)) ?? "no-error-date";

      await dispatchNotificationToUser({
        userId,
        salonId,
        type: "sync_error",
        title: "Falha na sincronizacao",
        body: readGoogleLastErrorMessage(afterData),
        data: {
          type: "sync_error",
          syncStatus: afterStatus,
        },
        dedupeKey: `sync_error:${userId}:${errorDateIso}`,
      });
      return;
    }

    if (afterStatus === "expired") {
      const errorDateIso =
        toIso(readGoogleLastErrorDate(afterData)) ?? "no-error-date";

      await dispatchNotificationToUser({
        userId,
        salonId,
        type: "google_expired",
        title: "Conexao Google expirada",
        body: "Reconecte sua conta Google Agenda para retomar a sincronizacao.",
        data: {
          type: "google_expired",
          syncStatus: afterStatus,
        },
        dedupeKey: `google_expired:${userId}:${errorDateIso}`,
      });
    }
  }
);

interface ReminderUserTarget {
  userId: string;
  salonId: string | null;
  preReminderMinutes: number;
}

function normalizePreReminderMinutes(value: number): number {
  const parsedValue = Math.floor(value);

  if (parsedValue < 5) {
    return 5;
  }

  if (parsedValue > 1440) {
    return 1440;
  }

  return parsedValue;
}

async function loadUsersForPreReminder(limit: number): Promise<ReminderUserTarget[]> {
  const users: ReminderUserTarget[] = [];
  let cursor: QueryDocumentSnapshot | null = null;

  while (users.length < limit) {
    let query = getFirestore()
      .collection("users")
      .where("notificationPreferences.preReminder", "==", true)
      .limit(Math.min(100, limit - users.length));

    if (cursor) {
      query = query.startAfter(cursor);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      break;
    }

    for (const doc of snapshot.docs) {
      const profile = readUserNotificationProfile(doc.id, doc.data());

      users.push({
        userId: doc.id,
        salonId: profile.salonId,
        preReminderMinutes: normalizePreReminderMinutes(
          profile.preferences.preReminderMinutes
        ),
      });
    }

    cursor = snapshot.docs[snapshot.docs.length - 1] ?? null;
  }

  return users;
}

async function listUpcomingAppointmentsForUser(
  userId: string,
  now: Date,
  windowEnd: Date
): Promise<AppointmentSummary[]> {
  const docsById = new Map<string, QueryDocumentSnapshot>();

  for (const status of APPOINTMENT_STATUSES_FOR_REMINDER) {
    const snapshot = await getFirestore()
      .collection("appointments")
      .where("manicureId", "==", userId)
      .where("status", "==", status)
      .where("startTime", ">=", now)
      .where("startTime", "<=", windowEnd)
      .limit(100)
      .get();

    snapshot.docs.forEach((doc) => {
      docsById.set(doc.id, doc);
    });
  }

  return [...docsById.values()].map((doc) =>
    readAppointmentSummary(doc.id, doc.data())
  );
}

export const sendPreReminderNotifications = onSchedule(
  {
    schedule: "every 10 minutes",
    timeZone: SCHEDULER_TIMEZONE,
    memory: "512MiB",
    timeoutSeconds: 540,
  },
  async () => {
    const users = await loadUsersForPreReminder(PRE_REMINDER_USER_LIMIT);
    const now = new Date();

    let notificationsCreated = 0;
    let usersProcessed = 0;
    let errors = 0;

    for (const user of users) {
      usersProcessed += 1;

      try {
        const windowEnd = new Date(
          now.getTime() + user.preReminderMinutes * 60 * 1000
        );
        const appointments = await listUpcomingAppointmentsForUser(
          user.userId,
          now,
          windowEnd
        );

        for (const appointment of appointments) {
          if (!appointment.salonId || !appointment.startTime) {
            continue;
          }

          const result = await dispatchNotificationToUser({
            userId: user.userId,
            salonId: user.salonId ?? appointment.salonId,
            type: "pre_reminder",
            title: "Lembrete de atendimento",
            body: `Voce tem um atendimento as ${formatTime(
              appointment.startTime
            )}.`,
            data: {
              appointmentId: appointment.id,
              type: "pre_reminder",
              startTime: toIso(appointment.startTime),
            },
            dedupeKey: `pre_reminder:${user.userId}:${appointment.id}:${
              toIso(appointment.startTime) ?? "no-start-time"
            }`,
          });

          if (result.createdNotification) {
            notificationsCreated += 1;
          }
        }
      } catch (error) {
        errors += 1;
        logger.error("Failed to process pre-reminder notifications for user", {
          userId: user.userId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info("Pre-reminder notifications job finished", {
      usersProcessed,
      notificationsCreated,
      errors,
    });
  }
);

