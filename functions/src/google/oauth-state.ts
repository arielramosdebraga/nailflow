/* eslint-disable require-jsdoc */
import {createHash, timingSafeEqual} from "node:crypto";

function toStateBuffer(state: string): Buffer {
  return createHash("sha256").update(state, "utf8").digest();
}

export function hashOAuthState(state: string): string {
  if (typeof state !== "string" || state.trim().length === 0) {
    throw new Error("OAuth state cannot be empty.");
  }

  return toStateBuffer(state).toString("base64url");
}

export function isOAuthStateValid(
  expectedHash: string,
  candidateState: string
): boolean {
  if (
    typeof expectedHash !== "string" ||
    expectedHash.trim().length === 0 ||
    typeof candidateState !== "string" ||
    candidateState.trim().length === 0
  ) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedHash, "base64url");
  const receivedBuffer = toStateBuffer(candidateState);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}
