/* eslint-disable require-jsdoc */
import {randomUUID} from "node:crypto";
import {FieldValue, QueryDocumentSnapshot, getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {
  InboundGoogleCalendarSyncResult,
  syncInboundGoogleCalendarIncremental,
} from "./inbound-sync";

type SyncQueueStatus = "pending" | "processing" | "done" | "error";
export type SyncQueueSource =
  | "google_webhook"
  | "watch_renewal"
  | "full_reconciliation";

interface EnqueueSyncTaskInput {
  userId: string;
  source: SyncQueueSource;
  channelId?: string | null;
  resourceId?: string | null;
  resourceState?: string | null;
  messageNumber?: string | null;
  forceFull?: boolean;
}

interface SyncQueueJob {
  userId: string;
  source: SyncQueueSource;
  status: SyncQueueStatus;
  attempts: number;
  maxAttempts: number;
  forceFull: boolean;
  channelId: string | null;
  resourceId: string | null;
  resourceState: string | null;
  messageNumber: string | null;
}

const SYNC_QUEUE_COLLECTION = "syncQueue";
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1500;

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function parseJob(snapshot: QueryDocumentSnapshot): SyncQueueJob {
  const raw = snapshot.data() as Record<string, unknown>;

  const source: SyncQueueSource =
    raw.source === "watch_renewal" || raw.source === "full_reconciliation" ?
      raw.source :
      "google_webhook";
  const status: SyncQueueStatus =
    raw.status === "processing" || raw.status === "done" || raw.status === "error" ?
      raw.status :
      "pending";

  return {
    userId: normalizeString(raw.userId) ?? "",
    source,
    status,
    attempts: normalizeNumber(raw.attempts, 0),
    maxAttempts: Math.max(1, normalizeNumber(raw.maxAttempts, MAX_ATTEMPTS)),
    forceFull: raw.forceFull === true,
    channelId: normalizeString(raw.channelId),
    resourceId: normalizeString(raw.resourceId),
    resourceState: normalizeString(raw.resourceState),
    messageNumber: normalizeString(raw.messageNumber),
  };
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Falha ao processar tarefa da fila de sincronizacao Google.";
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function updateJob(
  jobRef: FirebaseFirestore.DocumentReference,
  payload: Record<string, unknown>
): Promise<void> {
  await jobRef.set(
    {
      ...payload,
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true}
  );
}

async function processSyncJob(job: SyncQueueJob): Promise<InboundGoogleCalendarSyncResult> {
  return syncInboundGoogleCalendarIncremental({
    userId: job.userId,
    forceFullSync: job.forceFull,
  });
}

export async function enqueueGoogleCalendarSyncTask(
  input: EnqueueSyncTaskInput
): Promise<{jobId: string; created: boolean}> {
  const userId = input.userId.trim();

  if (userId.length === 0) {
    throw new Error("userId e obrigatorio para enfileirar sincronizacao Google.");
  }

  const queueRef = getFirestore().collection(SYNC_QUEUE_COLLECTION);
  const activeJobsSnapshot = await queueRef
    .where("userId", "==", userId)
    .where("status", "in", ["pending", "processing"])
    .limit(10)
    .get();

  if (!activeJobsSnapshot.empty) {
    return {
      jobId: activeJobsSnapshot.docs[0].id,
      created: false,
    };
  }

  const jobRef = queueRef.doc(randomUUID());

  await jobRef.set({
    userId,
    source: input.source,
    status: "pending",
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
    forceFull: input.forceFull === true,
    channelId: normalizeString(input.channelId),
    resourceId: normalizeString(input.resourceId),
    resourceState: normalizeString(input.resourceState),
    messageNumber: normalizeString(input.messageNumber),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    startedAt: null,
    finishedAt: null,
    errorMessage: null,
    syncSummary: null,
  });

  return {
    jobId: jobRef.id,
    created: true,
  };
}

export const onGoogleCalendarSyncQueueCreated = onDocumentCreated(
  `${SYNC_QUEUE_COLLECTION}/{jobId}`,
  async (event) => {
    const snapshot = event.data;

    if (!snapshot) {
      return;
    }

    const job = parseJob(snapshot);

    if (job.userId.length === 0) {
      await updateJob(snapshot.ref, {
        status: "error",
        errorMessage: "Job invalido: userId ausente.",
        finishedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    let processed = false;

    for (let attempt = 1; attempt <= job.maxAttempts; attempt += 1) {
      await updateJob(snapshot.ref, {
        status: "processing",
        attempts: attempt,
        startedAt: FieldValue.serverTimestamp(),
        errorMessage: null,
      });

      try {
        const syncResult = await processSyncJob(job);
        await updateJob(snapshot.ref, {
          status: "done",
          attempts: attempt,
          finishedAt: FieldValue.serverTimestamp(),
          syncSummary: syncResult,
        });
        processed = true;
        break;
      } catch (error) {
        const errorMessage = normalizeErrorMessage(error);
        const hasRetry = attempt < job.maxAttempts;

        if (!hasRetry) {
          await updateJob(snapshot.ref, {
            status: "error",
            attempts: attempt,
            finishedAt: FieldValue.serverTimestamp(),
            errorMessage,
          });
          logger.error("Google sync queue job failed", {
            jobId: snapshot.id,
            userId: job.userId,
            source: job.source,
            error: errorMessage,
          });
          break;
        }

        await updateJob(snapshot.ref, {
          status: "pending",
          attempts: attempt,
          errorMessage: `Tentativa ${attempt} falhou: ${errorMessage}`,
        });

        await delay(RETRY_BASE_DELAY_MS * attempt);
      }
    }

    if (!processed) {
      logger.warn("Google sync queue finished without success", {
        jobId: snapshot.id,
        userId: job.userId,
        source: job.source,
      });
    }
  }
);

