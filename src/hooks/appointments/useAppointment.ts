import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { getAppointmentById } from '@/services/appointments/appointmentsService';
import { useSessionStore } from '@/stores/sessionStore';

interface UseAppointmentOptions {
  salonId?: string;
  enabled?: boolean;
}

export function useAppointment(appointmentId: string | undefined, options?: UseAppointmentOptions) {
  const status = useSessionStore((state) => state.status);
  const role = useSessionStore((state) => state.role);
  const sessionSalonId = useSessionStore((state) => state.salonId);

  const resolvedSalonId = options?.salonId ?? sessionSalonId;

  const shouldEnable = useMemo(() => {
    if (options?.enabled === false) {
      return false;
    }

    if (status !== 'authenticated') {
      return false;
    }

    if (!appointmentId) {
      return false;
    }

    return true;
  }, [appointmentId, options?.enabled, status]);

  return useQuery({
    queryKey: ['appointment', appointmentId],
    enabled: shouldEnable,
    queryFn: async () => {
      const appointment = await getAppointmentById(appointmentId ?? '');
      if (!appointment) {
        return null;
      }

      if (role !== 'super_admin' && resolvedSalonId && appointment.salonId !== resolvedSalonId) {
        throw new Error('Atendimento fora do escopo do salao atual.');
      }

      return appointment;
    },
  });
}
