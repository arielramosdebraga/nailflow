import { useEffect } from 'react';

import { useSessionStore } from '@/stores/sessionStore';

function isAdminRole(role: string | null): boolean {
  return role === 'super_admin' || role === 'salon_owner';
}

export function useAdminSessionGuard() {
  const status = useSessionStore((state) => state.status);
  const role = useSessionStore((state) => state.role);
  const touchActivity = useSessionStore((state) => state.touchActivity);

  useEffect(() => {
    if (status === 'authenticated' && isAdminRole(role)) {
      touchActivity();
    }
  }, [role, status, touchActivity]);
}
