/* eslint-disable require-jsdoc */
import {createHash, createHmac, randomUUID, timingSafeEqual} from "node:crypto";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {
  startGoogleCalendarWatch,
  stopGoogleCalendarWatch,
} from "./calendar-client";
import {
  getGoogleCalendarWatchRenewAheadMs,
  getGoogleCalendarWatchTokenSecret,
  getGoogleCalendarWebhookUrl,
} from "./config";
import {readGoogleCalendarProfile} from "./models";
import {decryptRefreshToken} from "./token-crypto";

export interface EnsureWatchOptions {
  forceRenew?: boolean;
}

export interface EnsureWatchResult {
  userId: string;
  connected: boolean;
  renewed: boolean;
  watchChannelId: string | null;
  watchResourceId: string | null;
  watchExpiration: Date | null;
}

export interface WatchChannelUserMatch {
  userId: string;
  watchResourceId: string | null;
  watchExpiration: Date | null;
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("base64url");
}

function buildChannelToken(userId: string, channelId: string): string {
  const payload = `${userId}:${channelId}`;
  const signature = createHmac("sha256", getGoogleCalendarWatchTokenSecret())
    .update(payload, "utf8")
    .digest("base64url");

  return `${userId}.${signature}`;
}

function isValidChannelToken(
  providedToken: string | null,
  expectedHash: string | null
): boolean {
  if (!providedToken || !expectedHash) {
    return false;
  }

  const providedHash = hashToken(providedToken);
  const providedBuffer = Buffer.from(providedHash, "base64url");
  const expectedBuffer = Buffer.from(expectedHash, "base64url");

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

async function readUserRefreshToken(userId: string): Promise<{
  calendarId: string;
  refreshToken: string;
  watchChannelId: string | null;
  watchResourceId: string | null;
  watchExpiration: Date | null;
}> {
  const userSnapshot = await getFirestore().collection("users").doc(userId).get();

  if (!userSnapshot.exists) {
    throw new Error("Usuario nao encontrado para renovacao de watch channel.");
  }

  const googleCalendar = readGoogleCalendarProfile(userSnapshot.data());

  if (!googleCalendar.connected) {
    throw new Error("Usuario nao conectado ao Google Calendar.");
  }

  if (!googleCalendar.calendarId) {
    throw new Error("Usuario conectado sem calendarId para watch channel.");
  }

  if (!googleCalendar.encryptedRefreshToken) {
    throw new Error("Usuario conectado sem refresh token criptografado.");
  }

  return {
    calendarId: googleCalendar.calendarId,
    refreshToken: decryptRefreshToken(googleCalendar.encryptedRefreshToken),
    watchChannelId: googleCalendar.watchChannelId,
    watchResourceId: googleCalendar.watchResourceId,
    watchExpiration: googleCalendar.watchExpiration,
  };
}

export async function ensureGoogleCalendarWatchForUser(
  userId: string,
  options: EnsureWatchOptions = {}
): Promise<EnsureWatchResult> {
  const parsedUserId = userId.trim();

  if (parsedUserId.length === 0) {
    throw new Error("userId e obrigatorio para renovar watch channel.");
  }

  const data = await readUserRefreshToken(parsedUserId);
  const now = Date.now();
  const renewAheadMs = getGoogleCalendarWatchRenewAheadMs();
  const expiresAtMs = data.watchExpiration?.getTime() ?? null;
  const shouldRenew =
    options.forceRenew === true ||
    !expiresAtMs ||
    expiresAtMs <= now + renewAheadMs;

  if (!shouldRenew) {
    return {
      userId: parsedUserId,
      connected: true,
      renewed: false,
      watchChannelId: data.watchChannelId,
      watchResourceId: data.watchResourceId,
      watchExpiration: data.watchExpiration,
    };
  }

  if (data.watchChannelId && data.watchResourceId) {
    try {
      await stopGoogleCalendarWatch(
        data.refreshToken,
        data.watchChannelId,
        data.watchResourceId
      );
    } catch (error) {
      logger.warn("Failed to stop previous watch channel", {
        userId: parsedUserId,
        watchChannelId: data.watchChannelId,
        watchResourceId: data.watchResourceId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const newChannelId = randomUUID();
  const channelToken = buildChannelToken(parsedUserId, newChannelId);
  const watchResponse = await startGoogleCalendarWatch(
    data.refreshToken,
    data.calendarId,
    {
      id: newChannelId,
      address: getGoogleCalendarWebhookUrl(),
      token: channelToken,
    }
  );

  await getFirestore().collection("users").doc(parsedUserId).set(
    {
      googleCalendar: {
        watchChannelId: watchResponse.channelId,
        watchResourceId: watchResponse.resourceId,
        watchExpiration: watchResponse.expiration,
        watchChannelTokenHash: hashToken(channelToken),
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true}
  );

  return {
    userId: parsedUserId,
    connected: true,
    renewed: true,
    watchChannelId: watchResponse.channelId,
    watchResourceId: watchResponse.resourceId,
    watchExpiration: watchResponse.expiration,
  };
}

export async function findUserByWatchChannel(
  channelId: string,
  resourceId: string | null,
  channelToken: string | null
): Promise<WatchChannelUserMatch | null> {
  const parsedChannelId = channelId.trim();

  if (parsedChannelId.length === 0) {
    return null;
  }

  const querySnapshot = await getFirestore()
    .collection("users")
    .where("googleCalendar.watchChannelId", "==", parsedChannelId)
    .limit(5)
    .get();

  if (querySnapshot.empty) {
    return null;
  }

  for (const userDoc of querySnapshot.docs) {
    const googleCalendar = readGoogleCalendarProfile(userDoc.data());
    const rawData = userDoc.data() as Record<string, unknown>;
    const googleRecord =
      typeof rawData.googleCalendar === "object" &&
      rawData.googleCalendar !== null ?
        (rawData.googleCalendar as Record<string, unknown>) :
        {};
    const storedTokenHash = normalizeString(googleRecord.watchChannelTokenHash);

    if (
      resourceId &&
      googleCalendar.watchResourceId &&
      googleCalendar.watchResourceId !== resourceId
    ) {
      continue;
    }

    if (!isValidChannelToken(channelToken, storedTokenHash)) {
      continue;
    }

    return {
      userId: userDoc.id,
      watchResourceId: googleCalendar.watchResourceId,
      watchExpiration: googleCalendar.watchExpiration,
    };
  }

  return null;
}

