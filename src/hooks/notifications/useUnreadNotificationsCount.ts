import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { getUnreadNotificationsCount } from '@/services/notifications';
import { useSessionStore } from '@/stores/sessionStore';

interface UseUnreadNotificationsCountResult {
  unreadCount: number;
  isLoading: boolean;
  errorMessage: string | null;
}

export function useUnreadNotificationsCount(): UseUnreadNotificationsCountResult {
  const userId = useSessionStore((state) => state.userId);
  const status = useSessionStore((state) => state.status);

  const isEnabled = status === 'authenticated' && Boolean(userId);

  const unreadCountQuery = useQuery({
    queryKey: ['notifications-unread-count', userId ?? ''],
    enabled: isEnabled,
    refetchInterval: 4_000,
    queryFn: async () => {
      if (!userId) {
        return 0;
      }

      return getUnreadNotificationsCount(userId);
    },
  });

  return useMemo(
    () => ({
      unreadCount: isEnabled ? unreadCountQuery.data ?? 0 : 0,
      isLoading: isEnabled && unreadCountQuery.isLoading,
      errorMessage: unreadCountQuery.error instanceof Error ? unreadCountQuery.error.message : null,
    }),
    [isEnabled, unreadCountQuery.data, unreadCountQuery.error, unreadCountQuery.isLoading]
  );
}
