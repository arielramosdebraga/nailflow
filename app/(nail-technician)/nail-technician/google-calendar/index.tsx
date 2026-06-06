import { Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Bell, CalendarDays, Settings2, UsersRound } from 'lucide-react-native';

import { GoogleCalendarSyncStatusTag } from '@/components/features/google';
import { NotificationsBellButton } from '@/components/features/notifications';
import {
  OperationalBottomNav,
  OperationalMetricCard,
  OperationalScreenShell,
} from '@/components/features/shared';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useGoogleCalendarConnection } from '@/hooks/google';
import { useUnreadNotificationsCount } from '@/hooks/notifications';

const googleRoutes = {
  agenda: '/nail-technician/agenda',
  clients: '/nail-technician/clients',
  notifications: '/nail-technician/notifications',
  googleCalendar: '/nail-technician/google-calendar',
} as const satisfies Record<string, Href>;

function formatDateTime(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleString('pt-BR');
}

function getStatusDescription(syncIndicator: ReturnType<typeof useGoogleCalendarConnection>['syncIndicator']) {
  if (syncIndicator === 'connected') {
    return 'Sua agenda do Google está conectada e pronta para sincronizar automaticamente os atendimentos.';
  }

  if (syncIndicator === 'error') {
    return 'Existe uma falha de sincronização ativa. Revise a conexão para evitar desencontros de agenda.';
  }

  return 'A conexão ainda não foi concluída. Finalize a autorização para ativar a sincronização.';
}

export default function GoogleCalendarScreen() {
  const router = useRouter();
  const googleConnection = useGoogleCalendarConnection();
  const unreadNotifications = useUnreadNotificationsCount();
  const formattedLastSync = formatDateTime(googleConnection.lastSyncedAt);

  return (
    <OperationalScreenShell
      title="Google Agenda"
      subtitle="Gerencie a conexão com o Google Calendar e acompanhe o estado operacional da sincronização sem sair da rotina da profissional."
      headerAccessory={
        <NotificationsBellButton
          unreadCount={unreadNotifications.unreadCount}
          onPress={() => router.push(googleRoutes.notifications)}
        />
      }
      topSlot={
        <View className="flex-row gap-3">
          <OperationalMetricCard
            label="Conexão"
            value={googleConnection.status?.connected ? 'Ativa' : 'Pendente'}
            helper="Conta Google"
          />
          <OperationalMetricCard
            label="Sincronização"
            value={
              googleConnection.syncIndicator === 'connected'
                ? 'OK'
                : googleConnection.syncIndicator === 'error'
                  ? 'Erro'
                  : 'Pendente'
            }
            helper="Status atual"
            featured
          />
        </View>
      }
      footer={
        <OperationalBottomNav
          items={[
            {
              key: 'agenda',
              label: 'Agenda',
              icon: CalendarDays,
              onPress: () => router.push(googleRoutes.agenda),
            },
            {
              key: 'clients',
              label: 'Clientes',
              icon: UsersRound,
              onPress: () => router.push(googleRoutes.clients),
            },
            {
              key: 'notifications',
              label: 'Alertas',
              icon: Bell,
              onPress: () => router.push(googleRoutes.notifications),
            },
            {
              key: 'google',
              label: 'Google',
              icon: Settings2,
              active: true,
              onPress: () => router.replace(googleRoutes.googleCalendar),
            },
          ]}
        />
      }
    >
      <View className="gap-4">
        <Card className="gap-3 border-white/10 bg-white/5">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-2">
              <Text className="text-lg font-semibold text-zinc-50">Conectar Google Agenda</Text>
              <Text className="text-sm leading-6 text-zinc-300">
                {getStatusDescription(googleConnection.syncIndicator)}
              </Text>
            </View>
            <GoogleCalendarSyncStatusTag status={googleConnection.syncIndicator} />
          </View>

          <Text className="text-sm text-zinc-300">
            Conta conectada: {googleConnection.status?.connected ? 'sim' : 'não'}
          </Text>
          {formattedLastSync ? (
            <Text className="text-sm text-zinc-300">Última sincronização: {formattedLastSync}</Text>
          ) : null}
          {googleConnection.lastErrorMessage ? (
            <Text className="text-sm text-error">Último erro: {googleConnection.lastErrorMessage}</Text>
          ) : null}
          {googleConnection.isLoadingStatus ? (
            <Text className="text-sm text-zinc-300">Carregando status da sincronização...</Text>
          ) : null}
          {googleConnection.errorMessage ? (
            <Text className="text-sm text-error">{googleConnection.errorMessage}</Text>
          ) : null}
          {googleConnection.feedbackMessage ? (
            <Text className="text-sm text-zinc-300">{googleConnection.feedbackMessage}</Text>
          ) : null}
        </Card>

        <Card className="gap-2 border-white/10 bg-white/5">
          <Text className="text-sm font-semibold text-zinc-100">Boas práticas</Text>
          <Text className="text-sm leading-6 text-zinc-300">
            Mantenha a conexão ativa para refletir mudanças de atendimento com menos retrabalho e mais previsibilidade na agenda.
          </Text>
          <Text className="text-sm leading-6 text-zinc-300">
            Se o backend ainda estiver indisponível, a tela continua funcionando e informa o estado atual sem quebrar sua navegação.
          </Text>
        </Card>

        <View className="gap-3">
          <Button
            label={
              googleConnection.isConnecting
                ? 'Conectando Google...'
                : googleConnection.status?.connected
                  ? 'Reconectar Google Agenda'
                  : 'Conectar Google Agenda'
            }
            className="rounded-2xl"
            onPress={() => {
              void googleConnection.connectGoogleCalendar();
            }}
            disabled={googleConnection.isConnecting}
          />
          <Button
            label="Atualizar status"
            variant="secondary"
            className="rounded-2xl"
            onPress={() => {
              void googleConnection.refreshStatus();
            }}
            disabled={googleConnection.isConnecting}
          />
        </View>
      </View>
    </OperationalScreenShell>
  );
}
