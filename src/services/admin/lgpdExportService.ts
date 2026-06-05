import { FirebaseError } from 'firebase/app';
import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';

import { LgpdExportPackageSchema, type LgpdExportPackage } from '@/schemas/admin/lgpd-export.schema';
import { assertFirebaseConfigured, firebaseApp } from '@/services/firebase';

const FUNCTIONS_REGION = 'southamerica-east1';
const EXPORT_CALLABLE_NAME = 'exportLgpdData';

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
      return 'Somente superadministradores podem exportar dados LGPD.';
    case 'functions/not-found':
      return 'Funcao de exportacao LGPD nao encontrada no backend.';
    case 'functions/unavailable':
      return 'Servico de exportacao LGPD indisponivel no momento.';
    case 'functions/deadline-exceeded':
      return 'Tempo de resposta excedido ao gerar exportacao LGPD.';
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

export async function buildLgpdExportPackageAsync(): Promise<LgpdExportPackage> {
  const functions = getFunctionsInstance();
  const callable = httpsCallable<undefined, unknown>(functions, EXPORT_CALLABLE_NAME);

  try {
    const response = await callable();
    const parsed = LgpdExportPackageSchema.safeParse(response.data);

    if (!parsed.success) {
      throw new Error('Resposta invalida recebida do backend de exportacao LGPD.');
    }

    return parsed.data;
  } catch (error) {
    throw normalizeCallableError(error, 'Falha ao gerar exportacao LGPD.');
  }
}

export type { LgpdExportPackage };
