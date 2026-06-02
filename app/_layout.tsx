import '../global.css';

import { Stack } from 'expo-router';

import { useAdminSessionTimeout } from '@/hooks/auth/useAdminSessionTimeout';
import { AppProviders } from '@/providers/AppProviders';

export default function RootLayout() {
  useAdminSessionTimeout();

  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}
