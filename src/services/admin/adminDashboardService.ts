import { FirebaseError } from 'firebase/app';
import { Functions, getFunctions, httpsCallable } from 'firebase/functions';
import { z } from 'zod';

import { assertFirebaseConfigured, firebaseApp } from '@/services/firebase';

const FUNCTIONS_REGION = 'southamerica-east1';
const DEFAULT_CALLABLE_TIMEOUT_MS = 15_000;

const GetGlobalDashboardInputSchema = z.object({
  includeInactiveSalons: z.boolean().default(true),
});

const GlobalDashboardSummarySchema = z.object({
  totalSalons: z.number().int().nonnegative(),
  activeSalons: z.number().int().nonnegative(),
  totalUsers: z.number().int().nonnegative(),
  superAdmins: z.number().int().nonnegative(),
  salonOwners: z.number().int().nonnegative(),
  nailTechnicians: z.number().int().nonnegative(),
  totalClients: z.number().int().nonnegative(),
  totalAppointments: z.number().int().nonnegative(),
});

const GetGlobalDashboardResponseSchema = z.object({
  summary: GlobalDashboardSummarySchema,
  generatedAt: z.string().datetime(),
});

export type GlobalDashboardSummary = z.infer<typeof GlobalDashboardSummarySchema>;
export type GetGlobalDashboardResponse = z.infer<typeof GetGlobalDashboardResponseSchema>;

export interface GetGlobalDashboardParams {
  includeInactiveSalons?: boolean;
  timeoutMs?: number;
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
      return 'Somente superadministrador pode acessar este dashboard.';
    case 'functions/not-found':
      return 'Funcao getGlobalDashboard nao encontrada no backend.';
    case 'functions/unavailable':
      return 'Servico de dashboard indisponivel no momento.';
    case 'functions/deadline-exceeded':
      return 'Tempo de resposta excedido ao carregar dashboard.';
    case 'functions/invalid-argument':
      return 'Parametros invalidos para carregar dashboard.';
    default:
      return fallbackMessage;
  }
}

function normalizeCallableError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof FirebaseError) {
    const message = mapCallableErrorMessage(error.code, fallbackMessage);
    return new Error(message);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(fallbackMessage);
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function resolveTimeout(timeoutMs: number | undefined): number {
  if (!timeoutMs || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return DEFAULT_CALLABLE_TIMEOUT_MS;
  }

  return Math.floor(timeoutMs);
}

export async function getGlobalDashboard(
  params?: GetGlobalDashboardParams
): Promise<GetGlobalDashboardResponse> {
  const payload = GetGlobalDashboardInputSchema.parse({
    includeInactiveSalons: params?.includeInactiveSalons ?? true,
  });
  const timeoutMs = resolveTimeout(params?.timeoutMs);
  const functions = getFunctionsInstance();
  const callable = httpsCallable<typeof payload, unknown>(functions, 'getGlobalDashboard');

  try {
    const response = await withTimeout(
      callable(payload),
      timeoutMs,
      'Tempo de resposta excedido ao consultar dashboard global.'
    );
    const parsed = GetGlobalDashboardResponseSchema.safeParse(response.data);

    if (!parsed.success) {
      throw new Error('Resposta invalida recebida do backend de dashboard.');
    }

    return parsed.data;
  } catch (error) {
    throw normalizeCallableError(error, 'Falha ao carregar dashboard global.');
  }
}
