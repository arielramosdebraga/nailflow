import { useRouter, type Href } from 'expo-router';
import { Bell, CalendarDays, Settings2, UsersRound } from 'lucide-react-native';
import { View } from 'react-native';

import { NotificationCenter } from '@/components/features/notifications';
import { OperationalBottomNav } from '@/components/features/shared';

const notificationSettingsRoute = '/nail-technician/notifications/settings' satisfies Href;

export default function NailTechnicianNotificationsScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <NotificationCenter
        title="Notificações"
        subtitle="Acompanhe alertas de agenda, sincronização e lembretes em um só lugar."
        onOpenSettings={() => router.push(notificationSettingsRoute)}
      />
      <View className="absolute bottom-0 left-0 right-0">
        <OperationalBottomNav
          items={[
            {
              key: 'agenda',
              label: 'Agenda',
              icon: CalendarDays,
              onPress: () => router.push('/nail-technician/agenda'),
            },
            {
              key: 'clients',
              label: 'Clientes',
              icon: UsersRound,
              onPress: () => router.push('/nail-technician/clients'),
            },
            {
              key: 'notifications',
              label: 'Alertas',
              icon: Bell,
              active: true,
              onPress: () => router.replace('/nail-technician/notifications'),
            },
            {
              key: 'google',
              label: 'Google',
              icon: Settings2,
              onPress: () => router.push('/nail-technician/google-calendar'),
            },
          ]}
        />
      </View>
    </View>
  );
}
