import { View } from 'react-native';

import { AdminHeader } from '@/components/features/admin';
import { NotificationPreferencesForm } from '@/components/features/notifications';

export default function AdminNotificationSettingsScreen() {
  return (
    <View className="flex-1 bg-zinc-950 px-6 pb-8">
      <AdminHeader
        title="Preferências de alerta"
        subtitle="Defina o tom do monitoramento administrativo com foco em eventos críticos e rotina da operação."
        activeRoute="notifications"
      />

      <View className="pt-6">
        <NotificationPreferencesForm
          title="Configurações de notificação"
          subtitle="Defina preferências de alerta para monitoramento administrativo."
        />
      </View>
    </View>
  );
}
