import { useRouter, type Href } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { endOfDay, startOfDay } from 'date-fns';

import { CommandCard } from '@/components/features/commands/CommandCard';
import { NotificationsBellButton } from '@/components/features/notifications';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthSession } from '@/hooks/auth/useAuthSession';
import { useAppointments } from '@/hooks/appointments/useAppointments';
import { useClients } from '@/hooks/clients/useClients';
import { useCommands } from '@/hooks/commands/useCommands';
import { useUnreadNotificationsCount } from '@/hooks/notifications';
import { useManicures } from '@/hooks/users/useManicures';
import { formatCurrency } from '@/components/features/commands/commandFormatters';

const ownerRoutes = {
  notifications: '/owner/notifications',
  commands: '/owner/commands',
  agenda: '/owner/agenda',
  manicures: '/owner/manicures',
  googleCalendar: '/nail-technician/google-calendar',
  login: '/login',
} as const satisfies Record<string, Href>;

const getOwnerCommandDetailsRoute = (commandId: string): Href => ({
  pathname: '/owner/commands/[commandId]',
  params: { commandId },
});

export default function OwnerDashboardScreen() {
  const router = useRouter();
  const authSession = useAuthSession();
  const commandsQuery = useCommands({ limitCount: 300 });
  const appointmentsTodayQuery = useAppointments({
    start: startOfDay(new Date()),
    end: endOfDay(new Date()),
    limitCount: 250,
  });
  const clientsQuery = useClients({ limitCount: 200 });
  const manicuresQuery = useManicures({ limitCount: 50 });
  const unreadNotifications = useUnreadNotificationsCount();

  const commands = commandsQuery.data ?? [];
  const closedCommands = commands.filter((item) => item.status === 'closed');
  const openCommands = commands.filter((item) => item.status === 'open');
  const closedRevenue = closedCommands.reduce((acc, item) => acc + item.total, 0);
  const appointmentsToday = appointmentsTodayQuery.data ?? [];

  const recentCommands = commands.slice(0, 3);
  const clientsById = new Map((clientsQuery.data ?? []).map((client) => [client.id, client] as const));
  const manicuresById = new Map((manicuresQuery.data ?? []).map((manicure) => [manicure.uid, manicure] as const));

  const isLoading =
    commandsQuery.isLoading || appointmentsTodayQuery.isLoading || clientsQuery.isLoading || manicuresQuery.isLoading;
  const error = commandsQuery.error ?? appointmentsTodayQuery.error ?? clientsQuery.error ?? manicuresQuery.error;

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <ScrollView className="flex-1" contentContainerClassName="p-6 pb-10 pt-10">
        <View className="gap-2 pb-5">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Dashboard do salao
            </Text>
            <NotificationsBellButton
              unreadCount={unreadNotifications.unreadCount}
              onPress={() => router.push(ownerRoutes.notifications)}
            />
          </View>
          <Text className="text-base text-zinc-600 dark:text-zinc-300">
            Visao rapida de comandas, agenda do dia e equipe.
          </Text>
        </View>

        {isLoading ? (
          <Card>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando indicadores...</Text>
          </Card>
        ) : null}

        {error ? (
          <Card>
            <Text className="text-sm text-error">
              {error instanceof Error ? error.message : 'Falha ao carregar painel.'}
            </Text>
          </Card>
        ) : null}

        {!isLoading && !error ? (
          <View className="gap-3">
            <View className="flex-row gap-3">
              <Card className="flex-1 gap-1">
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">Comandas abertas</Text>
                <Text className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{openCommands.length}</Text>
              </Card>
              <Card className="flex-1 gap-1">
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">Comandas fechadas</Text>
                <Text className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{closedCommands.length}</Text>
              </Card>
            </View>

            <View className="flex-row gap-3">
              <Card className="flex-1 gap-1">
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">Faturamento (fechadas)</Text>
                <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(closedRevenue)}
                </Text>
              </Card>
              <Card className="flex-1 gap-1">
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">Atendimentos hoje</Text>
                <Text className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {appointmentsToday.length}
                </Text>
              </Card>
            </View>

            <Card className="gap-2">
              <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Equipe</Text>
              <Text className="text-sm text-zinc-600 dark:text-zinc-300">
                Manicures ativas: {(manicuresQuery.data ?? []).length}
              </Text>
              <Text className="text-sm text-zinc-600 dark:text-zinc-300">
                Clientes cadastrados: {(clientsQuery.data ?? []).length}
              </Text>
            </Card>

            <View className="gap-2">
              <Button label="Gerenciar comandas" onPress={() => router.push(ownerRoutes.commands)} />
              <Button
                label="Agenda consolidada do dia"
                variant="secondary"
                onPress={() => router.push(ownerRoutes.agenda)}
              />
              <Button label="Lista de manicures" variant="ghost" onPress={() => router.push(ownerRoutes.manicures)} />
              <Button
                label="Conectar Google Agenda"
                variant="ghost"
                onPress={() => router.push(ownerRoutes.googleCalendar)}
              />
            </View>

            {recentCommands.length > 0 ? (
              <View className="gap-2 pt-2">
                <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Comandas recentes</Text>
                <View className="gap-3">
                  {recentCommands.map((command) => (
                    <CommandCard
                      key={command.id}
                      command={command}
                      clientName={clientsById.get(command.clientId)?.name}
                      manicureName={manicuresById.get(command.manicureId)?.displayName}
                      onPress={() => router.push(getOwnerCommandDetailsRoute(command.id))}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <View className="p-6 pt-2">
        <Button
          label={authSession.isLoading ? 'Saindo...' : 'Sair'}
          variant="ghost"
          onPress={async () => {
            await authSession.signOut();
            router.replace(ownerRoutes.login);
          }}
        />
      </View>
    </View>
  );
}
