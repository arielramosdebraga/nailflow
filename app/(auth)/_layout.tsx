import { Redirect, Stack, usePathname, type Href } from 'expo-router';

import { useSessionStore } from '@/stores/sessionStore';

export default function AuthLayout() {
  const status = useSessionStore((state) => state.status);
  const pathname = usePathname();
  const twoFactorHref = '/2fa' as Href;

  if (status === 'pending_2fa' && pathname !== '/2fa') {
    return <Redirect href={twoFactorHref} />;
  }

  if (status === 'authenticated') {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="privacy-policy" options={{ headerShown: true, title: 'Politica de Privacidade' }} />
      <Stack.Screen name="terms-consent" options={{ headerShown: true, title: 'Termos e Consentimento' }} />
    </Stack>
  );
}
