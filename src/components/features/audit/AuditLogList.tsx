import { FlatList, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { type AuditLog } from '@/schemas/audit/audit-log.schema';

interface AuditLogListProps {
  logs: AuditLog[];
  isLoading: boolean;
  error: unknown;
}

function formatDateTime(value: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return 'Data invalida';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(parsed));
}

function formatMetadata(log: AuditLog): string {
  const entries = Object.entries(log.metadata);
  if (entries.length === 0) {
    return 'Sem metadados';
  }

  return entries
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' | ');
}

export function AuditLogList({ logs, isLoading, error }: AuditLogListProps) {
  if (isLoading) {
    return (
      <Card>
        <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando logs de auditoria...</Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Text className="text-sm text-error">
          {error instanceof Error ? error.message : 'Falha ao carregar logs de auditoria.'}
        </Text>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <Text className="text-sm text-zinc-600 dark:text-zinc-300">
          Nenhum log encontrado para os filtros informados.
        </Text>
      </Card>
    );
  }

  return (
    <FlatList
      data={logs}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
      renderItem={({ item }) => (
        <Card className="gap-2">
          <View className="flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {item.action}
            </Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">{formatDateTime(item.timestamp)}</Text>
          </View>

          <Text className="text-xs text-zinc-600 dark:text-zinc-300">
            Usuario: {item.userId} ({item.userRole})
          </Text>
          <Text className="text-xs text-zinc-600 dark:text-zinc-300">
            Alvo: {item.targetType} / {item.targetId}
          </Text>
          <Text className="text-xs text-zinc-500 dark:text-zinc-400">{formatMetadata(item)}</Text>
          {item.requestId ? (
            <Text className="text-[11px] text-zinc-400 dark:text-zinc-500">requestId: {item.requestId}</Text>
          ) : null}
        </Card>
      )}
    />
  );
}
