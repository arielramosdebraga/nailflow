import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { AdminHeader } from '@/components/features/admin';
import { AuditLogFilters, AuditLogList, type AuditLogFilterValues } from '@/components/features/audit';
import { useAdminSessionGuard } from '@/hooks/admin';
import { useAuditLogs } from '@/hooks/audit';
import { type ListAuditLogsParams } from '@/services/audit';

const DEFAULT_LIMIT = 25;

const INITIAL_FILTER_VALUES: AuditLogFilterValues = {
  userId: '',
  targetId: '',
  action: '',
  targetType: '',
  dateFrom: '',
  dateTo: '',
  limit: String(DEFAULT_LIMIT),
};

function normalizeLimit(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }

  return Math.min(parsed, 100);
}

function buildAppliedFilters(values: AuditLogFilterValues): ListAuditLogsParams {
  return {
    userId: values.userId.trim() || undefined,
    targetId: values.targetId.trim() || undefined,
    action: values.action.trim() || undefined,
    targetType: values.targetType.trim() || undefined,
    dateFrom: values.dateFrom.trim() || undefined,
    dateTo: values.dateTo.trim() || undefined,
    limit: normalizeLimit(values.limit),
    order: 'desc',
  };
}

export default function AuditLogsScreen() {
  useAdminSessionGuard();
  const [filterValues, setFilterValues] = useState<AuditLogFilterValues>(INITIAL_FILTER_VALUES);
  const [appliedFilters, setAppliedFilters] = useState<ListAuditLogsParams>({
    limit: DEFAULT_LIMIT,
    order: 'desc',
  });

  const auditLogsQuery = useAuditLogs(appliedFilters);
  const totalResults = useMemo(() => auditLogsQuery.data?.length ?? 0, [auditLogsQuery.data]);

  return (
    <View className="flex-1 bg-zinc-50 p-6 dark:bg-zinc-950">
      <AdminHeader
        title="Auditoria administrativa"
        subtitle="Consulta de logs com filtros basicos para rastrear operacoes sensiveis."
        activeRoute="audit-logs"
      />

      <View className="gap-3 pb-3 pt-6">
        <AuditLogFilters
          values={filterValues}
          isApplying={auditLogsQuery.isFetching}
          onChange={(field, value) => {
            setFilterValues((current) => ({
              ...current,
              [field]: value,
            }));
          }}
          onApply={() => {
            setAppliedFilters(buildAppliedFilters(filterValues));
          }}
          onReset={() => {
            setFilterValues(INITIAL_FILTER_VALUES);
            setAppliedFilters({
              limit: DEFAULT_LIMIT,
              order: 'desc',
            });
          }}
        />
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Resultados</Text>
          <Text className="text-xs text-zinc-500 dark:text-zinc-400">
            {auditLogsQuery.isFetching ? 'Atualizando...' : `${totalResults} registro(s)`}
          </Text>
        </View>
      </View>

      <View className="flex-1">
        <AuditLogList
          logs={auditLogsQuery.data ?? []}
          isLoading={auditLogsQuery.isLoading}
          error={auditLogsQuery.error}
        />
      </View>
    </View>
  );
}
