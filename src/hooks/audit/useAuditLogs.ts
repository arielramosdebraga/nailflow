import { useQuery } from '@tanstack/react-query';

import { listAuditLogs, type ListAuditLogsParams } from '@/services/audit';
import { useSessionStore } from '@/stores/sessionStore';

interface UseAuditLogsOptions extends ListAuditLogsParams {
  enabled?: boolean;
}

export function useAuditLogs(options?: UseAuditLogsOptions) {
  const status = useSessionStore((state) => state.status);
  const role = useSessionStore((state) => state.role);

  const enabled =
    options?.enabled !== false && status === 'authenticated' && role === 'super_admin';

  return useQuery({
    queryKey: [
      'audit-logs',
      {
        userId: options?.userId ?? '',
        targetId: options?.targetId ?? '',
        action: options?.action ?? '',
        targetType: options?.targetType ?? '',
        dateFrom: options?.dateFrom ?? '',
        dateTo: options?.dateTo ?? '',
        limit: options?.limit ?? 25,
        order: options?.order ?? 'desc',
      },
    ],
    enabled,
    queryFn: () =>
      listAuditLogs({
        userId: options?.userId,
        targetId: options?.targetId,
        action: options?.action,
        targetType: options?.targetType,
        dateFrom: options?.dateFrom,
        dateTo: options?.dateTo,
        limit: options?.limit,
        order: options?.order,
      }),
  });
}
