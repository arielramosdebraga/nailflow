import { useEffect, useMemo, useState } from 'react';

import { subscribeUnreadNotificationsCount } from '@/services/notifications';
import { useSessionStore } from '@/stores/sessionStore';

interface UseUnreadNotificationsCountResult {
  unreadCount: number;
  isLoading: boolean;
  errorMessage: string | null;
}

export function useUnreadNotificationsCount(): UseUnreadNotificationsCountResult {
  const userId = useSessionStore((state) => state.userId);
  const status = useSessionStore((state) => state.status);
  const [unreadSnapshot, setUnreadSnapshot] = useState<{
    sourceKey: string | null;
    value: number;
  }>({
    sourceKey: null,
    value: 0,
  });
  const [loadedSourceKey, setLoadedSourceKey] = useState<string | null>(null);
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

    const unsubscribe = subscribeUnreadNotificationsCount(
      userId,
      (count) => {
        setUnreadSnapshot({ sourceKey, value: count });
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

  const unreadCount =
    sourceKey && unreadSnapshot.sourceKey === sourceKey
      ? unreadSnapshot.value
      : 0;
  const isLoading = Boolean(sourceKey) && loadedSourceKey !== sourceKey;
  const errorMessage =
    sourceKey && errorSnapshot.sourceKey === sourceKey
      ? errorSnapshot.message
      : null;

  return useMemo(
    () => ({
      unreadCount,
      isLoading,
      errorMessage,
    }),
    [errorMessage, isLoading, unreadCount]
  );
}
