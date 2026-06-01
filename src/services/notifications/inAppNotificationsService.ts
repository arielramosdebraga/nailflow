import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
  type FirestoreError,
  type QuerySnapshot,
} from 'firebase/firestore';

import { assertFirebaseConfigured, db } from '@/services/firebase';

const NOTIFICATIONS_COLLECTION = 'notifications';
const USERS_COLLECTION = 'users';

export type NotificationPriority = 'high' | 'normal' | 'low';

export type NotificationType =
  | 'new_appointment'
  | 'appointment_canceled'
  | 'appointment_rescheduled'
  | 'pre_reminder'
  | 'sync_error'
  | 'google_expired';

export interface NotificationPreferences {
  newAppointment: boolean;
  appointmentCanceled: boolean;
  appointmentRescheduled: boolean;
  preReminder: boolean;
  syncError: boolean;
  googleExpired: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  preReminderMinutes: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  priority: NotificationPriority;
  channel: string[];
  data: Record<string, unknown>;
  createdAt: Date | null;
  readAt: Date | null;
}

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
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
};

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

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

function parseNotificationType(value: unknown): NotificationType {
  switch (value) {
    case 'appointment_canceled':
    case 'appointment_rescheduled':
    case 'pre_reminder':
    case 'sync_error':
    case 'google_expired':
      return value;
    case 'new_appointment':
    default:
      return 'new_appointment';
  }
}

function parseNotificationPriority(value: unknown): NotificationPriority {
  switch (value) {
    case 'high':
    case 'low':
      return value;
    case 'normal':
    default:
      return 'normal';
  }
}

function mapNotificationSnapshot(snapshot: DocumentSnapshot<DocumentData>): AppNotification {
  const data = snapshot.data();
  if (!data) {
    throw new Error('Notificacao nao encontrada.');
  }

  const channel =
    Array.isArray(data.channel) && data.channel.every((item) => typeof item === 'string')
      ? data.channel
      : [];

  const metadata = typeof data.data === 'object' && data.data !== null ? data.data : {};

  return {
    id: snapshot.id,
    userId: typeof data.userId === 'string' ? data.userId : '',
    type: parseNotificationType(data.type),
    title: typeof data.title === 'string' ? data.title : 'Atualizacao',
    body: typeof data.body === 'string' ? data.body : '',
    read: Boolean(data.read),
    priority: parseNotificationPriority(data.priority),
    channel,
    data: metadata as Record<string, unknown>,
    createdAt: parseDate(data.createdAt),
    readAt: parseDate(data.readAt),
  };
}

function parseQuietHours(time: unknown, fallback: string): string {
  if (typeof time !== 'string') {
    return fallback;
  }

  const normalized = time.trim();
  if (!/^\d{2}:\d{2}$/.test(normalized)) {
    return fallback;
  }

  return normalized;
}

function mapNotificationPreferences(raw: unknown): NotificationPreferences {
  if (typeof raw !== 'object' || raw === null) {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  const data = raw as Partial<NotificationPreferences>;

  return {
    newAppointment:
      typeof data.newAppointment === 'boolean'
        ? data.newAppointment
        : DEFAULT_NOTIFICATION_PREFERENCES.newAppointment,
    appointmentCanceled:
      typeof data.appointmentCanceled === 'boolean'
        ? data.appointmentCanceled
        : DEFAULT_NOTIFICATION_PREFERENCES.appointmentCanceled,
    appointmentRescheduled:
      typeof data.appointmentRescheduled === 'boolean'
        ? data.appointmentRescheduled
        : DEFAULT_NOTIFICATION_PREFERENCES.appointmentRescheduled,
    preReminder:
      typeof data.preReminder === 'boolean'
        ? data.preReminder
        : DEFAULT_NOTIFICATION_PREFERENCES.preReminder,
    syncError:
      typeof data.syncError === 'boolean' ? data.syncError : DEFAULT_NOTIFICATION_PREFERENCES.syncError,
    googleExpired:
      typeof data.googleExpired === 'boolean'
        ? data.googleExpired
        : DEFAULT_NOTIFICATION_PREFERENCES.googleExpired,
    quietHoursEnabled:
      typeof data.quietHoursEnabled === 'boolean'
        ? data.quietHoursEnabled
        : DEFAULT_NOTIFICATION_PREFERENCES.quietHoursEnabled,
    quietHoursStart: parseQuietHours(
      data.quietHoursStart,
      DEFAULT_NOTIFICATION_PREFERENCES.quietHoursStart
    ),
    quietHoursEnd: parseQuietHours(data.quietHoursEnd, DEFAULT_NOTIFICATION_PREFERENCES.quietHoursEnd),
    preReminderMinutes:
      typeof data.preReminderMinutes === 'number' &&
      Number.isInteger(data.preReminderMinutes) &&
      data.preReminderMinutes >= 5 &&
      data.preReminderMinutes <= 1440
        ? data.preReminderMinutes
        : DEFAULT_NOTIFICATION_PREFERENCES.preReminderMinutes,
  };
}

function assertDatabaseAvailable() {
  assertFirebaseConfigured();
  if (!db) {
    throw new Error('Banco Firestore indisponivel.');
  }
}

interface SubscribeNotificationsParams {
  userId: string;
  limitCount?: number;
}

export async function listUserNotifications(
  params: SubscribeNotificationsParams
): Promise<AppNotification[]> {
  const normalizedUserId = params.userId.trim();
  if (!normalizedUserId) {
    return [];
  }

  assertDatabaseAvailable();

  const notificationsRef = collection(db!, NOTIFICATIONS_COLLECTION);
  const notificationsQuery = query(
    notificationsRef,
    where('userId', '==', normalizedUserId),
    orderBy('createdAt', 'desc'),
    limit(params.limitCount ?? 100)
  );

  const snapshot = await getDocs(notificationsQuery);
  return snapshot.docs.map((item) => mapNotificationSnapshot(item));
}

export function subscribeUserNotifications(
  params: SubscribeNotificationsParams,
  onChange: (notifications: AppNotification[]) => void,
  onError?: (error: Error) => void
): () => void {
  const normalizedUserId = params.userId.trim();
  if (!normalizedUserId) {
    onChange([]);
    return () => undefined;
  }

  try {
    assertDatabaseAvailable();
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error('Firestore indisponivel.'));
    return () => undefined;
  }

  const notificationsRef = collection(db!, NOTIFICATIONS_COLLECTION);
  const notificationsQuery = query(
    notificationsRef,
    where('userId', '==', normalizedUserId),
    orderBy('createdAt', 'desc'),
    limit(params.limitCount ?? 100)
  );

  return onSnapshot(
    notificationsQuery,
    (snapshot: QuerySnapshot<DocumentData>) => {
      onChange(snapshot.docs.map((item) => mapNotificationSnapshot(item)));
    },
    (error: FirestoreError) => {
      onError?.(new Error(error.message));
    }
  );
}

export function subscribeUnreadNotificationsCount(
  userId: string,
  onChange: (count: number) => void,
  onError?: (error: Error) => void
): () => void {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    onChange(0);
    return () => undefined;
  }

  try {
    assertDatabaseAvailable();
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error('Firestore indisponivel.'));
    return () => undefined;
  }

  const notificationsRef = collection(db!, NOTIFICATIONS_COLLECTION);
  const unreadQuery = query(
    notificationsRef,
    where('userId', '==', normalizedUserId),
    where('read', '==', false),
    limit(500)
  );

  return onSnapshot(
    unreadQuery,
    (snapshot: QuerySnapshot<DocumentData>) => onChange(snapshot.size),
    (error: FirestoreError) => onError?.(new Error(error.message))
  );
}

export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    return 0;
  }

  assertDatabaseAvailable();

  const notificationsRef = collection(db!, NOTIFICATIONS_COLLECTION);
  const unreadQuery = query(
    notificationsRef,
    where('userId', '==', normalizedUserId),
    where('read', '==', false),
    limit(500)
  );

  const snapshot = await getDocs(unreadQuery);
  return snapshot.size;
}

interface MarkNotificationAsReadParams {
  userId: string;
  notificationId: string;
}

export async function markNotificationAsRead(
  params: MarkNotificationAsReadParams
): Promise<boolean> {
  const normalizedUserId = params.userId.trim();
  const normalizedNotificationId = params.notificationId.trim();

  if (!normalizedUserId || !normalizedNotificationId) {
    return false;
  }

  assertDatabaseAvailable();

  const notificationRef = doc(db!, NOTIFICATIONS_COLLECTION, normalizedNotificationId);
  await updateDoc(notificationRef, {
    read: true,
    readAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return true;
}

export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    return 0;
  }

  assertDatabaseAvailable();

  const notificationsRef = collection(db!, NOTIFICATIONS_COLLECTION);
  const unreadQuery = query(
    notificationsRef,
    where('userId', '==', normalizedUserId),
    where('read', '==', false),
    limit(500)
  );

  const snapshot = await getDocs(unreadQuery);
  if (snapshot.empty) {
    return 0;
  }

  const batch = writeBatch(db!);
  for (const item of snapshot.docs) {
    batch.update(item.ref, {
      read: true,
      readAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();

  return snapshot.size;
}

export function subscribeNotificationPreferences(
  userId: string,
  onChange: (preferences: NotificationPreferences) => void,
  onError?: (error: Error) => void
): () => void {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    onChange(DEFAULT_NOTIFICATION_PREFERENCES);
    return () => undefined;
  }

  try {
    assertDatabaseAvailable();
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error('Firestore indisponivel.'));
    return () => undefined;
  }

  const userRef = doc(db!, USERS_COLLECTION, normalizedUserId);
  return onSnapshot(
    userRef,
    (snapshot) => {
      const data = snapshot.data();
      onChange(mapNotificationPreferences(data?.notificationPreferences));
    },
    (error) => {
      onError?.(new Error(error.message));
    }
  );
}

export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  assertDatabaseAvailable();
  const userRef = doc(db!, USERS_COLLECTION, normalizedUserId);
  const snapshot = await getDoc(userRef);

  return mapNotificationPreferences(snapshot.data()?.notificationPreferences);
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences
): Promise<void> {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    throw new Error('Usuario invalido para atualizar preferencias.');
  }

  assertDatabaseAvailable();

  const normalizedPreferences = mapNotificationPreferences(preferences);
  const userRef = doc(db!, USERS_COLLECTION, normalizedUserId);
  await updateDoc(userRef, {
    notificationPreferences: normalizedPreferences,
    updatedAt: serverTimestamp(),
  });
}

export function getDefaultNotificationPreferences(): NotificationPreferences {
  return DEFAULT_NOTIFICATION_PREFERENCES;
}
