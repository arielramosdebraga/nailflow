/* eslint-disable require-jsdoc */
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {
  ensureDedicatedCalendar,
  exchangeCodeForRefreshToken,
} from "./calendar-client";
import {
  createOAuthStateToken,
  getGoogleCalendarScopes,
  getGoogleOAuthConfig,
  getOAuthStateTtlMs,
} from "./config";
import {readGoogleCalendarProfile, toIsoString} from "./models";
import {hashOAuthState, isOAuthStateValid} from "./oauth-state";
import {
  decryptRefreshToken,
  encryptRefreshToken,
  getCurrentGoogleTokenVersion,
} from "./token-crypto";
import {enqueueGoogleCalendarSyncTask} from "./sync-queue";
import {ensureGoogleCalendarWatchForUser} from "./watch-management";
import {getUserProfile, requireAuthenticatedUid} from "../shared/user-context";

function assertGoogleCalendarRole(role: string): void {
  if (
    role !== "super_admin" &&
    role !== "nail_technician" &&
    role !== "manicure" &&
    role !== "salon_owner"
  ) {
    throw new HttpsError(
      "permission-denied",
      "Somente super_admin, nail_technician ou salon_owner podem conectar Google Calendar."
    );
  }
}

function getRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ?
    (value as Record<string, unknown>) :
    {};
}

function readRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpsError(
      "invalid-argument",
      `${fieldName} e obrigatorio para concluir a conexao Google Calendar.`
    );
  }

  return value.trim();
}

export const getGoogleCalendarStatus = onCall(async (request) => {
  const uid = requireAuthenticatedUid(request);
  const profile = await getUserProfile(uid);
  assertGoogleCalendarRole(profile.role);
  const userSnapshot = await getFirestore().collection("users").doc(uid).get();
  const googleCalendar = readGoogleCalendarProfile(userSnapshot.data());

  return {
    connected: googleCalendar.connected,
    calendarId: googleCalendar.calendarId,
    syncStatus: googleCalendar.syncStatus,
    watchChannelId: googleCalendar.watchChannelId,
    watchResourceId: googleCalendar.watchResourceId,
    watchExpiration: toIsoString(googleCalendar.watchExpiration),
    syncToken: googleCalendar.syncToken,
    lastInboundSyncAt: toIsoString(googleCalendar.lastInboundSyncAt),
    lastSyncedAt: toIsoString(googleCalendar.lastSyncedAt),
    lastErrorAt: toIsoString(googleCalendar.lastErrorAt),
    lastErrorMessage: googleCalendar.lastErrorMessage,
    tokenVersion: googleCalendar.tokenVersion,
  };
});

export const beginGoogleCalendarConnection = onCall(async (request) => {
  const uid = requireAuthenticatedUid(request);
  const profile = await getUserProfile(uid);
  assertGoogleCalendarRole(profile.role);
  const state = createOAuthStateToken();
  const stateHash = hashOAuthState(state);
  const ttlMs = getOAuthStateTtlMs();
  const expiresAt = new Date(Date.now() + ttlMs);
  const oauthConfig = getGoogleOAuthConfig();
  const scopes = getGoogleCalendarScopes();

  await getFirestore().collection("users").doc(uid).set(
    {
      googleCalendar: {
        oauthStateHash: stateHash,
        oauthStateExpiresAt: expiresAt,
        syncStatus: "authorizing",
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true}
  );

  return {
    clientId: oauthConfig.clientId,
    redirectUri: oauthConfig.redirectUri,
    scopes,
    state,
    prompt: "consent",
    discovery: {
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenEndpoint: "https://oauth2.googleapis.com/token",
      revocationEndpoint: "https://oauth2.googleapis.com/revoke",
    },
    extraParams: {
      access_type: "offline",
      include_granted_scopes: "true",
    },
    expiresAt: expiresAt.toISOString(),
  };
});

export const completeGoogleCalendarConnection = onCall(async (request) => {
  const uid = requireAuthenticatedUid(request);
  const payload = getRecord(request.data);
  const code = readRequiredString(payload.code, "code");
  const state = readRequiredString(payload.state, "state");

  const [userProfile, userSnapshot] = await Promise.all([
    getUserProfile(uid),
    getFirestore().collection("users").doc(uid).get(),
  ]);
  assertGoogleCalendarRole(userProfile.role);

  const googleCalendar = readGoogleCalendarProfile(userSnapshot.data());

  if (!googleCalendar.oauthStateHash || !googleCalendar.oauthStateExpiresAt) {
    throw new HttpsError(
      "failed-precondition",
      "Fluxo OAuth invalido. Inicie a conexao novamente."
    );
  }

  if (googleCalendar.oauthStateExpiresAt.getTime() < Date.now()) {
    throw new HttpsError(
      "deadline-exceeded",
      "Fluxo OAuth expirou. Gere um novo link de conexao."
    );
  }

  if (!isOAuthStateValid(googleCalendar.oauthStateHash, state)) {
    throw new HttpsError("permission-denied", "State OAuth invalido.");
  }

  let refreshToken: string | null = null;

  try {
    const exchangeResult = await exchangeCodeForRefreshToken(code);
    refreshToken = exchangeResult.refreshToken;

    if (!refreshToken && googleCalendar.encryptedRefreshToken) {
      refreshToken = decryptRefreshToken(googleCalendar.encryptedRefreshToken);
    }

    if (!refreshToken) {
      throw new HttpsError(
        "failed-precondition",
        "Google nao retornou refresh token. Reconecte com consentimento completo."
      );
    }

    const calendarId = await ensureDedicatedCalendar(refreshToken, {
      displayName: userProfile.displayName,
      email: userProfile.email,
      uid,
    });

    const encryptedRefreshToken = encryptRefreshToken(refreshToken);

    await getFirestore().collection("users").doc(uid).set(
      {
        googleCalendar: {
          connected: true,
          calendarId,
          syncStatus: "synced",
          lastSyncedAt: FieldValue.serverTimestamp(),
          lastErrorAt: null,
          lastErrorMessage: null,
          encryptedRefreshToken,
          tokenVersion: getCurrentGoogleTokenVersion(),
          oauthStateHash: null,
          oauthStateExpiresAt: null,
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      {merge: true}
    );

    await ensureGoogleCalendarWatchForUser(uid, {forceRenew: true});
    await enqueueGoogleCalendarSyncTask({
      userId: uid,
      source: "watch_renewal",
      forceFull: true,
    });

    return {
      connected: true,
      calendarId,
      syncStatus: "synced",
    };
  } catch (error) {
    const message =
      error instanceof HttpsError ?
        error.message :
        "Falha ao concluir conexao com Google Calendar.";

    await getFirestore().collection("users").doc(uid).set(
      {
        googleCalendar: {
          syncStatus: "error",
          lastErrorAt: FieldValue.serverTimestamp(),
          lastErrorMessage: message,
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      {merge: true}
    );

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", "Nao foi possivel concluir a conexao Google Calendar.");
  }
});

export const refreshGoogleCalendarWatch = onCall(async (request) => {
  const uid = requireAuthenticatedUid(request);
  const profile = await getUserProfile(uid);
  assertGoogleCalendarRole(profile.role);

  const watchResult = await ensureGoogleCalendarWatchForUser(uid, {
    forceRenew: true,
  });

  const queued = await enqueueGoogleCalendarSyncTask({
    userId: uid,
    source: "watch_renewal",
    forceFull: true,
  });

  return {
    ok: true,
    renewed: watchResult.renewed,
    watchChannelId: watchResult.watchChannelId,
    watchResourceId: watchResult.watchResourceId,
    watchExpiration: watchResult.watchExpiration?.toISOString() ?? null,
    queue: queued,
  };
});
