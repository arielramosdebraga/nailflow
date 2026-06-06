import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { getSalonById } from '@/services/salons/salonService';
import { useSessionStore } from '@/stores/sessionStore';

export function useCurrentSalon() {
  const status = useSessionStore((state) => state.status);
  const salonId = useSessionStore((state) => state.salonId);

  const isEnabled = useMemo(() => status === 'authenticated' && Boolean(salonId), [salonId, status]);

  return useQuery({
    queryKey: ['current-salon', salonId],
    enabled: isEnabled,
    queryFn: async () => {
      if (!salonId) {
        return null;
      }

      return getSalonById(salonId);
    },
  });
}
