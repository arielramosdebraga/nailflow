import { useRouter, type Href } from 'expo-router';
import { Text, View } from 'react-native';

import { AdminHeader } from '@/components/features/admin';
import { NotificationCenter } from '@/components/features/notifications';
import { Card } from '@/components/ui/Card';

const notificationSettingsRoute = '/admin/notifications/settings' satisfies Href;

export default function AdminNotificationsScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-zinc-950 px-6 pb-8">
      <AdminHeader
        title="Notificações"
        subtitle="Acompanhe eventos globais da plataforma e priorize ações operacionais do ambiente admin."
        activeRoute="notifications"
      />

      <View className="gap-4 pt-6">
        <Card className="gap-2 rounded-[24px] border-white/10 bg-white/5">
          <Text className="text-sm font-semibold text-zinc-100">Caixa operacional</Text>
          <Text className="text-sm leading-6 text-zinc-300">
            Use esta central para monitorar eventos transversais do NailFlow sem depender de uma tela por contexto.
          </Text>
        </Card>

        <View className="min-h-[620px] overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950">
          <NotificationCenter
            title="Notificações"
            subtitle="Acompanhe eventos globais da plataforma e alertas operacionais."
            onOpenSettings={() => router.push(notificationSettingsRoute)}
          />
        </View>
      </View>
    </View>
  );
}
