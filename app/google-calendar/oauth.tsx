import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

const googleCalendarRoute = '/nail-technician/google-calendar' satisfies Href;

export default function GoogleCalendarOAuthRedirectScreen() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace(googleCalendarRoute);
    }, 1200);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-zinc-50 px-6 dark:bg-zinc-950">
      <Text className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Finalizando conexão com Google...</Text>
      <Text className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-300">
        Se o redirecionamento não ocorrer automaticamente, volte para a tela anterior.
      </Text>
    </View>
  );
}
