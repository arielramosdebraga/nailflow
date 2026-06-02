import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { NotificationsBellButton } from '@/components/features/notifications';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
        <View className="gap-3 pt-4">
          <Card className="gap-3">
            <Text className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Governança</Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">
              Consulte saloes, usuarios administrativos e trilha de auditoria em um unico lugar.
            </Text>
            <Button label="Abrir saloes" onPress={() => router.push('./salons')} />
            <Button label="Abrir usuarios" variant="secondary" onPress={() => router.push('./users')} />
            <Button label="Abrir logs de auditoria" variant="ghost" onPress={() => router.push('./logs')} />
            <Button label="Configuracoes globais" variant="ghost" onPress={() => router.push('./settings')} />
            <Button label="Exportacao LGPD" variant="ghost" onPress={() => router.push('./lgpd-export')} />
          </Card>
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
