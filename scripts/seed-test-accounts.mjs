/* eslint-disable expo/no-dynamic-env-var */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';

function loadDotEnvIfPresent() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    return;
  }

  const raw = readFileSync(envPath, 'utf-8');
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    value = value.replace(/^['"]|['"]$/g, '');

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variavel obrigatoria ausente: ${name}`);
  }
  return value;
}

async function ensureUser(auth, email, password) {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    return { credential, created: true };
  } catch (error) {
    const code = error?.code ?? '';
    if (code === 'auth/email-already-in-use') {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return { credential, created: false };
    }
    throw error;
  }
}

async function main() {
  loadDotEnvIfPresent();

  const config = {
    apiKey: requiredEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
    authDomain: requiredEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: requiredEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: requiredEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: requiredEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: requiredEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
  };

  const defaultPassword = process.env.TEST_ACCOUNT_PASSWORD ?? 'Nailflow@123';
  const salonId = 'salon-teste-001';

  const accounts = [
    {
      email: 'manicure.teste@nailflow.app',
      password: defaultPassword,
      role: 'manicure',
      displayName: 'Manicure Teste',
      salonId,
    },
    {
      email: 'owner.teste@nailflow.app',
      password: defaultPassword,
      role: 'salon_owner',
      displayName: 'Owner Teste',
      salonId,
    },
    {
      email: 'admin.teste@nailflow.app',
      password: defaultPassword,
      role: 'super_admin',
      displayName: 'Admin Teste',
      salonId: null,
    },
  ];

  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log('Criando/atualizando contas de teste...');

  for (const account of accounts) {
    const { credential, created } = await ensureUser(auth, account.email, account.password);
    await setDoc(
      doc(db, 'users', credential.user.uid),
      {
        uid: credential.user.uid,
        email: account.email,
        displayName: account.displayName,
        role: account.role,
        salonId: account.salonId,
        googleCalendar: {
          connected: false,
        },
        notificationPreferences: {
          newAppointment: true,
          appointmentCanceled: true,
          appointmentRescheduled: true,
          preReminder: true,
          syncError: true,
          googleExpired: true,
        },
        fcmTokens: [],
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log(
      `${created ? 'CRIADA' : 'ATUALIZADA'}: ${account.email} | role=${account.role} | senha=${account.password}`
    );
  }

  await signOut(auth);
  console.log('Seed concluida.');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Falha no seed de contas: ${message}`);
  process.exit(1);
});
