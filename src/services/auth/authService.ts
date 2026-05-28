import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';

import { assertFirebaseConfigured, auth } from '@/services/firebase';

interface AuthIdentity {
  uid: string;
  email: string;
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
