import { useQuery } from '@tanstack/react-query';

import { listAdminUsers } from '@/services/users/adminUserService';
import { useSessionStore } from '@/stores/sessionStore';

interface UseAdminUsersOptions {
  limitCount?: number;
}

export function useAdminUsers(options: UseAdminUsersOptions = {}) {
  const status = useSessionStore((state) => state.status);
  const role = useSessionStore((state) => state.role);
  const isEnabled = status === 'authenticated' && role === 'super_admin';

  return useQuery({
    queryKey: ['admin-users', options.limitCount ?? 300],
    enabled: isEnabled,
    queryFn: async () =>
      listAdminUsers({
        limitCount: options.limitCount,
      }),
  });
}
