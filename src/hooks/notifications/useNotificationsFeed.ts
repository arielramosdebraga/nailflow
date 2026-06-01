import { useMemo } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  listUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
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
  const queryClient = useQueryClient();

  const isEnabled = status === 'authenticated' && Boolean(userId);
  const limitCount = options.limitCount ?? 100;

  const notificationsQuery = useQuery({
    queryKey: ['notifications', userId ?? '', limitCount],
    enabled: isEnabled,
    refetchInterval: 5_000,
    queryFn: async () => {
      if (!userId) {
        return [];
      }
      return listUserNotifications({ userId, limitCount });
    },
  });

  const markOneMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!userId) {
        return;
      }
      await markNotificationAsRead({ userId, notificationId });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notifications', userId ?? '', limitCount] }),
        queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', userId ?? ''] }),
      ]);
    },
  });

  const markAllMutation = useMutation({
    mutationFn: async () => {
      if (!userId) {
        return 0;
      }
      return markAllNotificationsAsRead(userId);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notifications', userId ?? '', limitCount] }),
        queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', userId ?? ''] }),
      ]);
    },
  });

  return useMemo(
    () => ({
      notifications: isEnabled ? notificationsQuery.data ?? [] : [],
      isLoading:
        isEnabled &&
        (notificationsQuery.isLoading || markOneMutation.isPending || markAllMutation.isPending),
      errorMessage:
        notificationsQuery.error instanceof Error
          ? notificationsQuery.error.message
          : markOneMutation.error instanceof Error
            ? markOneMutation.error.message
            : markAllMutation.error instanceof Error
              ? markAllMutation.error.message
              : null,
      markOneAsRead: async (notificationId: string) => {
        await markOneMutation.mutateAsync(notificationId);
      },
      markAllAsRead: async () => {
        await markAllMutation.mutateAsync();
      },
    }),
    [
      isEnabled,
      markAllMutation,
      markOneMutation,
      notificationsQuery.data,
      notificationsQuery.error,
      notificationsQuery.isLoading,
    ]
  );
}
