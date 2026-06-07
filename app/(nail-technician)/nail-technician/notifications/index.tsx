import { useRouter, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { NotificationCenter } from '@/components/features/notifications';

const notificationSettingsRoute = '/nail-technician/notifications/settings' satisfies Href;

export default function NailTechnicianNotificationsScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <NotificationCenter
        title="Notificações"
        subtitle="Acompanhe alertas de agenda, sincronização e lembretes."
        onOpenSettings={() => router.push(notificationSettingsRoute)}
      />
      <View className="px-6 pb-6 pt-2">
        <Pressable
          onPress={() => router.back()}
          className="h-12 items-center justify-center rounded-xl border border-zinc-300 bg-transparent active:opacity-90 dark:border-zinc-700"
          accessibilityRole="button"
          accessibilityLabel="Voltar para a tela anterior"
          accessibilityHint="Retorna para a agenda da nail technician."
        >
          <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Voltar</Text>
        </Pressable>
      </View>
    </View>
  );
}
