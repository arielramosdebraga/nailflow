import { useMemo, useState } from 'react';

import {
  sendRecoverPasswordEmail,
  signInWithEmailPassword,
  signOut as signOutService,
  signUpWithEmailPassword,
} from '@/services/auth/authService';
import { createUserProfile, getUserProfileById } from '@/services/users/userService';
import { useSessionStore } from '@/stores/sessionStore';

export function useAuthSession() {
  const [isLoading, setIsLoading] = useState(false);
  const session = useSessionStore();

  return useMemo(
    () => ({
      isLoading,
      status: session.status,
      role: session.role,
      async signIn(params: { email: string; password: string }) {
        setIsLoading(true);
        try {
          const identity = await signInWithEmailPassword(params);
          const profile = await getUserProfileById(identity.uid);

          if (!profile) {
            throw new Error('Perfil do usuario nao encontrado. Contate o suporte.');
          }

          session.signIn({ userId: identity.uid, role: profile.role, salonId: profile.salonId });
        } finally {
          setIsLoading(false);
        }
      },
      async signUp(params: { displayName: string; email: string; password: string }) {
        setIsLoading(true);
        try {
          const identity = await signUpWithEmailPassword(params);
          await createUserProfile({
            uid: identity.uid,
            email: identity.email,
            displayName: params.displayName,
            role: 'manicure',
          });
          session.signIn({ userId: identity.uid, role: 'manicure', salonId: null });
        } finally {
          setIsLoading(false);
        }
      },
      async sendRecoverEmail(email: string) {
        setIsLoading(true);
        try {
          await sendRecoverPasswordEmail(email);
        } finally {
          setIsLoading(false);
        }
      },
      async signOut() {
        setIsLoading(true);
        try {
          await signOutService();
        } finally {
          session.signOut();
          setIsLoading(false);
        }
      },
    }),
    [isLoading, session]
  );
}
