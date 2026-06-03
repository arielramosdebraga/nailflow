import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const runtime = vi.hoisted(() => ({
  os: 'android',
  appOwnership: 'expo' as string | null,
}));

const notificationsMock = vi.hoisted(() => ({
  setNotificationChannelAsync: vi.fn(),
  getPermissionsAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  getExpoPushTokenAsync: vi.fn(),
  AndroidImportance: {
    MAX: 'max',
  },
  IosAuthorizationStatus: {
    PROVISIONAL: 'PROVISIONAL',
  },
}));

vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return runtime.os;
    },
  },
}));

vi.mock('expo-constants', () => ({
  default: {
    get appOwnership() {
      return runtime.appOwnership;
    },
    expoConfig: null,
    easConfig: null,
  },
}));

vi.mock('expo-notifications', () => notificationsMock);

vi.mock('firebase/firestore', () => ({
  arrayUnion: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock('@/services/firebase', () => ({
  assertFirebaseConfigured: vi.fn(),
  db: null,
}));

let bootstrapPushTokenRegistrationAsync: typeof import('@/services/notifications/pushNotificationsService').bootstrapPushTokenRegistrationAsync;
let isRemotePushUnsupportedInExpoGo: typeof import('@/services/notifications/pushNotificationsService').isRemotePushUnsupportedInExpoGo;

describe('pushNotificationsService', () => {
  beforeAll(async () => {
    const service = await import('@/services/notifications/pushNotificationsService');
    bootstrapPushTokenRegistrationAsync = service.bootstrapPushTokenRegistrationAsync;
    isRemotePushUnsupportedInExpoGo = service.isRemotePushUnsupportedInExpoGo;
  });

  beforeEach(() => {
    runtime.os = 'android';
    runtime.appOwnership = 'expo';
    vi.clearAllMocks();
  });

  it('identifica push remoto indisponivel no Expo Go para Android', () => {
    expect(isRemotePushUnsupportedInExpoGo()).toBe(true);
  });

  it('nao marca development build como Expo Go', () => {
    runtime.appOwnership = null;

    expect(isRemotePushUnsupportedInExpoGo()).toBe(false);
  });

  it('ignora bootstrap de push remoto no Expo Go Android', async () => {
    await expect(bootstrapPushTokenRegistrationAsync('user-123')).resolves.toEqual({
      status: 'expo_go_unsupported',
    });

    expect(notificationsMock.setNotificationChannelAsync).not.toHaveBeenCalled();
    expect(notificationsMock.getPermissionsAsync).not.toHaveBeenCalled();
    expect(notificationsMock.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });
});
