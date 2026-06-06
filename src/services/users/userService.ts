import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type QueryConstraint,
} from 'firebase/firestore';

import {
  PersistedUserRoleSchema,
  normalizeUserRole,
  type PersistedUserRole,
  type UserRole,
} from '@/schemas/users/user.schema';
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
  secondFactorRequired: boolean;
  phone: string | null;
  photoURL: string | null;
  googleCalendarConnected: boolean;
  createdAt: Date | null;
}

interface ListUsersParams {
  salonId: string;
  roles?: UserRole[];
  limitCount?: number;
  searchTerm?: string;
}

function normalizeRoleFilters(roles: UserRole[] | undefined): PersistedUserRole[] | null {
  if (!roles?.length) {
    return null;
  }

  const normalized = new Set<PersistedUserRole>();

  for (const role of roles) {
    if (role === 'nail_technician') {
      normalized.add('nail_technician');
      normalized.add('manicure');
      continue;
    }

    normalized.add(role);
  }

  const values = Array.from(normalized);
  if (!values.length) {
    return null;
  }

  return values;
}

function mapUserSnapshot(snapshot: DocumentSnapshot<DocumentData>): UserProfile {
  const data = snapshot.data();
  if (!data) {
    throw new Error('Perfil de usuário não encontrado.');
  }

  const roleResult = PersistedUserRoleSchema.safeParse(data.role);
  if (!roleResult.success) {
    throw new Error('Perfil de usuário sem papel válido.');
  }

  const createdAtValue = data.createdAt;
  const createdAt =
    typeof createdAtValue === 'object' &&
    createdAtValue !== null &&
    'toDate' in createdAtValue &&
    typeof createdAtValue.toDate === 'function'
      ? createdAtValue.toDate()
      : null;

  const googleCalendarRaw =
    typeof data.googleCalendar === 'object' && data.googleCalendar !== null
      ? (data.googleCalendar as { connected?: unknown })
      : null;
  const twoFactorRaw =
    typeof data.twoFactor === 'object' && data.twoFactor !== null
      ? (data.twoFactor as { totp?: { enabled?: unknown } })
      : null;
  const role = normalizeUserRole(roleResult.data);
  const totpEnabled = twoFactorRaw?.totp?.enabled === true;

  return {
    uid: snapshot.id,
    email: typeof data.email === 'string' ? data.email : '',
    displayName: typeof data.displayName === 'string' ? data.displayName : '',
    role,
    salonId: typeof data.salonId === 'string' ? data.salonId : null,
    secondFactorRequired:
      (role === 'super_admin' || role === 'salon_owner') && totpEnabled,
    phone: typeof data.phone === 'string' ? data.phone : null,
    photoURL: typeof data.photoURL === 'string' ? data.photoURL : null,
    googleCalendarConnected: Boolean(googleCalendarRaw?.connected),
    createdAt,
  };
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
        syncStatus: 'idle',
        tokenVersion: 1,
        isRefreshingToken: false,
      },
      notificationPreferences: {
        newAppointment: true,
        appointmentCanceled: true,
        appointmentRescheduled: true,
        preReminder: true,
        syncError: true,
        googleExpired: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        preReminderMinutes: 60,
      },
      twoFactor: {
        totp: {
          required: false,
          enabled: false,
          secret: null,
          pendingSecret: null,
          enrolledAt: null,
          enrollmentStartedAt: null,
          lastVerifiedAt: null,
        },
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

  return mapUserSnapshot(snapshot);
}

export async function listUsers(params: ListUsersParams): Promise<UserProfile[]> {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponivel.');
  }

  const parsedSalonId = params.salonId.trim();
  if (!parsedSalonId) {
    return [];
  }

  const constraints: QueryConstraint[] = [where('salonId', '==', parsedSalonId)];

  const parsedRoles = normalizeRoleFilters(params.roles);
  if (parsedRoles && parsedRoles.length === 1) {
    constraints.push(where('role', '==', parsedRoles[0]));
  }

  if (parsedRoles && parsedRoles.length > 1) {
    constraints.push(where('role', 'in', parsedRoles));
  }

  const normalizedSearch = params.searchTerm?.trim() ?? '';
  if (normalizedSearch) {
    constraints.push(where('displayName', '>=', normalizedSearch));
    constraints.push(where('displayName', '<=', `${normalizedSearch}\uf8ff`));
  }

  constraints.push(orderBy('displayName', 'asc'));
  constraints.push(limit(params.limitCount ?? 100));

  const usersQuery = query(collection(db, 'users'), ...constraints);
  const snapshot = await getDocs(usersQuery);

  return snapshot.docs.map((item) => mapUserSnapshot(item));
}
