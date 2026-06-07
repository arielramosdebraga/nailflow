import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { AdminHeader } from '@/components/features/admin';
import { AuditLogFilters, AuditLogList, type AuditLogFilterValues } from '@/components/features/audit';
import { Card } from '@/components/ui/Card';
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
    <View className="flex-1 bg-zinc-950 px-6 pb-8">
      <AdminHeader
        title="Auditoria"
        subtitle="Cruze filtros, monitore acessos sensíveis e acompanhe a trilha operacional do ambiente."
        activeRoute="audit-logs"
      />

      <View className="gap-4 pt-6">
        <View className="flex-row gap-3">
          <Card className="flex-1 rounded-[24px] border-white/10 bg-primary/15">
            <Text className="text-xs uppercase tracking-[0.22em] text-zinc-100/80">Resultados</Text>
            <Text className="pt-2 text-2xl font-black text-zinc-50">
              {auditLogsQuery.isFetching ? '...' : totalResults}
            </Text>
          </Card>
          <Card className="flex-1 rounded-[24px] border-white/10 bg-white/5">
            <Text className="text-xs uppercase tracking-[0.22em] text-zinc-400">Limite</Text>
            <Text className="pt-2 text-2xl font-black text-zinc-50">{normalizeLimit(filterValues.limit)}</Text>
          </Card>
        </View>

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
          <Text className="text-sm font-semibold text-zinc-200">Resultados</Text>
          <Text className="text-xs text-zinc-500">
            {auditLogsQuery.isFetching ? 'Atualizando...' : `${totalResults} registro(s)`}
          </Text>
        </View>

        <AuditLogList
          logs={auditLogsQuery.data ?? []}
          isLoading={auditLogsQuery.isLoading}
          error={auditLogsQuery.error}
        />
      </View>
    </View>
  );
}
