import { Redirect, Stack } from 'expo-router';

import { useSessionStore } from '@/stores/sessionStore';

export default function NailTechnicianLayout() {
  const status = useSessionStore((state) => state.status);
  const role = useSessionStore((state) => state.role);

  if (status === 'loading') {
    return null;
  }

  if (status !== 'authenticated') {
    return <Redirect href="/login" />;
  }

  if (role !== 'nail_technician' && role !== 'salon_owner' && role !== 'super_admin') {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
