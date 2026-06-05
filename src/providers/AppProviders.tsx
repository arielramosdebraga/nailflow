import { PropsWithChildren, useEffect, useState } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { onAuthStateChanged } from 'firebase/auth';

import { usePushTokenBootstrap } from '@/hooks/notifications';
import { auth } from '@/services/firebase';
import { createUserProfile, getUserProfileById } from '@/services/users/userService';
import { useSessionStore } from '@/stores/sessionStore';

export function AppProviders({ children }: PropsWithChildren) {
  const setLoading = useSessionStore((state) => state.setLoading);
  const signIn = useSessionStore((state) => state.signIn);
  const signOut = useSessionStore((state) => state.signOut);
  const bootstrapPushToken = usePushTokenBootstrap();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
          },
        },
      })
  );

  useEffect(() => {
    if (!auth) {
      signOut();
      return undefined;
    }

    setLoading();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        signOut();
        return;
      }

      try {
        let profile = await getUserProfileById(user.uid);

        if (!profile) {
          await createUserProfile({
            uid: user.uid,
            email: user.email ?? '',
            displayName: user.displayName ?? 'Usuario',
            role: 'nail_technician',
          });
          profile = await getUserProfileById(user.uid);
        }

        if (!profile) {
          throw new Error('Falha ao carregar perfil do usuario.');
        }

        signIn({
          userId: user.uid,
          role: profile.role,
          salonId: profile.salonId,
          secondFactorRequired: profile.secondFactorRequired,
        });
        bootstrapPushToken(user.uid);
      } catch {
        signOut();
      }
    });

    return unsubscribe;
  }, [bootstrapPushToken, setLoading, signIn, signOut]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
