import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { type CommandStatus } from '@/schemas/commands/command.schema';
import { listCommands } from '@/services/commands/commandsService';
import { useSessionStore } from '@/stores/sessionStore';

interface UseCommandsOptions {
  status?: CommandStatus;
  limitCount?: number;
  clientId?: string;
  appointmentId?: string;
  manicureId?: string;
  enabled?: boolean;
}

export function useCommands(options?: UseCommandsOptions) {
  const status = useSessionStore((state) => state.status);
  const salonId = useSessionStore((state) => state.salonId);
  const role = useSessionStore((state) => state.role);
  const userId = useSessionStore((state) => state.userId);

  const scopedManicureId = useMemo(() => {
    if (role === 'nail_technician') {
      return userId ?? undefined;
    }

    return options?.manicureId;
  }, [options?.manicureId, role, userId]);

  const shouldEnable = useMemo(() => {
    if (options?.enabled === false) {
      return false;
    }

    if (status !== 'authenticated') {
      return false;
    }

    if (!salonId) {
      return false;
    }

    if (role === 'nail_technician' && !userId) {
      return false;
    }

    return true;
  }, [options?.enabled, role, salonId, status, userId]);

  return useQuery({
    queryKey: [
      'commands',
      salonId,
      options?.status ?? 'all',
      options?.clientId ?? '',
      options?.appointmentId ?? '',
      scopedManicureId ?? '',
      options?.limitCount ?? 100,
    ],
    enabled: shouldEnable,
    queryFn: async () => {
      if (!salonId) {
        return [];
      }

      return listCommands({
        salonId,
        status: options?.status,
        limitCount: options?.limitCount,
        clientId: options?.clientId,
        appointmentId: options?.appointmentId,
        manicureId: scopedManicureId,
      });
    },
  });
}
