import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const runtime = vi.hoisted(() => ({
  os: 'android',
  projectId: 'project-123' as string | null,
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

const firestoreMock = vi.hoisted(() => ({
  arrayUnion: vi.fn((value: string) => ({ values: [value] })),
  doc: vi.fn(() => ({ id: 'user-ref' })),
  setDoc: vi.fn(),
}));

const firebaseMock = vi.hoisted(() => ({
  assertFirebaseConfigured: vi.fn(),
  db: { id: 'db' } as unknown,
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
    get expoConfig() {
      return runtime.projectId
        ? {
            extra: {
              eas: {
                projectId: runtime.projectId,
              },
            },
          }
        : null;
    },
    get easConfig() {
      return runtime.projectId
        ? {
            projectId: runtime.projectId,
          }
        : null;
    },
  },
}));

vi.mock('expo-notifications', () => notificationsMock);
vi.mock('firebase/firestore', () => firestoreMock);
vi.mock('@/services/firebase', () => firebaseMock);

let bootstrapPushTokenRegistrationAsync: typeof import('@/services/notifications/pushNotificationsService').bootstrapPushTokenRegistrationAsync;

describe('pushNotificationsService', () => {
  beforeAll(async () => {
    const service = await import('@/services/notifications/pushNotificationsService');
    bootstrapPushTokenRegistrationAsync = service.bootstrapPushTokenRegistrationAsync;
  });

  beforeEach(() => {
    runtime.os = 'android';
    runtime.projectId = 'project-123';
    firebaseMock.db = { id: 'db' };
    notificationsMock.getPermissionsAsync.mockResolvedValue({ granted: true });
    notificationsMock.requestPermissionsAsync.mockResolvedValue({ granted: true });
    notificationsMock.getExpoPushTokenAsync.mockResolvedValue({
      data: 'ExponentPushToken[token-123]',
    });
    firestoreMock.setDoc.mockResolvedValue(undefined);
    vi.clearAllMocks();
  });

  it('registra token de push em development build Android', async () => {
    await expect(bootstrapPushTokenRegistrationAsync('user-123')).resolves.toEqual({
      status: 'registered',
      token: 'ExponentPushToken[token-123]',
    });

    expect(notificationsMock.setNotificationChannelAsync).toHaveBeenCalledWith(
      'nailflow-default',
      expect.objectContaining({
        importance: 'max',
        name: 'Notificacoes NailFlow',
      })
    );
    expect(notificationsMock.getExpoPushTokenAsync).toHaveBeenCalledWith({
      projectId: 'project-123',
    });
    expect(firestoreMock.doc).toHaveBeenCalledWith(firebaseMock.db, 'users', 'user-123');
    expect(firestoreMock.arrayUnion).toHaveBeenCalledWith('ExponentPushToken[token-123]');
    expect(firestoreMock.setDoc).toHaveBeenCalledWith(
      { id: 'user-ref' },
      {
        fcmTokens: {
          values: ['ExponentPushToken[token-123]'],
        },
      },
      { merge: true }
    );
  });

  it('retorna missing_project_id quando o projeto EAS nao esta configurado', async () => {
    runtime.projectId = null;

    await expect(bootstrapPushTokenRegistrationAsync('user-123')).resolves.toEqual({
      status: 'missing_project_id',
    });

    expect(notificationsMock.getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(firestoreMock.setDoc).not.toHaveBeenCalled();
  });

  it('retorna permission_denied quando usuario nega notificacoes', async () => {
    notificationsMock.getPermissionsAsync.mockResolvedValue({ granted: false });
    notificationsMock.requestPermissionsAsync.mockResolvedValue({ granted: false });

    await expect(bootstrapPushTokenRegistrationAsync('user-123')).resolves.toEqual({
      status: 'permission_denied',
    });

    expect(notificationsMock.getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(firestoreMock.setDoc).not.toHaveBeenCalled();
  });
});
