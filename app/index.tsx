import { Redirect } from 'expo-router';

import { useSessionStore } from '@/stores/sessionStore';

export default function IndexScreen() {
  const status = useSessionStore((state) => state.status);
  const role = useSessionStore((state) => state.role);

  if (status === 'loading') {
    return null;
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

  return <Redirect href="/manicure/agenda" />;
}
