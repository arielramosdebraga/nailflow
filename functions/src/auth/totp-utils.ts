/* eslint-disable require-jsdoc */
import {createHmac, randomBytes, timingSafeEqual} from "crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const TOTP_DIGITS = 6;
const TOTP_STEP_SECONDS = 30;
const TOTP_WINDOW = 1;
const TOTP_ALGORITHM = "SHA1";

function base32Encode(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(secret: string): Buffer {
  const normalizedSecret = secret
    .toUpperCase()
    .replace(/=+$/g, "")
    .replace(/\s+/g, "");

  if (!normalizedSecret || /[^A-Z2-7]/.test(normalizedSecret)) {
    throw new Error("Segredo TOTP invalido.");
  }

  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const character of normalizedSecret) {
    const index = BASE32_ALPHABET.indexOf(character);

    if (index < 0) {
      throw new Error("Segredo TOTP invalido.");
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const counterBuffer = Buffer.alloc(8);
  const high = Math.floor(counter / 0x100000000);
  const low = counter >>> 0;

  counterBuffer.writeUInt32BE(high, 0);
  counterBuffer.writeUInt32BE(low, 4);

  const digest = createHmac("sha1", key).update(counterBuffer).digest();
  const lastByte = digest[digest.length - 1] ?? 0;
  const offset = lastByte & 15;
  const byte0 = digest[offset] ?? 0;
  const byte1 = digest[offset + 1] ?? 0;
  const byte2 = digest[offset + 2] ?? 0;
  const byte3 = digest[offset + 3] ?? 0;
  const binaryCode =
    ((byte0 & 127) << 24) |
    ((byte1 & 255) << 16) |
    ((byte2 & 255) << 8) |
    (byte3 & 255);

  const token = binaryCode % 10 ** TOTP_DIGITS;
  return token.toString().padStart(TOTP_DIGITS, "0");
}

function normalizeToken(token: unknown): string {
  if (typeof token !== "string") {
    return "";
  }

  const digitsOnly = token.trim();
  return /^\d{6}$/.test(digitsOnly) ? digitsOnly : "";
}

function secureEquals(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

export interface TotpStatus {
  readonly algorithm: "SHA1";
  readonly digits: 6;
  readonly periodSeconds: 30;
  readonly window: 1;
}

export function getTotpConfig(): TotpStatus {
  return {
    algorithm: TOTP_ALGORITHM,
    digits: TOTP_DIGITS,
    periodSeconds: TOTP_STEP_SECONDS,
    window: TOTP_WINDOW,
  };
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function buildTotpUri(params: {
  issuer: string;
  accountName: string;
  secret: string;
}): string {
  const issuer = params.issuer.trim();
  const accountName = params.accountName.trim();

  const label = `${issuer}:${accountName}`;
  const encodedLabel = encodeURIComponent(label);
  const encodedSecret = encodeURIComponent(params.secret);
  const encodedIssuer = encodeURIComponent(issuer);

  return (
    `otpauth://totp/${encodedLabel}?secret=${encodedSecret}` +
    `&issuer=${encodedIssuer}&algorithm=${TOTP_ALGORITHM}` +
    `&digits=${TOTP_DIGITS}&period=${TOTP_STEP_SECONDS}`
  );
}

export function verifyTotpToken(params: {
  token: unknown;
  secret: string;
  now?: number;
}): boolean {
  const normalizedToken = normalizeToken(params.token);

  if (!normalizedToken) {
    return false;
  }

  const now = params.now ?? Date.now();
  const counter = Math.floor(now / 1000 / TOTP_STEP_SECONDS);

  for (let offset = -TOTP_WINDOW; offset <= TOTP_WINDOW; offset += 1) {
    const candidate = hotp(params.secret, counter + offset);

    if (secureEquals(candidate, normalizedToken)) {
      return true;
    }
  }

  return false;
}
