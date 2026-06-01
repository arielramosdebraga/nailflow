import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { type UserRole } from '@/schemas/users/user.schema';
import { listUsers } from '@/services/users/userService';
import { useSessionStore } from '@/stores/sessionStore';

interface UseUsersOptions {
  salonId?: string;
  roles?: UserRole[];
  searchTerm?: string;
  limitCount?: number;
  enabled?: boolean;
}

export function useUsers(options?: UseUsersOptions) {
  const sessionStatus = useSessionStore((state) => state.status);
  const sessionSalonId = useSessionStore((state) => state.salonId);

  const resolvedSalonId = options?.salonId ?? sessionSalonId;

  const rolesKey = useMemo(() => (options?.roles ?? []).join('|'), [options?.roles]);

  const shouldEnable = useMemo(() => {
    if (options?.enabled === false) {
      return false;
    }

    if (sessionStatus !== 'authenticated') {
      return false;
    }

    return Boolean(resolvedSalonId);
  }, [options?.enabled, resolvedSalonId, sessionStatus]);

  return useQuery({
    queryKey: ['users', resolvedSalonId, rolesKey, options?.searchTerm ?? '', options?.limitCount ?? 100],
    enabled: shouldEnable,
    queryFn: async () => {
      if (!resolvedSalonId) {
        return [];
      }

      return listUsers({
        salonId: resolvedSalonId,
        roles: options?.roles,
        searchTerm: options?.searchTerm,
        limitCount: options?.limitCount,
      });
    },
  });
}
