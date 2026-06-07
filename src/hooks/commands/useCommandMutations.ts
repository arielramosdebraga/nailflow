import { useMutation, useQueryClient } from '@tanstack/react-query';

import { type UpsertCommandInput } from '@/schemas/commands/command.schema';
import { createCommand, deleteCommand, updateCommand } from '@/services/commands/commandsService';
import { useSessionStore } from '@/stores/sessionStore';

type CreateCommandInput = Omit<UpsertCommandInput, 'salonId' | 'manicureId'> & {
  salonId?: string;
  manicureId?: string;
};

function assertSalonId(explicitSalonId: string | undefined, sessionSalonId: string | null): string {
  const resolved = explicitSalonId ?? sessionSalonId;
  if (!resolved) {
    throw new Error('Nao foi possivel identificar o salao atual para salvar comanda.');
  }

  return resolved;
}

function resolveManicureId(explicitManicureId: string | undefined, sessionUserId: string | null): string {
  const resolved = explicitManicureId?.trim() || sessionUserId || '';
  if (!resolved) {
    throw new Error('Nao foi possivel identificar a profissional responsavel da comanda.');
  }

  return resolved;
}

export function useCreateCommandMutation() {
  const queryClient = useQueryClient();
  const sessionSalonId = useSessionStore((state) => state.salonId);
  const sessionUserId = useSessionStore((state) => state.userId);

  return useMutation({
    mutationFn: async (payload: CreateCommandInput) => {
      const salonId = assertSalonId(payload.salonId, sessionSalonId);
      const manicureId = resolveManicureId(payload.manicureId, sessionUserId);

      return createCommand({
        ...payload,
        salonId,
        manicureId,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['commands'] });
    },
  });
}

export function useUpdateCommandMutation() {
  const queryClient = useQueryClient();
  const sessionSalonId = useSessionStore((state) => state.salonId);
  const sessionUserId = useSessionStore((state) => state.userId);
  const sessionRole = useSessionStore((state) => state.role);

  return useMutation({
    mutationFn: async (payload: { commandId: string; data: CreateCommandInput }) => {
      const salonId = assertSalonId(payload.data.salonId, sessionSalonId);
      const manicureId = resolveManicureId(payload.data.manicureId, sessionUserId);

      await updateCommand(payload.commandId, {
        ...payload.data,
        salonId,
        manicureId,
      }, {
        actorRole: sessionRole ?? undefined,
      });
    },
    onSuccess: async (_, payload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['commands'] }),
        queryClient.invalidateQueries({ queryKey: ['command', payload.commandId] }),
      ]);
    },
  });
}

export function useDeleteCommandMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commandId: string) => {
      await deleteCommand(commandId);
    },
    onSuccess: async (_, commandId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['commands'] }),
        queryClient.invalidateQueries({ queryKey: ['command', commandId] }),
      ]);
    },
  });
}
