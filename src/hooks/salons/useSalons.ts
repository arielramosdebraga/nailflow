import { useQuery } from '@tanstack/react-query';

import { listSalons } from '@/services/salons/salonService';
import { useSessionStore } from '@/stores/sessionStore';

interface UseSalonsOptions {
  limitCount?: number;
}

export function useSalons(options: UseSalonsOptions = {}) {
  const status = useSessionStore((state) => state.status);
  const role = useSessionStore((state) => state.role);
  const isEnabled = status === 'authenticated' && role === 'super_admin';

  return useQuery({
    queryKey: ['admin-salons', options.limitCount ?? 200],
    enabled: isEnabled,
    queryFn: async () =>
      listSalons({
        limitCount: options.limitCount,
      }),
  });
}
