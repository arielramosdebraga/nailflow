import { FirebaseError } from 'firebase/app';
import { doc, getDoc, type DocumentData, type DocumentSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import { z } from 'zod';

import { assertFirebaseConfigured, db, firebaseApp } from '@/services/firebase';

const FUNCTIONS_REGION = 'southamerica-east1';
const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';
const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
} as const;

const BEGIN_CALLABLE_NAME = process.env.EXPO_PUBLIC_GOOGLE_CALENDAR_BEGIN_CALLABLE;
const CONFIRM_CALLABLE_NAME = process.env.EXPO_PUBLIC_GOOGLE_CALENDAR_CONFIRM_CALLABLE;

const BEGIN_CALLABLE_FALLBACKS = [
  BEGIN_CALLABLE_NAME,
  'beginGoogleCalendarConnection',
  'startGoogleCalendarConnection',
  'beginGoogleCalendarOAuth',
].filter((value): value is string => Boolean(value));

const CONFIRM_CALLABLE_FALLBACKS = [
  CONFIRM_CALLABLE_NAME,
  'completeGoogleCalendarConnection',
  'confirmGoogleCalendarConnection',
  'finishGoogleCalendarConnection',
  'confirmGoogleCalendarOAuth',
].filter((value): value is string => Boolean(value));

const GoogleCalendarSyncStatusSchema = z.enum([
  'idle',
  'pending',
  'authorizing',
  'synced',
  'disabled',
  'expired',
  'error',
]);

const BeginGoogleCalendarConnectionPayloadSchema = z.object({
  redirectUri: z.string().min(1),
  platform: z.enum(['android', 'ios', 'web']),
});

const ConfirmGoogleCalendarConnectionPayloadSchema = z.object({
  code: z.string().min(1),
  redirectUri: z.string().min(1),
  state: z.string().optional(),
});

const BeginGoogleCalendarConnectionResponseSchema = z.object({
  clientId: z.string().min(1),
  redirectUri: z.string().optional(),
  scopes: z.array(z.string()).optional(),
  prompt: z.string().optional(),
  state: z.string().optional(),
  codeChallenge: z.string().optional(),
  codeChallengeMethod: z.string().optional(),
  authorizationEndpoint: z.string().optional(),
  tokenEndpoint: z.string().optional(),
  revocationEndpoint: z.string().optional(),
  discovery: z
    .object({
      authorizationEndpoint: z.string(),
      tokenEndpoint: z.string().optional(),
      revocationEndpoint: z.string().optional(),
    })
    .optional(),
  extraParams: z.record(z.string(), z.string()).optional(),
});

const ConfirmGoogleCalendarConnectionResponseSchema = z.object({
  connected: z.boolean(),
  syncStatus: GoogleCalendarSyncStatusSchema.optional(),
  calendarId: z.string().optional(),
  message: z.string().optional(),
});

export type GoogleSyncIndicator = 'connected' | 'pending' | 'error';
export type GoogleCalendarSyncStatus = z.infer<typeof GoogleCalendarSyncStatusSchema>;

export interface GoogleCalendarConnectionStatus {
  indicator: GoogleSyncIndicator;
  connected: boolean;
  syncStatus: GoogleCalendarSyncStatus;
  calendarId: string | null;
  lastSyncedAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
}

export interface BeginGoogleCalendarConnectionParams {
  redirectUri: string;
  platform: 'android' | 'ios' | 'web';
}

export interface BeginGoogleCalendarConnectionResult {
  clientId: string;
  redirectUri: string | null;
  state: string | null;
  scopes: string[];
  prompt: string | null;
  codeChallenge: string | null;
  codeChallengeMethod: string | null;
  discovery: {
    authorizationEndpoint: string;
    tokenEndpoint?: string;
    revocationEndpoint?: string;
  };
  extraParams: Record<string, string>;
}

export interface ConfirmGoogleCalendarConnectionParams {
  code: string;
  redirectUri: string;
  state?: string;
}

export interface ConfirmGoogleCalendarConnectionResult {
  connected: boolean;
  syncStatus: GoogleCalendarSyncStatus;
  calendarId: string | null;
  message: string | null;
}

let functionsInstance: Functions | null = null;

function getFunctionsInstance(): Functions {
  assertFirebaseConfigured();
  if (!firebaseApp) {
    throw new Error('Servico de funcoes indisponivel.');
  }

  functionsInstance ??= getFunctions(firebaseApp, FUNCTIONS_REGION);
  return functionsInstance;
}

function mapCallableErrorMessage(code: string, fallbackMessage: string): string {
  switch (code) {
    case 'functions/unauthenticated':
      return 'Sessao expirada. Entre novamente para continuar.';
    case 'functions/permission-denied':
      return 'Voce nao tem permissao para conectar o Google Agenda.';
    case 'functions/not-found':
      return 'Backend de integracao Google ainda nao disponivel nesta versao.';
    case 'functions/unavailable':
      return 'Servico de sincronizacao Google indisponivel no momento.';
    case 'functions/deadline-exceeded':
      return 'Tempo de resposta excedido ao conectar o Google Agenda.';
    case 'functions/invalid-argument':
      return 'Dados invalidos enviados para conexao do Google Agenda.';
    default:
      return fallbackMessage;
  }
}

function normalizeCallableError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof FirebaseError) {
    return new Error(mapCallableErrorMessage(error.code, fallbackMessage));
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(fallbackMessage);
}

function normalizeSyncStatus(value: unknown): GoogleCalendarSyncStatus {
  if (
    value === 'idle' ||
    value === 'pending' ||
    value === 'authorizing' ||
    value === 'synced' ||
    value === 'disabled' ||
    value === 'expired' ||
    value === 'error'
  ) {
    return value;
  }

  return 'idle';
}

function normalizeIsoDateTime(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const timestampLike = value as { toDate?: () => Date };
    if (typeof timestampLike.toDate === 'function') {
      return timestampLike.toDate().toISOString();
    }
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  return null;
}

export function deriveGoogleSyncIndicator(params: {
  connected: boolean;
  syncStatus: GoogleCalendarSyncStatus;
}): GoogleSyncIndicator {
  if (params.syncStatus === 'error' || params.syncStatus === 'expired') {
    return 'error';
  }

  if (params.connected || params.syncStatus === 'synced') {
    return 'connected';
  }

  return 'pending';
}

function mapGoogleConnectionSnapshot(
  snapshot: DocumentSnapshot<DocumentData>
): GoogleCalendarConnectionStatus | null {
  if (!snapshot.exists()) {
    return null;
  }

  const raw = snapshot.data();
  if (!raw) {
    return null;
  }

  const googleRaw =
    typeof raw.googleCalendar === 'object' && raw.googleCalendar !== null
      ? (raw.googleCalendar as Record<string, unknown>)
      : {};

  const connected = Boolean(googleRaw.connected);
  const syncStatus = normalizeSyncStatus(googleRaw.syncStatus);

  return {
    connected,
    syncStatus,
    indicator: deriveGoogleSyncIndicator({ connected, syncStatus }),
    calendarId: typeof googleRaw.calendarId === 'string' ? googleRaw.calendarId : null,
    lastSyncedAt: normalizeIsoDateTime(googleRaw.lastSyncedAt),
    lastErrorAt: normalizeIsoDateTime(googleRaw.lastErrorAt),
    lastErrorMessage: typeof googleRaw.lastErrorMessage === 'string' ? googleRaw.lastErrorMessage : null,
  };
}

async function callGoogleFunctionWithFallback<TRequest, TResponse>(params: {
  names: string[];
  payloadCandidates: (TRequest | undefined)[];
  schema: z.ZodType<TResponse>;
  fallbackMessage: string;
}): Promise<TResponse> {
  const functions = getFunctionsInstance();
  const lastErrorByName = new Map<string, unknown>();

  for (const name of params.names) {
    for (const payload of params.payloadCandidates) {
      const callable = httpsCallable<TRequest, unknown>(functions, name);
      try {
        const response = await callable(payload as TRequest);
        const parsed = params.schema.safeParse(response.data);
        if (!parsed.success) {
          throw new Error('Resposta invalida recebida do backend de sincronizacao Google.');
        }

        return parsed.data;
      } catch (error) {
        if (error instanceof FirebaseError && error.code === 'functions/not-found') {
          lastErrorByName.set(name, error);
          break;
        }

        if (error instanceof FirebaseError && error.code === 'functions/invalid-argument') {
          lastErrorByName.set(name, error);
          continue;
        }

        throw normalizeCallableError(error, params.fallbackMessage);
      }
    }
  }

  if (!params.names.length) {
    throw new Error('Nenhuma callable configurada para integracao Google Calendar.');
  }

  const callableList = params.names.join(', ');
  const firstError = lastErrorByName.values().next().value as unknown;
  if (firstError instanceof FirebaseError) {
    throw normalizeCallableError(
      firstError,
      `Nao foi possivel localizar as callables esperadas (${callableList}).`
    );
  }

  throw new Error(`Nao foi possivel localizar as callables esperadas (${callableList}).`);
}

export async function beginGoogleCalendarConnection(
  input: BeginGoogleCalendarConnectionParams
): Promise<BeginGoogleCalendarConnectionResult> {
  const parsedPayload = BeginGoogleCalendarConnectionPayloadSchema.parse(input);

  const response = await callGoogleFunctionWithFallback({
    names: BEGIN_CALLABLE_FALLBACKS,
    payloadCandidates: [parsedPayload, undefined],
    schema: BeginGoogleCalendarConnectionResponseSchema,
    fallbackMessage: 'Falha ao iniciar conexao com Google Agenda.',
  });

  const authorizationEndpoint =
    response.discovery?.authorizationEndpoint ??
    response.authorizationEndpoint ??
    GOOGLE_DISCOVERY.authorizationEndpoint;
  const tokenEndpoint = response.discovery?.tokenEndpoint ?? response.tokenEndpoint;
  const revocationEndpoint = response.discovery?.revocationEndpoint ?? response.revocationEndpoint;

  const scopes = Array.from(new Set([...(response.scopes ?? []), GOOGLE_CALENDAR_SCOPE]));
  const extraParams = {
    include_granted_scopes: 'true',
    access_type: 'offline',
    prompt: 'consent',
    ...(response.extraParams ?? {}),
  };

  return {
    clientId: response.clientId,
    redirectUri: response.redirectUri ?? null,
    state: response.state ?? null,
    scopes,
    prompt: response.prompt ?? null,
    codeChallenge: response.codeChallenge ?? null,
    codeChallengeMethod: response.codeChallengeMethod ?? null,
    discovery: {
      authorizationEndpoint,
      tokenEndpoint,
      revocationEndpoint,
    },
    extraParams,
  };
}

export async function confirmGoogleCalendarConnection(
  input: ConfirmGoogleCalendarConnectionParams
): Promise<ConfirmGoogleCalendarConnectionResult> {
  const payload = ConfirmGoogleCalendarConnectionPayloadSchema.parse(input);
  const response = await callGoogleFunctionWithFallback({
    names: CONFIRM_CALLABLE_FALLBACKS,
    payloadCandidates: [payload],
    schema: ConfirmGoogleCalendarConnectionResponseSchema,
    fallbackMessage: 'Falha ao confirmar conexao com Google Agenda.',
  });

  const syncStatus = normalizeSyncStatus(response.syncStatus);

  return {
    connected: response.connected,
    syncStatus,
    calendarId: response.calendarId ?? null,
    message: response.message ?? null,
  };
}

export async function getGoogleCalendarConnectionStatus(
  userId: string
): Promise<GoogleCalendarConnectionStatus> {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponivel.');
  }

  const parsedUserId = userId.trim();
  if (!parsedUserId) {
    throw new Error('Nao foi possivel identificar o usuario para consultar sincronizacao Google.');
  }

  const snapshot = await getDoc(doc(db, 'users', parsedUserId));
  const mapped = mapGoogleConnectionSnapshot(snapshot);
  if (mapped) {
    return mapped;
  }

  return {
    connected: false,
    syncStatus: 'idle',
    indicator: 'pending',
    calendarId: null,
    lastSyncedAt: null,
    lastErrorAt: null,
    lastErrorMessage: null,
  };
}
