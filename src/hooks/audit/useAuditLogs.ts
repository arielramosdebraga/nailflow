import { useQuery } from '@tanstack/react-query';

import { listAuditLogs } from '@/services/audit/auditLogService';
import { useSessionStore } from '@/stores/sessionStore';

interface UseAuditLogsOptions {
  userId?: string;
  targetId?: string;
  limitCount?: number;
}

export function useAuditLogs(options: UseAuditLogsOptions = {}) {
  const status = useSessionStore((state) => state.status);
  const role = useSessionStore((state) => state.role);

  const isEnabled = status === 'authenticated' && role === 'super_admin';

  return useQuery({
    queryKey: ['audit-logs', options.userId ?? '', options.targetId ?? '', options.limitCount ?? 100],
    enabled: isEnabled,
    queryFn: async () =>
      listAuditLogs({
        userId: options.userId,
        targetId: options.targetId,
        limitCount: options.limitCount,
      }),
  });
}
