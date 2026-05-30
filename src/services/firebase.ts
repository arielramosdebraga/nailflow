import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every((value) => Boolean(value));

const app: FirebaseApp | null = hasFirebaseConfig
  ? (getApps()[0] ?? initializeApp(firebaseConfig))
  : null;

export const firebaseApp = app;
export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;

export function assertFirebaseConfigured(): void {
  if (!firebaseApp || !auth || !db) {
    throw new Error(
      'Firebase nao configurado. Defina as variaveis EXPO_PUBLIC_FIREBASE_* no ambiente.'
    );
  }
}
