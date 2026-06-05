/* eslint-disable require-jsdoc */
import {randomBytes} from "node:crypto";

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

const DEFAULT_WATCH_RENEW_AHEAD_SECONDS = 6 * 60 * 60;
const DEFAULT_RECONCILE_LOOKBACK_DAYS = 90;

const GOOGLE_CALENDAR_SCOPES: readonly string[] = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

const DEFAULT_OAUTH_STATE_TTL_SECONDS = 600;

function requireEnvValue(
  value: string | undefined,
  envName: string
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${envName}`);
  }

  return value.trim();
}

export function getGoogleOAuthConfig(): GoogleOAuthConfig {
  return {
    clientId: requireEnvValue(
      process.env.GOOGLE_CALENDAR_CLIENT_ID,
      "GOOGLE_CALENDAR_CLIENT_ID"
    ),
    clientSecret: requireEnvValue(
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      "GOOGLE_CALENDAR_CLIENT_SECRET"
    ),
    redirectUri: requireEnvValue(
      process.env.GOOGLE_CALENDAR_REDIRECT_URI,
      "GOOGLE_CALENDAR_REDIRECT_URI"
    ),
  };
}

export function getGoogleCalendarScopes(): string[] {
  return [...GOOGLE_CALENDAR_SCOPES];
}

export function getGoogleCalendarWebhookUrl(): string {
  return requireEnvValue(
    process.env.GOOGLE_CALENDAR_WEBHOOK_URL,
    "GOOGLE_CALENDAR_WEBHOOK_URL"
  );
}

export function getGoogleCalendarWatchTokenSecret(): string {
  const explicitSecret = process.env.GOOGLE_CALENDAR_WATCH_TOKEN_SECRET;

  if (typeof explicitSecret === "string" && explicitSecret.trim().length > 0) {
    return explicitSecret.trim();
  }

  return getGoogleTokenEncryptionSecret();
}

export function getGoogleTokenEncryptionSecret(): string {
  const primarySecret = process.env.GOOGLE_TOKEN_ENCRYPTION_SECRET;

  if (typeof primarySecret === "string" && primarySecret.trim().length > 0) {
    return primarySecret.trim();
  }

  const legacySecret = process.env.GOOGLE_CALENDAR_TOKEN_SECRET;

  if (typeof legacySecret === "string" && legacySecret.trim().length > 0) {
    return legacySecret.trim();
  }

  const fallbackSecret = process.env.APP_SECRET;

  if (typeof fallbackSecret === "string" && fallbackSecret.trim().length > 0) {
    return fallbackSecret.trim();
  }

  throw new Error(
    "Missing Google token encryption secret. Set GOOGLE_TOKEN_ENCRYPTION_SECRET or GOOGLE_CALENDAR_TOKEN_SECRET."
  );
}

export function createOAuthStateToken(): string {
  return randomBytes(24).toString("base64url");
}

export function getOAuthStateTtlMs(): number {
  const raw = process.env.GOOGLE_CALENDAR_STATE_TTL_SECONDS;

  if (typeof raw !== "string" || raw.trim().length === 0) {
    return DEFAULT_OAUTH_STATE_TTL_SECONDS * 1000;
  }

  const parsed = Number.parseInt(raw.trim(), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_OAUTH_STATE_TTL_SECONDS * 1000;
  }

  return parsed * 1000;
}

export function getGoogleCalendarWatchRenewAheadMs(): number {
  const raw = process.env.GOOGLE_CALENDAR_WATCH_RENEW_AHEAD_SECONDS;

  if (typeof raw !== "string" || raw.trim().length === 0) {
    return DEFAULT_WATCH_RENEW_AHEAD_SECONDS * 1000;
  }

  const parsed = Number.parseInt(raw.trim(), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_WATCH_RENEW_AHEAD_SECONDS * 1000;
  }

  return parsed * 1000;
}

export function getGoogleCalendarReconcileLookbackDays(): number {
  const raw = process.env.GOOGLE_CALENDAR_RECONCILE_LOOKBACK_DAYS;

  if (typeof raw !== "string" || raw.trim().length === 0) {
    return DEFAULT_RECONCILE_LOOKBACK_DAYS;
  }

  const parsed = Number.parseInt(raw.trim(), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_RECONCILE_LOOKBACK_DAYS;
  }

  return parsed;
}

export function buildDedicatedCalendarSummary(
  displayName: string,
  email: string,
  uid: string
): string {
  const candidateIdentity = [displayName, email, uid]
    .map((value) => value.trim())
    .find((value) => value.length > 0);

  return `NailFlow - ${candidateIdentity ?? uid}`.slice(0, 120);
}
