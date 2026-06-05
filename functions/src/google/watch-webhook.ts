/* eslint-disable require-jsdoc */
import * as logger from "firebase-functions/logger";
import {onRequest} from "firebase-functions/v2/https";
import {enqueueGoogleCalendarSyncTask} from "./sync-queue";
import {findUserByWatchChannel} from "./watch-management";

function readHeader(headers: Record<string, unknown>, name: string): string | null {
  const raw = headers[name.toLowerCase()];

  if (typeof raw !== "string") {
    return null;
  }

  const parsed = raw.trim();
  return parsed.length > 0 ? parsed : null;
}

export const receiveGoogleCalendarWatchWebhook = onRequest(async (request, response) => {
  if (request.method !== "POST") {
    response.status(405).json({ok: false, message: "Method not allowed"});
    return;
  }

  const channelId = readHeader(request.headers, "x-goog-channel-id");
  const resourceId = readHeader(request.headers, "x-goog-resource-id");
  const resourceState = readHeader(request.headers, "x-goog-resource-state");
  const messageNumber = readHeader(request.headers, "x-goog-message-number");
  const channelToken = readHeader(request.headers, "x-goog-channel-token");

  if (!channelId || !resourceId || !resourceState) {
    response.status(204).send();
    return;
  }

  const userMatch = await findUserByWatchChannel(channelId, resourceId, channelToken);

  if (!userMatch) {
    logger.warn("Google watch webhook with unknown channel", {
      channelId,
      resourceId,
      resourceState,
      messageNumber,
    });
    response.status(202).json({ok: true, accepted: false});
    return;
  }

  if (resourceState === "sync" && messageNumber === "1") {
    response.status(200).json({ok: true, accepted: true, skipped: "initial-sync"});
    return;
  }

  const queued = await enqueueGoogleCalendarSyncTask({
    userId: userMatch.userId,
    source: "google_webhook",
    channelId,
    resourceId,
    resourceState,
    messageNumber,
    forceFull: resourceState === "not_exists",
  });

  response.status(202).json({
    ok: true,
    accepted: true,
    userId: userMatch.userId,
    queued,
  });
});

