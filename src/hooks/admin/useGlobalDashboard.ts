import { useQuery } from '@tanstack/react-query';

import { getGlobalDashboard } from '@/services/admin';
import { useSessionStore } from '@/stores/sessionStore';

interface UseGlobalDashboardOptions {
  includeInactiveSalons?: boolean;
  enabled?: boolean;
}

export function useGlobalDashboard(options?: UseGlobalDashboardOptions) {
  const status = useSessionStore((state) => state.status);
  const role = useSessionStore((state) => state.role);

  const enabled =
    options?.enabled !== false && status === 'authenticated' && role === 'super_admin';

  return useQuery({
    queryKey: ['admin-global-dashboard', options?.includeInactiveSalons ?? true],
    enabled,
    queryFn: () =>
      getGlobalDashboard({
        includeInactiveSalons: options?.includeInactiveSalons ?? true,
      }),
  });
}
