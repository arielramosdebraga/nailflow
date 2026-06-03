import { useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuditLogs } from '@/hooks/audit/useAuditLogs';

function formatMetadata(metadata: Record<string, string | number | boolean | null>) {
  const entries = Object.entries(metadata).slice(0, 4);

  if (entries.length === 0) {
    return 'Sem metadados adicionais.';
  }

  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(' | ');
}

function formatTimestamp(value: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return 'Nao informado';
  }

  return new Date(parsed).toLocaleString('pt-BR');
}

export default function AdminAuditLogsScreen() {
  const router = useRouter();
  const logsQuery = useAuditLogs({ limit: 120, order: 'desc' });
  const logs = useMemo(() => logsQuery.data ?? [], [logsQuery.data]);

  return (
    <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
      <View className="gap-2 pb-4">
        <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Logs de auditoria</Text>
        <Text className="text-base text-zinc-600 dark:text-zinc-300">
          Historico das acoes sensiveis registradas pelas Cloud Functions do NailFlow.
        </Text>
      </View>

      {logsQuery.isLoading ? (
        <Card>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando logs...</Text>
        </Card>
      ) : null}

      {logsQuery.error ? (
        <Card>
          <Text className="text-sm text-error">
            {logsQuery.error instanceof Error ? logsQuery.error.message : 'Falha ao carregar logs.'}
          </Text>
        </Card>
      ) : null}

      {!logsQuery.isLoading && !logsQuery.error && logs.length === 0 ? (
        <Card>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Nenhum log encontrado.</Text>
        </Card>
      ) : null}

      {!logsQuery.isLoading && !logsQuery.error && logs.length > 0 ? (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <Card className="gap-2">
              <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.action}</Text>
              <Text className="text-xs text-zinc-600 dark:text-zinc-300">
                Usuario: {item.userId} • Papel: {item.userRole}
              </Text>
              <Text className="text-xs text-zinc-600 dark:text-zinc-300">
                Alvo: {item.targetType} • {item.targetId}
              </Text>
              <Text className="text-xs text-zinc-600 dark:text-zinc-300">
                Momento: {formatTimestamp(item.timestamp)}
              </Text>
              {item.ipAddress ? (
                <Text className="text-xs text-zinc-600 dark:text-zinc-300">IP: {item.ipAddress}</Text>
              ) : null}
              {item.requestId ? (
                <Text className="text-xs text-zinc-600 dark:text-zinc-300">Request ID: {item.requestId}</Text>
              ) : null}
              <Text className="text-xs text-zinc-500 dark:text-zinc-400">{formatMetadata(item.metadata)}</Text>
            </Card>
          )}
        />
      ) : null}

      <View className="pt-2">
        <Button label="Voltar ao painel" variant="ghost" onPress={() => router.replace('../dashboard')} />
      </View>
    </View>
  );
}