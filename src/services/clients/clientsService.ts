import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type DocumentSnapshot,
  type QueryConstraint,
  Timestamp,
} from 'firebase/firestore';

import { ClientSchema, UpsertClientSchema, type Client, type UpsertClientInput } from '@/schemas/clients/client.schema';
import { assertFirebaseConfigured, db } from '@/services/firebase';

interface ListClientsParams {
  salonId: string;
  limitCount?: number;
  searchTerm?: string;
}

function toDateOrNull(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const maybeTimestamp = value as { toDate: () => Date };
    return maybeTimestamp.toDate();
  }

  return null;
}

function mapClientSnapshot(snapshot: DocumentSnapshot<DocumentData>): Client {
  const data = snapshot.data();
  if (!data) {
    throw new Error('Cliente nao encontrado.');
  }

  return ClientSchema.parse({
    id: snapshot.id,
    salonId: typeof data.salonId === 'string' ? data.salonId : '',
    name: typeof data.name === 'string' ? data.name : '',
    phone: typeof data.phone === 'string' ? data.phone : '',
    email: typeof data.email === 'string' ? data.email : null,
    birthDate: toDateOrNull(data.birthDate),
    notes: typeof data.notes === 'string' ? data.notes : '',
    tags: Array.isArray(data.tags) ? data.tags.filter((value) => typeof value === 'string') : [],
    createdAt: toDateOrNull(data.createdAt),
    lastVisit: toDateOrNull(data.lastVisit),
  });
}

function sanitizeClientInput(input: UpsertClientInput): UpsertClientInput {
  return UpsertClientSchema.parse({
    ...input,
    name: input.name.trim(),
    phone: input.phone.trim(),
  });
}

export async function listClients(params: ListClientsParams): Promise<Client[]> {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponivel.');
  }

  const parsedSalonId = params.salonId.trim();
  if (!parsedSalonId) {
    return [];
  }

  const constraints: QueryConstraint[] = [where('salonId', '==', parsedSalonId)];

  const normalizedSearch = params.searchTerm?.trim() ?? '';
  if (normalizedSearch) {
    constraints.push(where('name', '>=', normalizedSearch));
    constraints.push(where('name', '<=', `${normalizedSearch}\uf8ff`));
  }

  constraints.push(orderBy('name', 'asc'));
  constraints.push(limit(params.limitCount ?? 100));

  const clientsQuery = query(collection(db, 'clients'), ...constraints);
  const snapshot = await getDocs(clientsQuery);

  return snapshot.docs.map((item) => mapClientSnapshot(item));
}

export async function getClientById(clientId: string): Promise<Client | null> {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponivel.');
  }

  const parsedClientId = clientId.trim();
  if (!parsedClientId) {
    return null;
  }

  const clientRef = doc(db, 'clients', parsedClientId);
  const snapshot = await getDoc(clientRef);
  if (!snapshot.exists()) {
    return null;
  }

  return mapClientSnapshot(snapshot);
}

export async function createClient(input: UpsertClientInput): Promise<string> {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponivel.');
  }

  const parsed = sanitizeClientInput(input);

  const clientRef = await addDoc(collection(db, 'clients'), {
    salonId: parsed.salonId,
    name: parsed.name,
    phone: parsed.phone,
    email: parsed.email,
    birthDate: parsed.birthDate,
    notes: parsed.notes,
    tags: parsed.tags,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastVisit: parsed.lastVisit,
  });

  return clientRef.id;
}

export async function updateClient(clientId: string, input: UpsertClientInput): Promise<void> {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponivel.');
  }

  const parsedClientId = clientId.trim();
  if (!parsedClientId) {
    throw new Error('ID de cliente invalido.');
  }

  const parsed = sanitizeClientInput(input);
  const clientRef = doc(db, 'clients', parsedClientId);

  await updateDoc(clientRef, {
    salonId: parsed.salonId,
    name: parsed.name,
    phone: parsed.phone,
    email: parsed.email,
    birthDate: parsed.birthDate,
    notes: parsed.notes,
    tags: parsed.tags,
    lastVisit: parsed.lastVisit,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteClient(clientId: string): Promise<void> {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponivel.');
  }

  const parsedClientId = clientId.trim();
  if (!parsedClientId) {
    throw new Error('ID de cliente invalido.');
  }

  const clientRef = doc(db, 'clients', parsedClientId);
  await deleteDoc(clientRef);
}
