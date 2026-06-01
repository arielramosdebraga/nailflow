import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { NotificationPreferencesForm } from '@/components/features/notifications';

export default function NailTechnicianNotificationSettingsScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <NotificationPreferencesForm
        title="Configuracoes de notificacao"
        subtitle="Defina alertas e horarios para nao perturbe."
      />
      <View className="px-6 pb-6 pt-2">
        <Pressable
          onPress={() => router.back()}
          className="h-12 items-center justify-center rounded-xl border border-zinc-300 bg-transparent active:opacity-90 dark:border-zinc-700"
        >
          <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Voltar</Text>
        </Pressable>
      </View>
    </View>
  );
}
