import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { NotificationsBellButton } from '@/components/features/notifications';
import { Button } from '@/components/ui/Button';
import { useAuthSession } from '@/hooks/auth/useAuthSession';
import { useUnreadNotificationsCount } from '@/hooks/notifications';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const authSession = useAuthSession();
  const unreadNotifications = useUnreadNotificationsCount();

  return (
    <View className="flex-1 justify-between bg-zinc-50 p-6 dark:bg-zinc-950">
      <View className="gap-2 pt-10">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="flex-1 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Painel do Superadministrador
          </Text>
          <NotificationsBellButton
            unreadCount={unreadNotifications.unreadCount}
            onPress={() => router.push('./notifications')}
          />
        </View>
        <Text className="text-base text-zinc-600 dark:text-zinc-300">
          Governança global do NailFlow com auditoria, permissões e monitoramento operacional.
        </Text>
        <View className="pt-2">
          <Button label="Abrir logs de auditoria" onPress={() => router.push('./logs')} />
        </View>
        <Button label="Central de notificações" variant="secondary" onPress={() => router.push('./notifications')} />
      </View>

      <Button
        label={authSession.isLoading ? 'Saindo...' : 'Sair'}
        variant="ghost"
        onPress={async () => {
          await authSession.signOut();
          router.replace('/login');
        }}
      />
    </View>
  );
}
