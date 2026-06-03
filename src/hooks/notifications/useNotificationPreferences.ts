import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getDefaultNotificationPreferences,
  subscribeNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from '@/services/notifications';
import { useSessionStore } from '@/stores/sessionStore';

interface UseNotificationPreferencesResult {
  preferences: NotificationPreferences;
  isLoading: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  updatePreferences: (next: NotificationPreferences) => Promise<void>;
}

export function useNotificationPreferences(): UseNotificationPreferencesResult {
  const userId = useSessionStore((state) => state.userId);
  const status = useSessionStore((state) => state.status);
  const [preferencesSnapshot, setPreferencesSnapshot] = useState<{
    sourceKey: string | null;
    data: NotificationPreferences;
  }>({
    sourceKey: null,
    data: getDefaultNotificationPreferences(),
  });
  const [loadedSourceKey, setLoadedSourceKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorSnapshot, setErrorSnapshot] = useState<{
    sourceKey: string | null;
    message: string | null;
  }>({
    sourceKey: null,
    message: null,
  });

  const isEnabled = status === 'authenticated' && Boolean(userId);
  const sourceKey = isEnabled && userId ? userId : null;

  useEffect(() => {
    if (!sourceKey || !userId) {
      return undefined;
    }

    const unsubscribe = subscribeNotificationPreferences(
      userId,
      (nextPreferences) => {
        setPreferencesSnapshot({ sourceKey, data: nextPreferences });
        setLoadedSourceKey(sourceKey);
        setErrorSnapshot({ sourceKey, message: null });
      },
      (error) => {
        setLoadedSourceKey(sourceKey);
        setErrorSnapshot({ sourceKey, message: error.message });
      }
    );

    return unsubscribe;
  }, [sourceKey, userId]);

  const preferences =
    sourceKey && preferencesSnapshot.sourceKey === sourceKey
      ? preferencesSnapshot.data
      : getDefaultNotificationPreferences();
  const isLoading = Boolean(sourceKey) && loadedSourceKey !== sourceKey;
  const errorMessage =
    sourceKey && errorSnapshot.sourceKey === sourceKey
      ? errorSnapshot.message
      : null;

  const updatePreferences = useCallback(
    async (next: NotificationPreferences) => {
      if (!userId) {
        return;
      }

      const previous = preferences;
      setPreferencesSnapshot({ sourceKey, data: next });
      setIsSaving(true);

      try {
        await updateNotificationPreferences(userId, next);
      } catch (error) {
        setPreferencesSnapshot({ sourceKey, data: previous });
        setErrorSnapshot({
          sourceKey,
          message:
            error instanceof Error
              ? error.message
              : 'Falha ao salvar preferencias de notificacao.',
        });
      } finally {
        setIsSaving(false);
      }
    },
    [preferences, sourceKey, userId]
  );

  return useMemo(
    () => ({
      preferences,
      isLoading,
      isSaving,
      errorMessage,
      updatePreferences,
    }),
    [
      errorMessage,
      isLoading,
      isSaving,
      preferences,
      updatePreferences,
    ]
  );
}
