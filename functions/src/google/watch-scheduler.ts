/* eslint-disable require-jsdoc */
import {QueryDocumentSnapshot, getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {enqueueGoogleCalendarSyncTask} from "./sync-queue";
import {ensureGoogleCalendarWatchForUser} from "./watch-management";

const SCHEDULER_TIMEZONE = "America/Sao_Paulo";
const WATCH_RENEW_BATCH_SIZE = 200;
const RECONCILE_BATCH_SIZE = 200;

interface ConnectedUser {
  userId: string;
}

async function loadConnectedUsers(limit: number): Promise<ConnectedUser[]> {
  const users: ConnectedUser[] = [];
  let cursor: QueryDocumentSnapshot | null = null;

  while (users.length < limit) {
    let query = getFirestore()
      .collection("users")
      .where("googleCalendar.connected", "==", true)
      .limit(Math.min(100, limit - users.length));

    if (cursor) {
      query = query.startAfter(cursor);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      break;
    }

    for (const doc of snapshot.docs) {
      users.push({userId: doc.id});
    }

    cursor = snapshot.docs[snapshot.docs.length - 1] ?? null;
  }

  return users;
}

export const renewGoogleCalendarWatchChannels = onSchedule(
  {
    schedule: "every 6 hours",
    timeZone: SCHEDULER_TIMEZONE,
    memory: "512MiB",
    timeoutSeconds: 540,
  },
  async () => {
    const users = await loadConnectedUsers(WATCH_RENEW_BATCH_SIZE);

    let renewedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const user of users) {
      try {
        const result = await ensureGoogleCalendarWatchForUser(user.userId, {
          forceRenew: false,
        });

        if (result.renewed) {
          renewedCount += 1;
        } else {
          skippedCount += 1;
        }
      } catch (error) {
        failedCount += 1;
        logger.error("Failed to renew watch channel", {
          userId: user.userId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info("Google watch renewal finished", {
      totalUsers: users.length,
      renewedCount,
      skippedCount,
      failedCount,
    });
  }
);

export const reconcileGoogleCalendarAtNight = onSchedule(
  {
    schedule: "0 3 * * *",
    timeZone: SCHEDULER_TIMEZONE,
    memory: "512MiB",
    timeoutSeconds: 540,
  },
  async () => {
    const users = await loadConnectedUsers(RECONCILE_BATCH_SIZE);
    let createdJobs = 0;
    let reusedJobs = 0;
    let failedUsers = 0;

    for (const user of users) {
      try {
        const queued = await enqueueGoogleCalendarSyncTask({
          userId: user.userId,
          source: "full_reconciliation",
          forceFull: true,
        });

        if (queued.created) {
          createdJobs += 1;
        } else {
          reusedJobs += 1;
        }
      } catch (error) {
        failedUsers += 1;
        logger.error("Failed to enqueue full reconciliation job", {
          userId: user.userId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info("Google full reconciliation queueing finished", {
      totalUsers: users.length,
      createdJobs,
      reusedJobs,
      failedUsers,
    });
  }
);

