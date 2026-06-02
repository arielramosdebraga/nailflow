import { useUsers } from '@/hooks/users/useUsers';

interface UseManicuresOptions {
  searchTerm?: string;
  limitCount?: number;
  enabled?: boolean;
}

export function useManicures(options?: UseManicuresOptions) {
  return useUsers({
    roles: ['nail_technician'],
    searchTerm: options?.searchTerm,
    limitCount: options?.limitCount,
    enabled: options?.enabled,
  });
}
