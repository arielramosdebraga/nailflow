import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore';

import { PersistedUserRoleSchema, type UserRole, normalizeUserRole } from '@/schemas/users/user.schema';
import { assertFirebaseConfigured, db } from '@/services/firebase';

export interface AdminUserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  salonId: string | null;
  active: boolean;
  createdAt: Date | null;
}

interface ListAdminUsersParams {
  limitCount?: number;
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return value;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    return value.toDate();
  }

  return null;
}

function mapAdminUserSnapshot(snapshot: DocumentSnapshot<DocumentData>): AdminUserProfile {
  const data = snapshot.data();
  if (!data) {
    throw new Error('Perfil de usuario nao encontrado.');
  }

  const roleResult = PersistedUserRoleSchema.safeParse(data.role);
  if (!roleResult.success) {
    throw new Error('Perfil de usuario sem role valido.');
  }

  return {
    uid: snapshot.id,
    displayName: typeof data.displayName === 'string' ? data.displayName : '',
    email: typeof data.email === 'string' ? data.email : '',
    role: normalizeUserRole(roleResult.data),
    salonId: typeof data.salonId === 'string' ? data.salonId : null,
    active: data.active !== false,
    createdAt: parseDate(data.createdAt),
  };
}

export async function listAdminUsers(params: ListAdminUsersParams = {}): Promise<AdminUserProfile[]> {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponivel.');
  }

  const usersQuery = query(
    collection(db, 'users'),
    orderBy('displayName', 'asc'),
    limit(params.limitCount ?? 300)
  );
  const snapshot = await getDocs(usersQuery);
  return snapshot.docs.map((item) => mapAdminUserSnapshot(item));
}
