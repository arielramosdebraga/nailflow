import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeUserNotifications,
  type AppNotification,
} from '@/services/notifications';
import { useSessionStore } from '@/stores/sessionStore';

interface UseNotificationsFeedOptions {
  limitCount?: number;
}

interface UseNotificationsFeedResult {
  notifications: AppNotification[];
  isLoading: boolean;
  errorMessage: string | null;
  markOneAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export function useNotificationsFeed(
  options: UseNotificationsFeedOptions = {}
): UseNotificationsFeedResult {
  const userId = useSessionStore((state) => state.userId);
  const status = useSessionStore((state) => state.status);
  const [notificationsSnapshot, setNotificationsSnapshot] = useState<{
    sourceKey: string | null;
    data: AppNotification[];
  }>({
    sourceKey: null,
    data: [],
  });
  const [loadedSourceKey, setLoadedSourceKey] = useState<string | null>(null);
  const [isMarkingOneAsRead, setIsMarkingOneAsRead] = useState(false);
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
  const [errorSnapshot, setErrorSnapshot] = useState<{
    sourceKey: string | null;
    message: string | null;
  }>({
    sourceKey: null,
    message: null,
  });

  const isEnabled = status === 'authenticated' && Boolean(userId);
  const limitCount = options.limitCount ?? 100;
  const sourceKey = isEnabled && userId ? `${userId}:${limitCount}` : null;

  useEffect(() => {
    if (!sourceKey || !userId) {
      return undefined;
    }

    const unsubscribe = subscribeUserNotifications(
      { userId, limitCount },
      (items) => {
        setNotificationsSnapshot({ sourceKey, data: items });
        setLoadedSourceKey(sourceKey);
        setErrorSnapshot({ sourceKey, message: null });
      },
      (error) => {
        setLoadedSourceKey(sourceKey);
        setErrorSnapshot({ sourceKey, message: error.message });
      }
    );

    return unsubscribe;
  }, [limitCount, sourceKey, userId]);

  const markOneAsRead = useCallback(
    async (notificationId: string) => {
      if (!userId) {
        return;
      }

      setIsMarkingOneAsRead(true);

      try {
        await markNotificationAsRead({ userId, notificationId });
      } catch (error) {
        setErrorSnapshot({
          sourceKey,
          message:
            error instanceof Error
              ? error.message
              : 'Falha ao marcar notificacao como lida.',
        });
      } finally {
        setIsMarkingOneAsRead(false);
      }
    },
    [sourceKey, userId]
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) {
      return;
    }

    setIsMarkingAllAsRead(true);

    try {
      await markAllNotificationsAsRead(userId);
    } catch (error) {
      setErrorSnapshot({
        sourceKey,
        message:
          error instanceof Error
            ? error.message
            : 'Falha ao marcar notificacoes como lidas.',
      });
    } finally {
      setIsMarkingAllAsRead(false);
    }
  }, [sourceKey, userId]);

  return useMemo(
    () => {
      const notifications =
        sourceKey && notificationsSnapshot.sourceKey === sourceKey
          ? notificationsSnapshot.data
          : [];
      const isLoading =
        Boolean(sourceKey) && loadedSourceKey !== sourceKey;
      const errorMessage =
        sourceKey && errorSnapshot.sourceKey === sourceKey
          ? errorSnapshot.message
          : null;

      return {
        notifications,
        isLoading: isLoading || isMarkingOneAsRead || isMarkingAllAsRead,
        errorMessage,
        markOneAsRead,
        markAllAsRead,
      };
    },
    [
      errorSnapshot,
      isMarkingAllAsRead,
      isMarkingOneAsRead,
      loadedSourceKey,
      markAllAsRead,
      markOneAsRead,
      notificationsSnapshot,
      sourceKey,
    ]
  );
}
