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

import {
  AppointmentSchema,
  ListAppointmentsIntervalSchema,
  UpsertAppointmentSchema,
  UpdateAppointmentStatusSchema,
  type Appointment,
  type AppointmentStatus,
  type UpsertAppointmentInput,
} from '@/schemas/appointments/appointment.schema';
import {
  assertNoAppointmentConflict,
  BLOCKING_CONFLICT_STATUSES,
  type ConflictCandidate,
} from '@/services/appointments/conflictValidation';
import { assertFirebaseConfigured, db } from '@/services/firebase';

interface ListAppointmentsParams {
  salonId: string;
  start: Date;
  end: Date;
  manicureId?: string;
  clientId?: string;
  statuses?: AppointmentStatus[];
  limitCount?: number;
}

interface EnsureNoConflictParams {
  salonId: string;
  manicureId: string;
  startTime: Date;
  endTime: Date;
  appointmentIdToIgnore?: string;
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

function mapAppointmentSnapshot(snapshot: DocumentSnapshot<DocumentData>): Appointment {
  const data = snapshot.data();
  if (!data) {
    throw new Error('Atendimento nao encontrado.');
  }

  return AppointmentSchema.parse({
    id: snapshot.id,
    salonId: typeof data.salonId === 'string' ? data.salonId : '',
    manicureId: typeof data.manicureId === 'string' ? data.manicureId : '',
    clientId: typeof data.clientId === 'string' ? data.clientId : '',
    status: typeof data.status === 'string' ? data.status : 'scheduled',
    startTime: toDateOrNull(data.startTime),
    endTime: toDateOrNull(data.endTime),
    notes: typeof data.notes === 'string' ? data.notes : '',
    priceCents: typeof data.priceCents === 'number' ? data.priceCents : 0,
    googleEventId: typeof data.googleEventId === 'string' ? data.googleEventId : undefined,
    syncStatus: typeof data.syncStatus === 'string' ? data.syncStatus : 'disabled',
    syncUpdatedAt: toDateOrNull(data.syncUpdatedAt),
    syncErrorMessage: typeof data.syncErrorMessage === 'string' ? data.syncErrorMessage : undefined,
    createdAt: toDateOrNull(data.createdAt),
    updatedAt: toDateOrNull(data.updatedAt),
  });
}

function sanitizeAppointmentInput(input: UpsertAppointmentInput): UpsertAppointmentInput {
  return UpsertAppointmentSchema.parse({
    ...input,
    salonId: input.salonId.trim(),
    manicureId: input.manicureId.trim(),
    clientId: input.clientId.trim(),
    notes: input.notes.trim(),
  });
}

function normalizeStatuses(statuses: AppointmentStatus[] | undefined): AppointmentStatus[] | null {
  if (!statuses?.length) {
    return null;
  }

  const unique = Array.from(new Set(statuses));
  if (!unique.length) {
    return null;
  }

  return unique;
}

async function ensureNoManicureConflict(params: EnsureNoConflictParams): Promise<void> {
  if (!db) {
    throw new Error('Banco Firestore indisponivel.');
  }

  const conflictsQuery = query(
    collection(db, 'appointments'),
    where('salonId', '==', params.salonId),
    where('manicureId', '==', params.manicureId),
    where('status', 'in', BLOCKING_CONFLICT_STATUSES),
    where('startTime', '<', params.endTime),
    where('endTime', '>', params.startTime),
    orderBy('startTime', 'asc'),
    limit(20),
  );

  const snapshot = await getDocs(conflictsQuery);
  const candidates: ConflictCandidate[] = snapshot.docs.map((item) => {
    const appointment = mapAppointmentSnapshot(item);
    return {
      id: appointment.id,
      manicureId: appointment.manicureId,
      status: appointment.status,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
    };
  });

  assertNoAppointmentConflict({
    appointmentIdToIgnore: params.appointmentIdToIgnore,
    manicureId: params.manicureId,
    startTime: params.startTime,
    endTime: params.endTime,
    candidates,
  });
}

export async function listAppointments(params: ListAppointmentsParams): Promise<Appointment[]> {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponivel.');
  }

  const parsedSalonId = params.salonId.trim();
  if (!parsedSalonId) {
    return [];
  }

  const parsedInterval = ListAppointmentsIntervalSchema.parse({
    start: params.start,
    end: params.end,
  });

  const constraints: QueryConstraint[] = [
    where('salonId', '==', parsedSalonId),
    where('startTime', '<', parsedInterval.end),
    where('endTime', '>', parsedInterval.start),
  ];

  const parsedManicureId = params.manicureId?.trim() ?? '';
  if (parsedManicureId) {
    constraints.push(where('manicureId', '==', parsedManicureId));
  }

  const parsedClientId = params.clientId?.trim() ?? '';
  if (parsedClientId) {
    constraints.push(where('clientId', '==', parsedClientId));
  }

  const parsedStatuses = normalizeStatuses(params.statuses);
  if (parsedStatuses) {
    constraints.push(where('status', 'in', parsedStatuses));
  }

  constraints.push(orderBy('startTime', 'asc'));
  constraints.push(limit(params.limitCount ?? 300));

  const appointmentsQuery = query(collection(db, 'appointments'), ...constraints);
  const snapshot = await getDocs(appointmentsQuery);

  return snapshot.docs.map((item) => mapAppointmentSnapshot(item));
}

export async function getAppointmentById(appointmentId: string): Promise<Appointment | null> {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponivel.');
  }

  const parsedAppointmentId = appointmentId.trim();
  if (!parsedAppointmentId) {
    return null;
  }

  const appointmentRef = doc(db, 'appointments', parsedAppointmentId);
  const snapshot = await getDoc(appointmentRef);
  if (!snapshot.exists()) {
    return null;
  }

  return mapAppointmentSnapshot(snapshot);
}

export async function createAppointment(input: UpsertAppointmentInput): Promise<string> {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponivel.');
  }

  const parsed = sanitizeAppointmentInput(input);
  await ensureNoManicureConflict({
    salonId: parsed.salonId,
    manicureId: parsed.manicureId,
    startTime: parsed.startTime,
    endTime: parsed.endTime,
  });

  const appointmentRef = await addDoc(collection(db, 'appointments'), {
    salonId: parsed.salonId,
    manicureId: parsed.manicureId,
    clientId: parsed.clientId,
    status: parsed.status,
    startTime: parsed.startTime,
    endTime: parsed.endTime,
    notes: parsed.notes,
    priceCents: parsed.priceCents,
    syncStatus: 'pending',
    syncUpdatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return appointmentRef.id;
}

export async function updateAppointment(appointmentId: string, input: UpsertAppointmentInput): Promise<void> {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponivel.');
  }

  const parsedAppointmentId = appointmentId.trim();
  if (!parsedAppointmentId) {
    throw new Error('ID de atendimento invalido.');
  }

  const parsed = sanitizeAppointmentInput(input);
  await ensureNoManicureConflict({
    salonId: parsed.salonId,
    manicureId: parsed.manicureId,
    startTime: parsed.startTime,
    endTime: parsed.endTime,
    appointmentIdToIgnore: parsedAppointmentId,
  });

  const appointmentRef = doc(db, 'appointments', parsedAppointmentId);

  await updateDoc(appointmentRef, {
    salonId: parsed.salonId,
    manicureId: parsed.manicureId,
    clientId: parsed.clientId,
    status: parsed.status,
    startTime: parsed.startTime,
    endTime: parsed.endTime,
    notes: parsed.notes,
    priceCents: parsed.priceCents,
    syncStatus: 'pending',
    syncUpdatedAt: serverTimestamp(),
    syncErrorMessage: null,
    updatedAt: serverTimestamp(),
  });
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
): Promise<void> {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponivel.');
  }

  const parsedAppointmentId = appointmentId.trim();
  if (!parsedAppointmentId) {
    throw new Error('ID de atendimento invalido.');
  }

  const parsedStatus = UpdateAppointmentStatusSchema.parse({ status });
  const appointmentRef = doc(db, 'appointments', parsedAppointmentId);

  await updateDoc(appointmentRef, {
    status: parsedStatus.status,
    syncStatus: 'pending',
    syncUpdatedAt: serverTimestamp(),
    syncErrorMessage: null,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteAppointment(appointmentId: string): Promise<void> {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponivel.');
  }

  const parsedAppointmentId = appointmentId.trim();
  if (!parsedAppointmentId) {
    throw new Error('ID de atendimento invalido.');
  }

  const appointmentRef = doc(db, 'appointments', parsedAppointmentId);
  await deleteDoc(appointmentRef);
}
