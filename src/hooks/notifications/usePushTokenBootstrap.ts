import { useCallback } from 'react';

import { bootstrapPushTokenRegistrationAsync } from '@/services/notifications';

export function usePushTokenBootstrap() {
  return useCallback((uid: string) => {
    void bootstrapPushTokenRegistrationAsync(uid).catch(() => undefined);
  }, []);
}
