import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore';

import { SalonSchema, type Salon } from '@/schemas/salons/salon.schema';
import { assertFirebaseConfigured, db } from '@/services/firebase';

interface ListSalonsParams {
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

function mapSalonSnapshot(snapshot: DocumentSnapshot<DocumentData>): Salon {
  const data = snapshot.data();
  if (!data) {
    throw new Error('Salão não encontrado.');
  }

  const settings =
    typeof data.settings === 'object' && data.settings !== null
      ? (data.settings as { timezone?: unknown; currency?: unknown })
      : {};

  return SalonSchema.parse({
    id: snapshot.id,
    name: typeof data.name === 'string' ? data.name : '',
    ownerId: typeof data.ownerId === 'string' ? data.ownerId : null,
    active: Boolean(data.active),
    timezone: typeof settings.timezone === 'string' ? settings.timezone : 'America/Sao_Paulo',
    currency: typeof settings.currency === 'string' ? settings.currency : 'BRL',
    createdAt: parseDate(data.createdAt),
    updatedAt: parseDate(data.updatedAt),
  });
}

export async function listSalons(params: ListSalonsParams = {}): Promise<Salon[]> {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponível.');
  }

  const salonsQuery = query(
    collection(db, 'salons'),
    orderBy('name', 'asc'),
    limit(params.limitCount ?? 200)
  );
  const snapshot = await getDocs(salonsQuery);
  return snapshot.docs.map((item) => mapSalonSnapshot(item));
}

export async function getSalonById(salonId: string): Promise<Salon | null> {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponível.');
  }

  const snapshot = await getDoc(doc(db, 'salons', salonId));

  if (!snapshot.exists()) {
    return null;
  }

  return mapSalonSnapshot(snapshot);
}
