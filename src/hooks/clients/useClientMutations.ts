import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createClient, deleteClient, updateClient } from '@/services/clients/clientsService';
import { type UpsertClientInput } from '@/schemas/clients/client.schema';
import { useSessionStore } from '@/stores/sessionStore';

type CreateClientInput = Omit<UpsertClientInput, 'salonId'> & { salonId?: string };

function assertSalonId(explicitSalonId: string | undefined, sessionSalonId: string | null): string {
  const resolved = explicitSalonId ?? sessionSalonId;
  if (!resolved) {
    throw new Error('Nao foi possivel identificar o salao atual para salvar cliente.');
  }
  return resolved;
}

export function useCreateClientMutation() {
  const queryClient = useQueryClient();
  const sessionSalonId = useSessionStore((state) => state.salonId);

  return useMutation({
    mutationFn: async (payload: CreateClientInput) => {
      const salonId = assertSalonId(payload.salonId, sessionSalonId);
      return createClient({
        ...payload,
        salonId,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useUpdateClientMutation() {
  const queryClient = useQueryClient();
  const sessionSalonId = useSessionStore((state) => state.salonId);

  return useMutation({
    mutationFn: async (payload: { clientId: string; data: CreateClientInput }) => {
      const salonId = assertSalonId(payload.data.salonId, sessionSalonId);
      await updateClient(payload.clientId, {
        ...payload.data,
        salonId,
      });
    },
    onSuccess: async (_, payload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['clients'] }),
        queryClient.invalidateQueries({ queryKey: ['client', payload.clientId] }),
      ]);
    },
  });
}

export function useDeleteClientMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      await deleteClient(clientId);
    },
    onSuccess: async (_, clientId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['clients'] }),
        queryClient.invalidateQueries({ queryKey: ['client', clientId] }),
      ]);
    },
  });
}
