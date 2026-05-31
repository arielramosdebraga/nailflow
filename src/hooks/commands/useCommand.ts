import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { getCommandById } from '@/services/commands/commandsService';
import { useSessionStore } from '@/stores/sessionStore';

export function useCommand(commandId: string | undefined) {
  const status = useSessionStore((state) => state.status);
  const salonId = useSessionStore((state) => state.salonId);
  const role = useSessionStore((state) => state.role);
  const userId = useSessionStore((state) => state.userId);

  const shouldEnable = useMemo(() => {
    if (status !== 'authenticated') {
      return false;
    }

    if (!commandId) {
      return false;
    }

    return true;
  }, [commandId, status]);

  return useQuery({
    queryKey: ['command', commandId],
    enabled: shouldEnable,
    queryFn: async () => {
      const command = await getCommandById(commandId ?? '');
      if (!command) {
        return null;
      }

      if (role === 'nail_technician' && userId && command.manicureId !== userId) {
        throw new Error('Comanda fora do escopo da profissional atual.');
      }

      if (role !== 'super_admin' && salonId && command.salonId !== salonId) {
        throw new Error('Comanda fora do escopo do salao atual.');
      }

      return command;
    },
  });
}
