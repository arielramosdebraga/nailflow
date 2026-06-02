import { Redirect, type Href } from 'expo-router';

import { useSessionStore } from '@/stores/sessionStore';

export default function IndexScreen() {
  const status = useSessionStore((state) => state.status);
  const role = useSessionStore((state) => state.role);
  const twoFactorHref = '/2fa' as Href;

  if (status === 'loading') {
    return null;
  }

  if (status === 'pending_2fa') {
    return <Redirect href={twoFactorHref} />;
  }

  if (status !== 'authenticated') {
    return <Redirect href="/login" />;
  }

  if (role === 'super_admin') {
    return <Redirect href="/admin/dashboard" />;
  }

  if (role === 'salon_owner') {
    return <Redirect href="/owner/dashboard" />;
  }

  return <Redirect href="/nail-technician/agenda" />;
}
