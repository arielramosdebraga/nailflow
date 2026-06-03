/* eslint-disable require-jsdoc */
import {CallableRequest} from "firebase-functions/v2/https";
import {AuditRequestMetadata} from "./audit-log.schema";

interface RequestLike {
  headers?: Record<string, unknown>;
  ip?: unknown;
  socket?: {
    remoteAddress?: unknown;
  };
}

const MAX_IP_LENGTH = 128;
const MAX_USER_AGENT_LENGTH = 512;
const MAX_REQUEST_ID_LENGTH = 120;

function normalizeHeaderValue(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmedValue = value.trim();
    return trimmedValue ? trimmedValue : null;
  }

  if (Array.isArray(value)) {
    const firstString = value.find((entry) => typeof entry === "string");
    return normalizeHeaderValue(firstString);
  }

  return null;
}

function trimToMaxLength(
  value: string | null,
  maxLength: number
): string | null {
  if (!value) {
    return null;
  }

  if (value.length <= maxLength) {
    return value;
  }

  return value.slice(0, maxLength);
}

function getHeader(
  request: RequestLike,
  headerName: string
): string | null {
  const headers = request.headers ?? {};
  return normalizeHeaderValue(headers[headerName.toLowerCase()]);
}

function resolveIpAddress(request: RequestLike): string | null {
  const forwardedFor = getHeader(request, "x-forwarded-for");

  if (forwardedFor) {
    const [firstIp] = forwardedFor
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (firstIp) {
      return firstIp;
    }
  }

  const xRealIp = getHeader(request, "x-real-ip");
  if (xRealIp) {
    return xRealIp;
  }

  const rawRequestIp = normalizeHeaderValue(request.ip);
  if (rawRequestIp) {
    return rawRequestIp;
  }

  const socketIp = normalizeHeaderValue(request.socket?.remoteAddress);
  return socketIp;
}

function resolveRequestId(request: RequestLike): string | null {
  const requestIdHeaders = [
    "x-request-id",
    "x-correlation-id",
    "x-cloud-trace-context",
  ];

  for (const headerName of requestIdHeaders) {
    const headerValue = getHeader(request, headerName);

    if (!headerValue) {
      continue;
    }

    if (headerName === "x-cloud-trace-context") {
      const [traceId] = headerValue.split("/");
      return traceId ? traceId.trim() : null;
    }

    return headerValue;
  }

  return null;
}

export function extractRequestMetadata(
  request: CallableRequest<unknown>
): AuditRequestMetadata {
  const rawRequest = (request.rawRequest ?? {}) as RequestLike;

  const ipAddress = trimToMaxLength(resolveIpAddress(rawRequest), MAX_IP_LENGTH);
  const userAgent = trimToMaxLength(
    getHeader(rawRequest, "user-agent"),
    MAX_USER_AGENT_LENGTH
  );
  const requestId = trimToMaxLength(
    resolveRequestId(rawRequest),
    MAX_REQUEST_ID_LENGTH
  );

  return {
    ipAddress,
    userAgent,
    requestId,
  };
}
