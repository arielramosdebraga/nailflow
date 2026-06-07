import { useQuery } from '@tanstack/react-query';

import { getUserProfileById } from '@/services/users/userService';
import { useSessionStore } from '@/stores/sessionStore';

export function useCurrentUserProfile() {
  const status = useSessionStore((state) => state.status);
  const userId = useSessionStore((state) => state.userId);

  return useQuery({
    queryKey: ['current-user-profile', userId ?? ''],
    enabled: status === 'authenticated' && Boolean(userId),
    queryFn: async () => {
      if (!userId) {
        throw new Error('Usuária não identificada para carregar o perfil.');
      }

      const profile = await getUserProfileById(userId);
      if (!profile) {
        throw new Error('Perfil da usuária não encontrado.');
      }

      return profile;
    },
  });
}
