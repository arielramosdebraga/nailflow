import {
  Timestamp,
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
} from 'firebase/firestore';

import {
  CommandSchema,
  CommandStatusSchema,
  UpsertCommandSchema,
  type Command,
  type CommandItem,
  type CommandStatus,
  type UpsertCommandInput,
} from '@/schemas/commands/command.schema';
import type { UserRole } from '@/schemas/users/user.schema';
import { calculateCommandTotals } from '@/services/commands/command-totals';
import { assertFirebaseConfigured, db } from '@/services/firebase';

interface ListCommandsParams {
  salonId: string;
  limitCount?: number;
  status?: CommandStatus;
  manicureId?: string;
  clientId?: string;
  appointmentId?: string;
}

interface UpdateCommandOptions {
  actorRole?: UserRole;
}

interface CanReopenCommandParams {
  currentStatus: CommandStatus;
  nextStatus: CommandStatus;
  actorRole: UserRole;
}

export function canReopenCommand(params: CanReopenCommandParams): boolean {
  if (params.currentStatus !== 'closed' || params.nextStatus !== 'open') {
    return true;
  }

  return params.actorRole === 'salon_owner' || params.actorRole === 'super_admin';
}

export function assertCanReopenCommand(params: CanReopenCommandParams): void {
  if (canReopenCommand(params)) {
    return;
  }

  throw new Error('Comanda fechada nao pode ser reaberta por este perfil.');
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

function toNumberOrNaN(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    return Number(value);
  }

  return Number.NaN;
}

function mapCommandItems(value: unknown): CommandItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item !== 'object' || item === null) {
        return null;
      }

      const raw = item as { service?: unknown; price?: unknown; quantity?: unknown };
      return {
        service: typeof raw.service === 'string' ? raw.service : '',
        price: toNumberOrNaN(raw.price),
        quantity: toNumberOrNaN(raw.quantity),
      };
    })
    .filter((item): item is CommandItem => item !== null);
}

function mapCommandSnapshot(snapshot: DocumentSnapshot<DocumentData>): Command {
  const data = snapshot.data();
  if (!data) {
    throw new Error('Comanda nao encontrada.');
  }

  const items = mapCommandItems(data.items);
  const totals = items.length > 0 ? calculateCommandTotals(items) : { total: Number.NaN };

  const parsedStatus = CommandStatusSchema.safeParse(data.status);
  const status = parsedStatus.success ? parsedStatus.data : 'open';
  const closedAt = status === 'closed' ? toDateOrNull(data.closedAt) : null;

  return CommandSchema.parse({
    id: snapshot.id,
    salonId: typeof data.salonId === 'string' ? data.salonId : '',
    appointmentId: typeof data.appointmentId === 'string' ? data.appointmentId : '',
    clientId: typeof data.clientId === 'string' ? data.clientId : '',
    manicureId: typeof data.manicureId === 'string' ? data.manicureId : '',
    items,
    total: typeof data.total === 'number' ? data.total : totals.total,
    paymentMethod: typeof data.paymentMethod === 'string' ? data.paymentMethod : null,
    status,
    closedAt,
    createdAt: toDateOrNull(data.createdAt),
    updatedAt: toDateOrNull(data.updatedAt),
  });
}

function sanitizeCommandInput(input: UpsertCommandInput): UpsertCommandInput {
  return UpsertCommandSchema.parse({
    ...input,
    salonId: input.salonId.trim(),
    appointmentId: input.appointmentId.trim(),
    clientId: input.clientId.trim(),
    manicureId: input.manicureId.trim(),
    items: input.items.map((item) => ({
      service: item.service.trim(),
      price: item.price,
      quantity: item.quantity,
    })),
  });
}

function assertCommandId(commandId: string): string {
  const parsedCommandId = commandId.trim();
  if (!parsedCommandId) {
    throw new Error('ID de comanda invalido.');
  }

  return parsedCommandId;
}

export async function listCommands(params: ListCommandsParams): Promise<Command[]> {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponivel.');
  }

  const parsedSalonId = params.salonId.trim();
  if (!parsedSalonId) {
    return [];
  }

  const constraints: QueryConstraint[] = [where('salonId', '==', parsedSalonId)];

  if (params.status) {
    constraints.push(where('status', '==', params.status));
  }

  if (params.manicureId?.trim()) {
    constraints.push(where('manicureId', '==', params.manicureId.trim()));
  }

  if (params.clientId?.trim()) {
    constraints.push(where('clientId', '==', params.clientId.trim()));
  }

  if (params.appointmentId?.trim()) {
    constraints.push(where('appointmentId', '==', params.appointmentId.trim()));
  }

  constraints.push(orderBy('createdAt', 'desc'));
  constraints.push(limit(params.limitCount ?? 100));

  const commandsQuery = query(collection(db, 'commands'), ...constraints);
  const snapshot = await getDocs(commandsQuery);

  return snapshot.docs.map((commandDoc) => mapCommandSnapshot(commandDoc));
}

export async function getCommandById(commandId: string): Promise<Command | null> {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponivel.');
  }

  const parsedCommandId = commandId.trim();
  if (!parsedCommandId) {
    return null;
  }

  const commandRef = doc(db, 'commands', parsedCommandId);
  const snapshot = await getDoc(commandRef);
  if (!snapshot.exists()) {
    return null;
  }

  return mapCommandSnapshot(snapshot);
}

export async function createCommand(input: UpsertCommandInput): Promise<string> {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponivel.');
  }

  const parsed = sanitizeCommandInput(input);
  const totals = calculateCommandTotals(parsed.items);

  const commandRef = await addDoc(collection(db, 'commands'), {
    salonId: parsed.salonId,
    appointmentId: parsed.appointmentId,
    clientId: parsed.clientId,
    manicureId: parsed.manicureId,
    items: parsed.items,
    total: totals.total,
    paymentMethod: parsed.paymentMethod,
    status: parsed.status,
    closedAt: parsed.status === 'closed' ? (parsed.closedAt ?? new Date()) : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return commandRef.id;
}

export async function updateCommand(
  commandId: string,
  input: UpsertCommandInput,
  options: UpdateCommandOptions = {},
): Promise<void> {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponivel.');
  }

  const parsedCommandId = assertCommandId(commandId);
  const parsed = sanitizeCommandInput(input);
  const totals = calculateCommandTotals(parsed.items);

  const commandRef = doc(db, 'commands', parsedCommandId);
  const existingSnapshot = await getDoc(commandRef);
  if (!existingSnapshot.exists()) {
    throw new Error('Comanda nao encontrada.');
  }

  const existingStatus = CommandStatusSchema.safeParse(existingSnapshot.data().status);
  if (existingStatus.success) {
    assertCanReopenCommand({
      currentStatus: existingStatus.data,
      nextStatus: parsed.status,
      actorRole: options.actorRole ?? 'nail_technician',
    });
  }

  await updateDoc(commandRef, {
    salonId: parsed.salonId,
    appointmentId: parsed.appointmentId,
    clientId: parsed.clientId,
    manicureId: parsed.manicureId,
    items: parsed.items,
    total: totals.total,
    paymentMethod: parsed.paymentMethod,
    status: parsed.status,
    closedAt: parsed.status === 'closed' ? (parsed.closedAt ?? new Date()) : null,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCommand(commandId: string): Promise<void> {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponivel.');
  }

  const parsedCommandId = assertCommandId(commandId);
  const commandRef = doc(db, 'commands', parsedCommandId);
  await deleteDoc(commandRef);
}
