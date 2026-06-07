import { Text, View } from 'react-native';

import { GoogleCalendarConnectionPanel } from '@/components/features/google';
import { Button } from '@/components/ui/Button';
import { useGoogleCalendarConnection } from '@/hooks/google';
import { useRouter } from 'expo-router';

export default function GoogleCalendarScreen() {
  const router = useRouter();
  const googleConnection = useGoogleCalendarConnection();

  return (
    <View className="flex-1 justify-between bg-zinc-50 p-6 dark:bg-zinc-950">
      <View className="gap-4 pt-10">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Google Agenda</Text>
          <Text className="text-base text-zinc-600 dark:text-zinc-300">
            Conecte sua conta Google para sincronizar automaticamente os atendimentos da plataforma.
          </Text>
        </View>

        <GoogleCalendarConnectionPanel
          syncIndicator={googleConnection.syncIndicator}
          connected={Boolean(googleConnection.status?.connected)}
          isLoadingStatus={googleConnection.isLoadingStatus}
          isConnecting={googleConnection.isConnecting}
          errorMessage={googleConnection.errorMessage}
          feedbackMessage={googleConnection.feedbackMessage}
          lastSyncedAt={googleConnection.lastSyncedAt}
          lastErrorMessage={googleConnection.lastErrorMessage}
          onConnect={googleConnection.connectGoogleCalendar}
          onRefresh={googleConnection.refreshStatus}
        />
      </View>

      <Button label="Voltar para agenda" variant="ghost" onPress={() => router.back()} />
    </View>
  );
}
