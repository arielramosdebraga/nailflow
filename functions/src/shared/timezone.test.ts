import { describe, expect, it } from "vitest";

import {
  DEFAULT_IANA_TIMEZONE,
  ensureValidIanaTimeZoneOrThrow,
  isValidIanaTimeZone,
  resolveTimeZoneWithFallback,
} from "./timezone";

describe("shared/timezone", () => {
  it("accepts valid IANA timezone names", () => {
    expect(isValidIanaTimeZone("America/Sao_Paulo")).toBe(true);
    expect(isValidIanaTimeZone("UTC")).toBe(true);
  });

  it("rejects invalid timezone names", () => {
    expect(isValidIanaTimeZone("Mars/Olympus")).toBe(false);
  });

  it("throws when timezone is invalid", () => {
    expect(() => ensureValidIanaTimeZoneOrThrow("Mars/Olympus")).toThrowError(
      /Timezone invalida/
    );
  });

  it("uses fallback when value is empty or invalid", () => {
    expect(resolveTimeZoneWithFallback("")).toBe(DEFAULT_IANA_TIMEZONE);
    expect(resolveTimeZoneWithFallback("Mars/Olympus")).toBe(
      DEFAULT_IANA_TIMEZONE
    );
  });

  it("returns provided timezone when valid", () => {
    expect(resolveTimeZoneWithFallback("  UTC  ")).toBe("UTC");
  });
});
