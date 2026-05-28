import { useEffect, useMemo, useState } from 'react';

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

import { auth } from '@/services/firebase';
import { createUserProfile, getUserProfileById } from '@/services/users/userService';
import { useSessionStore } from '@/stores/sessionStore';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signIn = useSessionStore((state) => state.signIn);
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  const canSignInWithGoogle = useMemo(
    () =>
      Boolean(
        process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
          process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
          process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
      ),
    []
  );

  useEffect(() => {
    const authInstance = auth;
    if (!authInstance) {
      return;
    }

    if (!response || response.type !== 'success') {
      return;
    }

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const idToken = response.params.id_token;
        if (!idToken) {
          throw new Error('Google nao retornou id_token.');
        }

        const credential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(authInstance, credential);

        let profile = await getUserProfileById(result.user.uid);
        if (!profile) {
          await createUserProfile({
            uid: result.user.uid,
            email: result.user.email ?? '',
            displayName: result.user.displayName ?? 'Usuario',
            role: 'manicure',
          });
          profile = await getUserProfileById(result.user.uid);
        }

        if (!profile) {
          throw new Error('Falha ao carregar perfil apos login Google.');
        }

        signIn({
          userId: result.user.uid,
          role: profile.role,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha no login com Google.');
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [response, signIn]);

  return {
    canSignInWithGoogle,
    googleRequestReady: Boolean(request),
    googleError: error,
    googleLoading: isLoading,
    promptGoogleSignIn: promptAsync,
  };
}
