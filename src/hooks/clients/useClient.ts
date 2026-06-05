import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { getClientById } from '@/services/clients/clientsService';
import { useSessionStore } from '@/stores/sessionStore';

export function useClient(clientId: string | undefined) {
  const status = useSessionStore((state) => state.status);
  const salonId = useSessionStore((state) => state.salonId);
  const role = useSessionStore((state) => state.role);

  const shouldEnable = useMemo(() => {
    if (status !== 'authenticated') {
      return false;
    }

    if (!clientId) {
      return false;
    }

    return true;
  }, [clientId, status]);

  return useQuery({
    queryKey: ['client', clientId],
    enabled: shouldEnable,
    queryFn: async () => {
      const client = await getClientById(clientId ?? '');
      if (!client) {
        return null;
      }

      if (role !== 'super_admin' && salonId && client.salonId !== salonId) {
        throw new Error('Cliente fora do escopo do salao atual.');
      }

      return client;
    },
  });
}
