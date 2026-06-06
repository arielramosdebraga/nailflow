import { FirebaseError } from 'firebase/app';
import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import { z } from 'zod';

import { assertFirebaseConfigured, firebaseApp } from '@/services/firebase';
import {
  type CreateOwnerNailTechnicianInput,
} from '@/schemas/users/owner-create-nail-technician.schema';

const FUNCTIONS_REGION = 'southamerica-east1';
const CREATE_CALLABLE_NAME = process.env.EXPO_PUBLIC_OWNER_CREATE_NAIL_TECHNICIAN_CALLABLE;

const CREATE_CALLABLE_FALLBACKS = [
  CREATE_CALLABLE_NAME,
  'createNailTechnician',
  'createSalonNailTechnician',
  'createNailTechnicianForSalon',
  'createSalonTechnicianAccount',
  'createSalonStaffMember',
].filter((value): value is string => Boolean(value));

const CreateOwnerNailTechnicianPayloadSchema = z.object({
  displayName: z.string().trim().min(3).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().min(8).max(20).nullable(),
});

const CreateOwnerNailTechnicianResponseSchema = z
  .object({
    uid: z.string().min(1).optional(),
    salonId: z.string().min(1).optional(),
    status: z.enum(['created', 'pending']).optional(),
    message: z.string().min(1).optional(),
  })
  .passthrough();

export interface CreateOwnerNailTechnicianResult {
  uid: string | null;
  salonId: string | null;
  status: 'created' | 'pending';
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
      return 'Voce nao tem permissao para cadastrar profissionais neste salao.';
    case 'functions/not-found':
      return 'O backend seguro para cadastro de profissionais ainda nao esta disponivel nesta versao.';
    case 'functions/unavailable':
      return 'O servico de cadastro seguro esta indisponivel no momento.';
    case 'functions/deadline-exceeded':
      return 'Tempo de resposta excedido ao iniciar o cadastro da profissional.';
    case 'functions/invalid-argument':
      return 'Os dados enviados para cadastrar a profissional sao invalidos.';
    case 'functions/already-exists':
      return 'Ja existe uma profissional cadastrada com este e-mail.';
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

export async function createOwnerNailTechnician(
  input: CreateOwnerNailTechnicianInput
): Promise<CreateOwnerNailTechnicianResult> {
  if (!CREATE_CALLABLE_FALLBACKS.length) {
    throw new Error('Nenhuma callable configurada para cadastro seguro de profissionais.');
  }

  const payload = CreateOwnerNailTechnicianPayloadSchema.parse(input);
  const functions = getFunctionsInstance();
  let firstNotFoundError: FirebaseError | null = null;

  for (const callableName of CREATE_CALLABLE_FALLBACKS) {
    const callable = httpsCallable<typeof payload, unknown>(functions, callableName);

    try {
      const response = await callable(payload);
      const parsed = CreateOwnerNailTechnicianResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        throw new Error('Resposta invalida recebida do backend de cadastro seguro.');
      }

      return {
        uid: parsed.data.uid ?? null,
        salonId: parsed.data.salonId ?? null,
        status: parsed.data.status ?? (parsed.data.uid ? 'created' : 'pending'),
        message: parsed.data.message ?? null,
      };
    } catch (error) {
      if (error instanceof FirebaseError && error.code === 'functions/not-found') {
        firstNotFoundError ??= error;
        continue;
      }

      throw normalizeCallableError(error, 'Falha ao iniciar o cadastro da profissional.');
    }
  }

  throw normalizeCallableError(
    firstNotFoundError,
    'Nao foi possivel localizar uma callable para cadastro seguro de profissionais.'
  );
}
