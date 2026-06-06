import { useState } from 'react';
import { Platform } from 'react-native';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import {
  beginGoogleCalendarConnection,
  confirmGoogleCalendarConnection,
  getGoogleCalendarConnectionStatus,
  type ConfirmGoogleCalendarConnectionResult,
  type GoogleCalendarConnectionStatus,
  type GoogleSyncIndicator,
} from '@/services/google';
import { useSessionStore } from '@/stores/sessionStore';

WebBrowser.maybeCompleteAuthSession();

type ConnectOutcome =
  | { outcome: 'connected'; data: ConfirmGoogleCalendarConnectionResult }
  | { outcome: 'cancelled' };

function resolvePlatform(): 'android' | 'ios' | 'web' {
  if (Platform.OS === 'android') {
    return 'android';
  }

  if (Platform.OS === 'ios') {
    return 'ios';
  }

  return 'web';
}

function resolveSyncIndicator(status: GoogleCalendarConnectionStatus | undefined): GoogleSyncIndicator {
  if (!status) {
    return 'pending';
  }

  return status.indicator;
}

export function useGoogleCalendarConnection() {
  const queryClient = useQueryClient();
  const userId = useSessionStore((state) => state.userId);
  const sessionStatus = useSessionStore((state) => state.status);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const statusQuery = useQuery({
    queryKey: ['google-calendar-connection-status', userId ?? ''],
    enabled: sessionStatus === 'authenticated' && Boolean(userId),
    queryFn: async () => {
      if (!userId) {
        throw new Error('Usuária não identificada para consultar a sincronização do Google.');
      }

      return getGoogleCalendarConnectionStatus(userId);
    },
    refetchInterval: 45_000,
  });

  const connectMutation = useMutation({
    mutationFn: async (): Promise<ConnectOutcome> => {
      if (!userId) {
        throw new Error('Usuária não identificada para conectar o Google Agenda.');
      }

      const fallbackRedirectUri = AuthSession.makeRedirectUri({
        scheme: 'nailflow',
        path: 'google-calendar/oauth',
      });

      const begin = await beginGoogleCalendarConnection({
        redirectUri: fallbackRedirectUri,
        platform: resolvePlatform(),
      });

      const redirectUri = begin.redirectUri ?? fallbackRedirectUri;
      const request = await AuthSession.loadAsync(
        {
          clientId: begin.clientId,
          redirectUri,
          responseType: AuthSession.ResponseType.Code,
          usePKCE: false,
          scopes: begin.scopes,
          state: begin.state ?? undefined,
          extraParams: begin.extraParams,
        },
        begin.discovery
      );

      const authResult = await request.promptAsync(begin.discovery);
      if (authResult.type === 'cancel' || authResult.type === 'dismiss' || authResult.type === 'locked') {
        return { outcome: 'cancelled' };
      }

      if (authResult.type !== 'success') {
        const params = 'params' in authResult ? authResult.params : undefined;
        const errorDescription =
          params && typeof params.error_description === 'string' ? params.error_description : null;
        const errorCode = params && typeof params.error === 'string' ? params.error : null;

        throw new Error(
          errorDescription ??
            (errorCode ? `Google retornou um erro de autorização (${errorCode}).` : 'Falha na autorização do Google.')
        );
      }

      const code = authResult.params.code;
      if (!code) {
        throw new Error('O Google não retornou um código de autorização para concluir a conexão.');
      }

      const confirm = await confirmGoogleCalendarConnection({
        code,
        redirectUri,
        state: authResult.params.state,
      });

      return { outcome: 'connected', data: confirm };
    },
    onSuccess: async (result) => {
      if (result.outcome === 'cancelled') {
        setLocalMessage('Conexão com Google Agenda cancelada.');
        setLocalError(null);
        return;
      }

      setLocalError(null);
      setLocalMessage(result.data.message ?? 'Google Agenda conectada com sucesso.');
      await queryClient.invalidateQueries({ queryKey: ['google-calendar-connection-status'] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Falha ao conectar o Google Agenda.';
      setLocalError(message);
      setLocalMessage(null);
    },
  });

  return {
    status: statusQuery.data,
    syncIndicator: resolveSyncIndicator(statusQuery.data),
    isLoadingStatus: statusQuery.isLoading,
    isRefreshingStatus: statusQuery.isFetching && !statusQuery.isLoading,
    isConnecting: connectMutation.isPending,
    errorMessage:
      localError ??
      (statusQuery.error instanceof Error
        ? statusQuery.error.message
        : statusQuery.error
          ? 'Falha ao consultar o status da integração.'
          : null),
    feedbackMessage: localMessage,
    lastSyncedAt: statusQuery.data?.lastSyncedAt ?? null,
    lastErrorMessage: statusQuery.data?.lastErrorMessage ?? null,
    connectGoogleCalendar: async () => {
      setLocalError(null);
      setLocalMessage(null);
      await connectMutation.mutateAsync();
    },
    refreshStatus: async () => {
      await statusQuery.refetch();
    },
  };
}
