/* eslint-disable require-jsdoc */
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import {getGoogleTokenEncryptionSecret} from "./config";

const AES_ALGORITHM = "aes-256-gcm";
const IV_SIZE_BYTES = 12;
const AUTH_TAG_SIZE_BYTES = 16;
const CURRENT_TOKEN_VERSION = 1;

function deriveKey(): Buffer {
  const secret = getGoogleTokenEncryptionSecret();
  return createHash("sha256").update(secret, "utf8").digest();
}

export function getCurrentGoogleTokenVersion(): number {
  return CURRENT_TOKEN_VERSION;
}

export function encryptRefreshToken(refreshToken: string): string {
  if (typeof refreshToken !== "string" || refreshToken.trim().length === 0) {
    throw new Error("Cannot encrypt an empty refresh token.");
  }

  const iv = randomBytes(IV_SIZE_BYTES);
  const cipher = createCipheriv(AES_ALGORITHM, deriveKey(), iv);

  const encryptedBuffer = Buffer.concat([
    cipher.update(refreshToken, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, authTag, encryptedBuffer]);

  return payload.toString("base64url");
}

export function decryptRefreshToken(encryptedRefreshToken: string): string {
  if (
    typeof encryptedRefreshToken !== "string" ||
    encryptedRefreshToken.trim().length === 0
  ) {
    throw new Error("Cannot decrypt an empty refresh token payload.");
  }

  const payload = Buffer.from(encryptedRefreshToken, "base64url");

  if (payload.length <= IV_SIZE_BYTES + AUTH_TAG_SIZE_BYTES) {
    throw new Error("Encrypted refresh token payload is malformed.");
  }

  const iv = payload.subarray(0, IV_SIZE_BYTES);
  const authTag = payload.subarray(
    IV_SIZE_BYTES,
    IV_SIZE_BYTES + AUTH_TAG_SIZE_BYTES
  );
  const ciphertext = payload.subarray(IV_SIZE_BYTES + AUTH_TAG_SIZE_BYTES);

  const decipher = createDecipheriv(AES_ALGORITHM, deriveKey(), iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
