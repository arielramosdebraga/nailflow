import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { listClients } from '@/services/clients/clientsService';
import { useSessionStore } from '@/stores/sessionStore';

interface UseClientsOptions {
  searchTerm?: string;
  limitCount?: number;
  enabled?: boolean;
}

export function useClients(options?: UseClientsOptions) {
  const status = useSessionStore((state) => state.status);
  const salonId = useSessionStore((state) => state.salonId);
  const role = useSessionStore((state) => state.role);

  const shouldEnable = useMemo(() => {
    if (options?.enabled === false) {
      return false;
    }

    if (status !== 'authenticated') {
      return false;
    }

    if (role === 'super_admin') {
      return Boolean(salonId);
    }

    return Boolean(salonId);
  }, [options?.enabled, role, salonId, status]);

  return useQuery({
    queryKey: ['clients', salonId, options?.searchTerm ?? '', options?.limitCount ?? 100],
    enabled: shouldEnable,
    queryFn: async () => {
      if (!salonId) {
        return [];
      }

      return listClients({
        salonId,
        searchTerm: options?.searchTerm,
        limitCount: options?.limitCount,
      });
    },
  });
}
