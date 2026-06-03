import {describe, expect, it} from "vitest";

import {buildTotpUri, getTotpConfig, verifyTotpToken} from "./totp-utils";

const RFC_TEST_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
const RFC_TEST_TIME_MS = 59_000;

describe("auth/totp-callables", () => {
  it("aceita token TOTP valido para o secret informado", () => {
    expect(
      verifyTotpToken({
        secret: RFC_TEST_SECRET,
        token: "287082",
        now: RFC_TEST_TIME_MS,
      })
    ).toBe(true);
  });

  it("bloqueia token TOTP invalido", () => {
    expect(
      verifyTotpToken({
        secret: RFC_TEST_SECRET,
        token: "123456",
        now: RFC_TEST_TIME_MS,
      })
    ).toBe(false);
  });

  it("bloqueia payload sem seis digitos numericos", () => {
    expect(
      verifyTotpToken({
        secret: RFC_TEST_SECRET,
        token: "abc123",
        now: RFC_TEST_TIME_MS,
      })
    ).toBe(false);
  });

  it("mantem metadados esperados para enrolamento TOTP", () => {
    const uri = buildTotpUri({
      issuer: "NailFlow",
      accountName: "super_admin@nailflow.app",
      secret: RFC_TEST_SECRET,
    });

    expect(getTotpConfig()).toEqual({
      algorithm: "SHA1",
      digits: 6,
      periodSeconds: 30,
      window: 1,
    });
    expect(uri).toContain("otpauth://totp/NailFlow%3Asuper_admin");
    expect(uri).toContain("digits=6");
    expect(uri).toContain("period=30");
  });
});
