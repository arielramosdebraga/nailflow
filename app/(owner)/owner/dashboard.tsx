import { useRouter, type Href } from 'expo-router';
import { Bell, CalendarDays, LayoutGrid, ReceiptText, UsersRound } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { endOfDay, startOfDay } from 'date-fns';

import { CommandCard } from '@/components/features/commands/CommandCard';
import { NotificationsBellButton } from '@/components/features/notifications';
import {
  OperationalBottomNav,
  OperationalHeroCard,
  OperationalMetricCard,
  OperationalScreenShell,
} from '@/components/features/shared';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
    <OperationalScreenShell
      title="Painel"
      subtitle="Visão geral da operação do salão com agenda, faturamento e equipe."
      headerAccessory={
        <NotificationsBellButton
          unreadCount={unreadNotifications.unreadCount}
          onPress={() => router.push(ownerRoutes.notifications)}
        />
      }
      topSlot={
        <View className="gap-4">
          <OperationalHeroCard
            eyebrow="Faturamento das comandas fechadas"
            title={formatCurrency(closedRevenue)}
          >
            <View className="flex-row gap-3">
              <View className="flex-1 rounded-2xl bg-white/15 px-4 py-3">
                <Text className="text-xs text-zinc-100/80">Comandas abertas</Text>
                <Text className="pt-1 text-lg font-black text-white">{openCommands.length}</Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white/15 px-4 py-3">
                <Text className="text-xs text-zinc-100/80">Atendimentos hoje</Text>
                <Text className="pt-1 text-lg font-black text-white">{appointmentsToday.length}</Text>
              </View>
            </View>
          </OperationalHeroCard>

          <View className="flex-row gap-3">
            <OperationalMetricCard label="Equipe ativa" value={String((manicuresQuery.data ?? []).length)} helper="Profissionais" />
            <OperationalMetricCard label="Clientes" value={String((clientsQuery.data ?? []).length)} helper="Base cadastrada" />
          </View>
        </View>
      }
      footer={
        <OperationalBottomNav
          items={[
            {
              key: 'dashboard',
              label: 'Painel',
              icon: LayoutGrid,
              active: true,
              onPress: () => router.replace('/owner/dashboard'),
            },
            {
              key: 'agenda',
              label: 'Agenda',
              icon: CalendarDays,
              onPress: () => router.push(ownerRoutes.agenda),
            },
            {
              key: 'manicures',
              label: 'Equipe',
              icon: UsersRound,
              onPress: () => router.push(ownerRoutes.manicures),
            },
            {
              key: 'commands',
              label: 'Comandas',
              icon: ReceiptText,
              onPress: () => router.push(ownerRoutes.commands),
            },
            {
              key: 'notifications',
              label: 'Alertas',
              icon: Bell,
              onPress: () => router.push(ownerRoutes.notifications),
            },
          ]}
        />
      }
    >
      <View className="gap-4">
        <View className="gap-3">
          <Button label="Gerenciar comandas" className="h-12 rounded-2xl" onPress={() => router.push(ownerRoutes.commands)} />
          <View className="flex-row gap-3">
            <Button
              label="Agenda do dia"
              variant="secondary"
              className="flex-1 h-12 rounded-2xl"
              onPress={() => router.push(ownerRoutes.agenda)}
            />
            <Button
              label="Equipe"
              variant="ghost"
              className="flex-1 h-12 rounded-2xl border-white/10 bg-white/5"
              onPress={() => router.push(ownerRoutes.manicures)}
            />
          </View>
        </View>

        {isLoading ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-zinc-300">Carregando indicadores...</Text>
          </Card>
        ) : null}

        {error ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-error">
              {error instanceof Error ? error.message : 'Falha ao carregar painel.'}
            </Text>
          </Card>
        ) : null}

        {!isLoading && !error ? (
          <View className="gap-4">
            <Card className="gap-3 rounded-[24px] border-white/10 bg-white/5">
              <Text className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">Alertas</Text>
              <View className="gap-3">
                <View className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
                  <Text className="text-sm font-semibold text-amber-300">Comandas abertas</Text>
                  <Text className="pt-1 text-sm text-zinc-200">
                    {openCommands.length} comanda(s) ainda precisam de fechamento.
                  </Text>
                </View>
                <View className="rounded-2xl border border-sky-400/30 bg-sky-400/10 p-4">
                  <Text className="text-sm font-semibold text-sky-300">Google Agenda</Text>
                  <Text className="pt-1 text-sm text-zinc-200">
                    Acompanhe a integração da equipe pelo atalho de Google Agenda.
                  </Text>
                </View>
              </View>
            </Card>

            {recentCommands.length > 0 ? (
              <View className="gap-3">
                <Text className="text-base font-semibold text-zinc-50">Comandas recentes</Text>
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
      </View>
    </OperationalScreenShell>
  );
}
