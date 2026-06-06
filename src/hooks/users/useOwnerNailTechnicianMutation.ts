import { useMutation, useQueryClient } from '@tanstack/react-query';

import { type CreateOwnerNailTechnicianInput } from '@/schemas/users/owner-create-nail-technician.schema';
import { createOwnerNailTechnician } from '@/services/users/ownerNailTechnicianService';
import { useSessionStore } from '@/stores/sessionStore';

function assertCurrentSalon(sessionSalonId: string | null): void {
  if (!sessionSalonId) {
    throw new Error('Nao foi possivel identificar o salao atual para cadastrar a profissional.');
  }
}

export function useCreateOwnerNailTechnicianMutation() {
  const queryClient = useQueryClient();
  const sessionSalonId = useSessionStore((state) => state.salonId);

  return useMutation({
    mutationFn: async (payload: CreateOwnerNailTechnicianInput) => {
      assertCurrentSalon(sessionSalonId);
      return createOwnerNailTechnician(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
