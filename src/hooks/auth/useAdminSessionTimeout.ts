import { useEffect } from 'react';
import { AppState } from 'react-native';
import { usePathname } from 'expo-router';

import { useSessionStore } from '@/stores/sessionStore';

const ADMIN_SESSION_TIMEOUT_MS = 60 * 60 * 1000;
const SESSION_GUARD_TICK_MS = 30 * 1000;

function shouldEnforceTimeout(role: string | null): boolean {
  return role === 'super_admin' || role === 'salon_owner';
}

export function useAdminSessionTimeout() {
  const pathname = usePathname();
  const status = useSessionStore((state) => state.status);
  const role = useSessionStore((state) => state.role);
  const lastActivityAt = useSessionStore((state) => state.lastActivityAt);
  const touchActivity = useSessionStore((state) => state.touchActivity);
  const signOut = useSessionStore((state) => state.signOut);

  useEffect(() => {
    if (status === 'authenticated' && shouldEnforceTimeout(role)) {
      touchActivity();
    }
  }, [pathname, role, status, touchActivity]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        touchActivity();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [touchActivity]);

  useEffect(() => {
    if (status !== 'authenticated' || !shouldEnforceTimeout(role)) {
      return undefined;
    }

    const timer = setInterval(() => {
      if (!lastActivityAt) {
        return;
      }

      const inactivity = Date.now() - lastActivityAt;
      if (inactivity >= ADMIN_SESSION_TIMEOUT_MS) {
        signOut();
      }
    }, SESSION_GUARD_TICK_MS);

    return () => {
      clearInterval(timer);
    };
  }, [lastActivityAt, role, signOut, status]);
}
