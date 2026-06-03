import { Platform } from 'react-native';

import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { arrayUnion, doc, setDoc } from 'firebase/firestore';

import { assertFirebaseConfigured, db } from '@/services/firebase';

const ANDROID_NOTIFICATION_CHANNEL_ID = 'nailflow-default';

type PushPermissionStatus = 'granted' | 'denied' | 'error';

export interface PushPermissionResult {
  status: PushPermissionStatus;
}

export type PushTokenBootstrapStatus =
  | 'registered'
  | 'expo_go_unsupported'
  | 'permission_denied'
  | 'missing_project_id'
  | 'token_unavailable'
  | 'service_unavailable';

export interface PushTokenBootstrapResult {
  status: PushTokenBootstrapStatus;
  token?: string;
}

export function isRemotePushUnsupportedInExpoGo(): boolean {
  return Platform.OS === 'android' && Constants.appOwnership === 'expo';
}

function getExpoProjectId(): string | null {
  const fromEnv = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  const fromExpoConfig = Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof fromExpoConfig === 'string' && fromExpoConfig.trim().length > 0) {
    return fromExpoConfig.trim();
  }

  const fromEasConfig = Constants.easConfig?.projectId;
  if (typeof fromEasConfig === 'string' && fromEasConfig.trim().length > 0) {
    return fromEasConfig.trim();
  }

  return null;
}

async function ensureAndroidNotificationChannelAsync(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(ANDROID_NOTIFICATION_CHANNEL_ID, {
    name: 'Notificacoes NailFlow',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF6B35',
  });
}

function hasNotificationPermission(permissions: Notifications.NotificationPermissionsStatus): boolean {
  if (permissions.granted) {
    return true;
  }

  return permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function requestPushPermissionAsync(): Promise<PushPermissionResult> {
  if (isRemotePushUnsupportedInExpoGo()) {
    return { status: 'error' };
  }

  try {
    await ensureAndroidNotificationChannelAsync();

    const existingPermissions = await Notifications.getPermissionsAsync();
    if (hasNotificationPermission(existingPermissions)) {
      return { status: 'granted' };
    }

    const requestedPermissions = await Notifications.requestPermissionsAsync();
    if (hasNotificationPermission(requestedPermissions)) {
      return { status: 'granted' };
    }

    return { status: 'denied' };
  } catch {
    return { status: 'error' };
  }
}

export async function getExpoPushTokenAsync(): Promise<string | null> {
  if (isRemotePushUnsupportedInExpoGo()) {
    return null;
  }

  const projectId = getExpoProjectId();
  if (!projectId) {
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data ?? null;
  } catch {
    return null;
  }
}

export async function registerUserPushTokenAsync(uid: string, pushToken: string): Promise<boolean> {
  const normalizedUid = uid.trim();
  const normalizedToken = pushToken.trim();

  if (!normalizedUid || !normalizedToken) {
    return false;
  }

  try {
    assertFirebaseConfigured();
    if (!db) {
      return false;
    }

    const userRef = doc(db, 'users', normalizedUid);
    await setDoc(
      userRef,
      {
        fcmTokens: arrayUnion(normalizedToken),
      },
      { merge: true }
    );

    return true;
  } catch {
    return false;
  }
}

export async function bootstrapPushTokenRegistrationAsync(
  uid: string
): Promise<PushTokenBootstrapResult> {
  if (!uid.trim()) {
    return { status: 'service_unavailable' };
  }

  if (isRemotePushUnsupportedInExpoGo()) {
    return { status: 'expo_go_unsupported' };
  }

  const permission = await requestPushPermissionAsync();
  if (permission.status === 'error') {
    return { status: 'service_unavailable' };
  }

  if (permission.status !== 'granted') {
    return { status: 'permission_denied' };
  }

  const projectId = getExpoProjectId();
  if (!projectId) {
    return { status: 'missing_project_id' };
  }

  const token = await getExpoPushTokenAsync();
  if (!token) {
    return { status: 'token_unavailable' };
  }

  const saved = await registerUserPushTokenAsync(uid, token);
  if (!saved) {
    return { status: 'service_unavailable' };
  }

  return {
    status: 'registered',
    token,
  };
}
