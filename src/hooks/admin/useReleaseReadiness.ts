import { useQuery } from '@tanstack/react-query';

import { getReleaseReadinessSnapshotAsync } from '@/services/admin/pilotReadinessService';
import { useSessionStore } from '@/stores/sessionStore';

export function useReleaseReadiness() {
  const status = useSessionStore((state) => state.status);
  const role = useSessionStore((state) => state.role);
  const enabled = status === 'authenticated' && role === 'super_admin';

  return useQuery({
    queryKey: ['release-readiness'],
    enabled,
    queryFn: getReleaseReadinessSnapshotAsync,
  });
}
