import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import { z } from 'zod';

import {
  TotpCodePayloadSchema,
  TotpEnrollmentConfirmationResponseSchema,
  TotpEnrollmentResponseSchema,
  TotpStatusResponseSchema,
  TotpVerificationResponseSchema,
  type TotpCodePayloadInput,
  type TotpEnrollmentConfirmationResponse,
  type TotpEnrollmentResponse,
  type TotpStatusResponse,
  type TotpVerificationResponse,
} from '@/schemas/auth/totp.schema';
import { assertFirebaseConfigured, auth, firebaseApp } from '@/services/firebase';

interface AuthIdentity {
  uid: string;
  email: string;
}

let functionsInstance: Functions | null = null;
const FUNCTIONS_REGION = 'southamerica-east1';

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
      return 'Voce nao tem permissao para esta operacao.';
    case 'functions/not-found':
      return 'Funcao de seguranca 2FA nao encontrada no backend.';
    case 'functions/unavailable':
      return 'Servico de seguranca 2FA indisponivel no momento.';
    case 'functions/deadline-exceeded':
      return 'Tempo de resposta excedido ao validar 2FA.';
    case 'functions/invalid-argument':
      return 'Dados invalidos enviados para validacao 2FA.';
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

async function callAuthFunction<TRequest, TResponse>(
  name: string,
  schema: z.ZodType<TResponse>,
  payload?: TRequest
): Promise<TResponse> {
  const functions = getFunctionsInstance();
  const callable = httpsCallable<TRequest, unknown>(functions, name);

  try {
    const response = await callable(payload as TRequest);
    const parsed = schema.safeParse(response.data);

    if (!parsed.success) {
      throw new Error('Resposta invalida recebida do backend de 2FA.');
    }

    return parsed.data;
  } catch (error) {
    throw normalizeCallableError(error, `Falha ao executar ${name}.`);
  }
}

export async function signInWithEmailPassword(params: {
  email: string;
  password: string;
}): Promise<AuthIdentity> {
  assertFirebaseConfigured();
  if (!auth) {
    throw new Error('Servico de autenticacao indisponivel.');
  }

  const credential = await signInWithEmailAndPassword(auth, params.email, params.password);
  return {
    uid: credential.user.uid,
    email: credential.user.email ?? params.email,
  };
}

export async function signUpWithEmailPassword(params: {
  displayName: string;
  email: string;
  password: string;
}): Promise<AuthIdentity> {
  assertFirebaseConfigured();
  if (!auth) {
    throw new Error('Servico de autenticacao indisponivel.');
  }

  const credential = await createUserWithEmailAndPassword(auth, params.email, params.password);
  await updateProfile(credential.user, { displayName: params.displayName });

  return {
    uid: credential.user.uid,
    email: credential.user.email ?? params.email,
  };
}

export async function sendRecoverPasswordEmail(email: string): Promise<void> {
  assertFirebaseConfigured();
  if (!auth) {
    throw new Error('Servico de autenticacao indisponivel.');
  }

  await sendPasswordResetEmail(auth, email);
}

export async function signOut(): Promise<void> {
  assertFirebaseConfigured();
  if (!auth) {
    throw new Error('Servico de autenticacao indisponivel.');
  }

  await firebaseSignOut(auth);
}

export async function getTotpStatus(): Promise<TotpStatusResponse> {
  return callAuthFunction<undefined, TotpStatusResponse>(
    'getTotpStatus',
    TotpStatusResponseSchema
  );
}

export async function beginTotpEnrollment(): Promise<TotpEnrollmentResponse> {
  return callAuthFunction<undefined, TotpEnrollmentResponse>(
    'beginTotpEnrollment',
    TotpEnrollmentResponseSchema
  );
}

export async function confirmTotpEnrollment(
  payload: TotpCodePayloadInput
): Promise<TotpEnrollmentConfirmationResponse> {
  const parsedPayload = TotpCodePayloadSchema.parse(payload);
  return callAuthFunction<TotpCodePayloadInput, TotpEnrollmentConfirmationResponse>(
    'confirmTotpEnrollment',
    TotpEnrollmentConfirmationResponseSchema,
    parsedPayload
  );
}

export async function verifyTotpCode(
  payload: TotpCodePayloadInput
): Promise<TotpVerificationResponse> {
  const parsedPayload = TotpCodePayloadSchema.parse(payload);
  return callAuthFunction<TotpCodePayloadInput, TotpVerificationResponse>(
    'verifyTotpCode',
    TotpVerificationResponseSchema,
    parsedPayload
  );
}
