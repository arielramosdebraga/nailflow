import { useMutation, useQueryClient } from '@tanstack/react-query';

import { type AppointmentStatus, type UpsertAppointmentInput } from '@/schemas/appointments/appointment.schema';
import {
  createAppointment,
  deleteAppointment,
  updateAppointment,
  updateAppointmentStatus,
} from '@/services/appointments/appointmentsService';
import { useSessionStore } from '@/stores/sessionStore';

type AppointmentInputWithOptionalSalon = Omit<UpsertAppointmentInput, 'salonId'> & { salonId?: string };

function assertSalonId(explicitSalonId: string | undefined, sessionSalonId: string | null): string {
  const resolvedSalonId = explicitSalonId ?? sessionSalonId;
  if (!resolvedSalonId) {
    throw new Error('Nao foi possivel identificar o salao atual para salvar o atendimento.');
  }

  return resolvedSalonId;
}

export function useCreateAppointmentMutation() {
  const queryClient = useQueryClient();
  const sessionSalonId = useSessionStore((state) => state.salonId);

  return useMutation({
    mutationFn: async (payload: AppointmentInputWithOptionalSalon) => {
      const salonId = assertSalonId(payload.salonId, sessionSalonId);
      return createAppointment({
        ...payload,
        salonId,
      });
    },
    onSuccess: async (appointmentId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['appointments'] }),
        queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] }),
      ]);
    },
  });
}

export function useUpdateAppointmentMutation() {
  const queryClient = useQueryClient();
  const sessionSalonId = useSessionStore((state) => state.salonId);

  return useMutation({
    mutationFn: async (payload: { appointmentId: string; data: AppointmentInputWithOptionalSalon }) => {
      const salonId = assertSalonId(payload.data.salonId, sessionSalonId);
      await updateAppointment(payload.appointmentId, {
        ...payload.data,
        salonId,
      });
    },
    onSuccess: async (_, payload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['appointments'] }),
        queryClient.invalidateQueries({ queryKey: ['appointment', payload.appointmentId] }),
      ]);
    },
  });
}

export function useUpdateAppointmentStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { appointmentId: string; status: AppointmentStatus }) => {
      await updateAppointmentStatus(payload.appointmentId, payload.status);
    },
    onSuccess: async (_, payload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['appointments'] }),
        queryClient.invalidateQueries({ queryKey: ['appointment', payload.appointmentId] }),
      ]);
    },
  });
}

export function useDeleteAppointmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      await deleteAppointment(appointmentId);
    },
    onSuccess: async (_, appointmentId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['appointments'] }),
        queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] }),
      ]);
    },
  });
}
