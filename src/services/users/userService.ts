import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { UserRoleSchema, type UserRole } from '@/schemas/users/user.schema';
import { assertFirebaseConfigured, db } from '@/services/firebase';

interface CreateUserProfileParams {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  salonId?: string | null;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  salonId: string | null;
}

export async function createUserProfile(params: CreateUserProfileParams): Promise<void> {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponivel.');
  }

  const userRef = doc(db, 'users', params.uid);
  await setDoc(
    userRef,
    {
      uid: params.uid,
      email: params.email,
      displayName: params.displayName,
      role: params.role,
      salonId: params.salonId ?? null,
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
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getUserProfileById(uid: string): Promise<UserProfile | null> {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponivel.');
  }

  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  const roleResult = UserRoleSchema.safeParse(data.role);

  if (!roleResult.success) {
    throw new Error('Perfil de usuario sem role valido.');
  }

  return {
    uid,
    email: typeof data.email === 'string' ? data.email : '',
    displayName: typeof data.displayName === 'string' ? data.displayName : '',
    role: roleResult.data,
    salonId: typeof data.salonId === 'string' ? data.salonId : null,
  };
}
