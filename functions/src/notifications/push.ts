/* eslint-disable require-jsdoc */
import https from "node:https";
import * as logger from "firebase-functions/logger";

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const EXPO_MAX_TOKENS_PER_REQUEST = 100;

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  sound: "default";
  data: Record<string, unknown>;
}

interface ExpoPushResponseDataEntry {
  status?: string;
  message?: string;
  details?: {
    error?: string;
  };
}

interface ExpoPushResponse {
  data?: ExpoPushResponseDataEntry[];
}

export interface PushDispatchInput {
  userId: string;
  tokens: string[];
  title: string;
  body: string;
  data: Record<string, unknown>;
}

export interface PushDispatchResult {
  attemptedTokens: number;
  sentCount: number;
  errorCount: number;
  invalidTokens: string[];
}

function isExpoPushToken(token: string): boolean {
  return (
    /^ExponentPushToken\[[A-Za-z0-9-]+\]$/.test(token) ||
    /^ExpoPushToken\[[A-Za-z0-9-]+\]$/.test(token)
  );
}

function normalizeTokens(tokens: string[]): string[] {
  const uniqueTokens = [...new Set(tokens.map((token) => token.trim()))];

  return uniqueTokens.filter(
    (token) => token.length > 0 && isExpoPushToken(token)
  );
}

function chunkTokens(tokens: string[]): string[][] {
  const chunks: string[][] = [];

  for (let index = 0; index < tokens.length; index += EXPO_MAX_TOKENS_PER_REQUEST) {
    chunks.push(tokens.slice(index, index + EXPO_MAX_TOKENS_PER_REQUEST));
  }

  return chunks;
}

function createMessages(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, unknown>
): ExpoPushMessage[] {
  return tokens.map((token) => ({
    to: token,
    title,
    body,
    sound: "default",
    data,
  }));
}

function postExpoPush(messages: ExpoPushMessage[]): Promise<ExpoPushResponse> {
  const payload = JSON.stringify(messages);

  return new Promise((resolve, reject) => {
    const request = https.request(
      EXPO_PUSH_ENDPOINT,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          Accept: "application/json",
        },
      },
      (response) => {
        let rawBody = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          rawBody += chunk;
        });

        response.on("end", () => {
          if (response.statusCode && response.statusCode >= 400) {
            reject(
              new Error(
                `Expo push returned status ${response.statusCode}: ${rawBody}`
              )
            );
            return;
          }

          try {
            const parsedBody = JSON.parse(rawBody) as ExpoPushResponse;
            resolve(parsedBody);
          } catch (error) {
            reject(
              new Error(
                `Expo push response parse error: ${
                  error instanceof Error ? error.message : String(error)
                }`
              )
            );
          }
        });
      }
    );

    request.on("error", reject);
    request.write(payload);
    request.end();
  });
}

function isDeviceNotRegistered(entry: ExpoPushResponseDataEntry): boolean {
  return entry.details?.error === "DeviceNotRegistered";
}

export async function sendPushToExpoTokens(
  input: PushDispatchInput
): Promise<PushDispatchResult> {
  const tokens = normalizeTokens(input.tokens);

  if (tokens.length === 0) {
    return {
      attemptedTokens: 0,
      sentCount: 0,
      errorCount: 0,
      invalidTokens: [],
    };
  }

  let sentCount = 0;
  let errorCount = 0;
  const invalidTokens: string[] = [];

  for (const tokenChunk of chunkTokens(tokens)) {
    const messages = createMessages(
      tokenChunk,
      input.title,
      input.body,
      input.data
    );

    try {
      const response = await postExpoPush(messages);
      const responseEntries = Array.isArray(response.data) ? response.data : [];

      responseEntries.forEach((entry, index) => {
        if (entry.status === "ok") {
          sentCount += 1;
          return;
        }

        errorCount += 1;

        if (isDeviceNotRegistered(entry)) {
          const token = tokenChunk[index];

          if (token) {
            invalidTokens.push(token);
          }
        }

        logger.warn("Expo push returned non-ok status", {
          userId: input.userId,
          token: tokenChunk[index] ?? null,
          status: entry.status ?? "unknown",
          error: entry.details?.error ?? null,
          message: entry.message ?? null,
        });
      });
    } catch (error) {
      errorCount += tokenChunk.length;

      logger.error("Failed to dispatch Expo push chunk", {
        userId: input.userId,
        chunkSize: tokenChunk.length,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    attemptedTokens: tokens.length,
    sentCount,
    errorCount,
    invalidTokens: [...new Set(invalidTokens)],
  };
}

