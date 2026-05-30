import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { type AppointmentStatus } from '@/schemas/appointments/appointment.schema';
import { listAppointments } from '@/services/appointments/appointmentsService';
import { useSessionStore } from '@/stores/sessionStore';

interface UseAppointmentsOptions {
  start: Date;
  end: Date;
  salonId?: string;
  manicureId?: string;
  clientId?: string;
  statuses?: AppointmentStatus[];
  limitCount?: number;
  enabled?: boolean;
}

export function useAppointments(options: UseAppointmentsOptions) {
  const sessionStatus = useSessionStore((state) => state.status);
  const sessionSalonId = useSessionStore((state) => state.salonId);

  const resolvedSalonId = options.salonId ?? sessionSalonId;

  const shouldEnable = useMemo(() => {
    if (options.enabled === false) {
      return false;
    }

    if (sessionStatus !== 'authenticated') {
      return false;
    }

    return Boolean(resolvedSalonId);
  }, [options.enabled, resolvedSalonId, sessionStatus]);

  return useQuery({
    queryKey: [
      'appointments',
      resolvedSalonId,
      options.start.toISOString(),
      options.end.toISOString(),
      options.manicureId ?? '',
      options.clientId ?? '',
      (options.statuses ?? []).join('|'),
      options.limitCount ?? 300,
    ],
    enabled: shouldEnable,
    queryFn: async () => {
      if (!resolvedSalonId) {
        return [];
      }

      return listAppointments({
        salonId: resolvedSalonId,
        start: options.start,
        end: options.end,
        manicureId: options.manicureId,
        clientId: options.clientId,
        statuses: options.statuses,
        limitCount: options.limitCount,
      });
    },
  });
}
