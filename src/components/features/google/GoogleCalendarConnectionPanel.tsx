import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { type GoogleSyncIndicator } from '@/services/google';
import { GoogleCalendarSyncStatusTag } from './GoogleCalendarSyncStatusTag';

interface GoogleCalendarConnectionPanelProps {
  syncIndicator: GoogleSyncIndicator;
  connected: boolean;
  isLoadingStatus: boolean;
  isConnecting: boolean;
  errorMessage: string | null;
  feedbackMessage: string | null;
  lastSyncedAt: string | null;
  lastErrorMessage: string | null;
  onConnect: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

function formatDateTime(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleString('pt-BR');
}

function getStatusDescription(status: GoogleSyncIndicator): string {
  if (status === 'connected') {
    return 'Seu calendário está conectado e pronto para sincronizar atendimentos.';
  }

  if (status === 'error') {
    return 'Encontramos um erro na sincronização. Revise a conexão para continuar.';
  }

  return 'A sincronização ainda não foi concluída. Conecte a conta Google para continuar.';
}

export function GoogleCalendarConnectionPanel({
  syncIndicator,
  connected,
  isLoadingStatus,
  isConnecting,
  errorMessage,
  feedbackMessage,
  lastSyncedAt,
  lastErrorMessage,
  onConnect,
  onRefresh,
}: GoogleCalendarConnectionPanelProps) {
  const formattedLastSync = formatDateTime(lastSyncedAt);

  return (
    <Card className="gap-4 border-white/10 bg-white/5">
      <View className="gap-2">
        <GoogleCalendarSyncStatusTag status={syncIndicator} />
        <Text className="text-xl font-semibold text-zinc-50">Conectar Google Agenda</Text>
        <Text className="text-sm leading-6 text-zinc-300">{getStatusDescription(syncIndicator)}</Text>
      </View>

      <View className="gap-2 rounded-[20px] border border-white/10 bg-zinc-900/70 p-4">
        <Text className="text-sm text-zinc-200">
          Conta conectada: {connected ? 'sim' : 'não'}
        </Text>
        {formattedLastSync ? (
          <Text className="text-sm text-zinc-200">Última sincronização: {formattedLastSync}</Text>
        ) : null}
        {lastErrorMessage ? <Text className="text-sm text-error">Último erro: {lastErrorMessage}</Text> : null}
      </View>

      {isLoadingStatus ? (
        <Text className="text-sm text-zinc-300">Carregando status da sincronização...</Text>
      ) : null}

      {errorMessage ? <Text className="text-sm text-error">{errorMessage}</Text> : null}
      {feedbackMessage ? <Text className="text-sm text-zinc-200">{feedbackMessage}</Text> : null}

      <View className="gap-2">
        <Button
          label={isConnecting ? 'Conectando Google...' : connected ? 'Reconectar Google Agenda' : 'Conectar Google Agenda'}
          onPress={() => {
            void onConnect();
          }}
          disabled={isConnecting}
        />
        <Button
          label="Atualizar status"
          variant="ghost"
          className="border-white/10 bg-white/5"
          onPress={() => {
            void onRefresh();
          }}
          disabled={isConnecting}
        />
      </View>
    </Card>
  );
}
