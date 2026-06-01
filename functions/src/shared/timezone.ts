/* eslint-disable require-jsdoc */
import {HttpsError} from "firebase-functions/v2/https";

export const DEFAULT_IANA_TIMEZONE = "America/Sao_Paulo";

export function isValidIanaTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", {timeZone});
    return true;
  } catch {
    return false;
  }
}

export function ensureValidIanaTimeZoneOrThrow(timeZone: string): void {
  if (!isValidIanaTimeZone(timeZone)) {
    throw new HttpsError(
      "invalid-argument",
      "Timezone invalida. Informe um timezone IANA valido."
    );
  }
}

export function resolveTimeZoneWithFallback(
  value: unknown,
  fallback = DEFAULT_IANA_TIMEZONE
): string {
  const normalized =
    typeof value === "string" ? value.trim() : "";

  if (normalized.length > 0 && isValidIanaTimeZone(normalized)) {
    return normalized;
  }

  return fallback;
}
