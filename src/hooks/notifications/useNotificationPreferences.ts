import { useMemo } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getDefaultNotificationPreferences,
  getNotificationPreferences,
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
  const queryClient = useQueryClient();

  const isEnabled = status === 'authenticated' && Boolean(userId);

  const preferencesQuery = useQuery({
    queryKey: ['notification-preferences', userId ?? ''],
    enabled: isEnabled,
    refetchInterval: 15_000,
    queryFn: async () => {
      if (!userId) {
        return getDefaultNotificationPreferences();
      }

      return getNotificationPreferences(userId);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (next: NotificationPreferences) => {
      if (!userId) {
        return;
      }
      await updateNotificationPreferences(userId, next);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notification-preferences', userId ?? ''] });
    },
  });

  return useMemo(
    () => ({
      preferences: isEnabled
        ? preferencesQuery.data ?? getDefaultNotificationPreferences()
        : getDefaultNotificationPreferences(),
      isLoading: isEnabled && preferencesQuery.isLoading,
      isSaving: updateMutation.isPending,
      errorMessage:
        preferencesQuery.error instanceof Error
          ? preferencesQuery.error.message
          : updateMutation.error instanceof Error
            ? updateMutation.error.message
            : null,
      updatePreferences: async (next: NotificationPreferences) => {
        await updateMutation.mutateAsync(next);
      },
    }),
    [
      isEnabled,
      preferencesQuery.data,
      preferencesQuery.error,
      preferencesQuery.isLoading,
      updateMutation,
    ]
  );
}
