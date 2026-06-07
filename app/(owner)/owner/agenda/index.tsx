import { useMemo } from 'react';
import { Bell, CalendarDays, LayoutGrid, ReceiptText, UsersRound } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { endOfDay, startOfDay } from 'date-fns';

import { NotificationsBellButton } from '@/components/features/notifications';
import { OperationalBottomNav, OperationalScreenShell } from '@/components/features/shared';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppointments } from '@/hooks/appointments/useAppointments';
import { useClients } from '@/hooks/clients/useClients';
import { useCommands } from '@/hooks/commands/useCommands';
import { useManicures } from '@/hooks/users/useManicures';
import { useUnreadNotificationsCount } from '@/hooks/notifications';
import { formatCurrency, formatTime } from '@/components/features/commands/commandFormatters';
import { CommandStatusTag } from '@/components/features/commands/CommandStatusTag';

const appointmentStatusLabels = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Concluido',
  cancelled: 'Cancelado',
} as const;
const ownerDashboardRoute = '/owner/dashboard' satisfies Href;

export default function OwnerAgendaDayScreen() {
  const router = useRouter();
  const unreadNotifications = useUnreadNotificationsCount();

  const appointmentsQuery = useAppointments({
    start: startOfDay(new Date()),
    end: endOfDay(new Date()),
    limitCount: 400,
  });
  const clientsQuery = useClients({ limitCount: 300 });
  const manicuresQuery = useManicures({ limitCount: 80 });
  const commandsQuery = useCommands({ limitCount: 400 });

  const clientById = useMemo(() => {
    const entries = (clientsQuery.data ?? []).map((client) => [client.id, client] as const);
    return new Map(entries);
  }, [clientsQuery.data]);

  const commandByAppointmentId = useMemo(() => {
    const entries = (commandsQuery.data ?? []).map((command) => [command.appointmentId, command] as const);
    return new Map(entries);
  }, [commandsQuery.data]);

  const groupedAgenda = useMemo(() => {
    const appointments = appointmentsQuery.data ?? [];
    const groups = new Map<string, typeof appointments>();

    for (const appointment of appointments) {
      const group = groups.get(appointment.manicureId) ?? [];
      group.push(appointment);
      groups.set(appointment.manicureId, group);
    }

    for (const group of groups.values()) {
      group.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }

    return groups;
  }, [appointmentsQuery.data]);

  const isLoading =
    appointmentsQuery.isLoading || clientsQuery.isLoading || manicuresQuery.isLoading || commandsQuery.isLoading;
  const error = appointmentsQuery.error ?? clientsQuery.error ?? manicuresQuery.error ?? commandsQuery.error ?? null;

  return (
    <OperationalScreenShell
      title="Agenda"
      subtitle="Visão do dia agrupada por profissional, com status de atendimento e comanda."
      headerAccessory={
        <NotificationsBellButton
          unreadCount={unreadNotifications.unreadCount}
          onPress={() => router.push('/owner/notifications')}
        />
      }
      footer={
        <OperationalBottomNav
          items={[
            {
              key: 'dashboard',
              label: 'Painel',
              icon: LayoutGrid,
              onPress: () => router.push('/owner/dashboard'),
            },
            {
              key: 'agenda',
              label: 'Agenda',
              icon: CalendarDays,
              active: true,
              onPress: () => router.replace('/owner/agenda'),
            },
            {
              key: 'manicures',
              label: 'Equipe',
              icon: UsersRound,
              onPress: () => router.push('/owner/manicures'),
            },
            {
              key: 'commands',
              label: 'Comandas',
              icon: ReceiptText,
              onPress: () => router.push('/owner/commands'),
            },
            {
              key: 'notifications',
              label: 'Alertas',
              icon: Bell,
              onPress: () => router.push('/owner/notifications'),
            },
          ]}
        />
      }
    >
      <View className="gap-4">
        <Button
          label="Voltar ao painel"
          variant="ghost"
          className="h-12 rounded-2xl border-white/10 bg-white/5"
          onPress={() => router.replace(ownerDashboardRoute)}
        />

        {isLoading ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-zinc-300">Carregando agenda do dia...</Text>
          </Card>
        ) : null}

        {error ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-error">{error instanceof Error ? error.message : 'Falha ao carregar.'}</Text>
          </Card>
        ) : null}

        {!isLoading && !error && (appointmentsQuery.data ?? []).length === 0 ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-zinc-300">Nenhum atendimento para hoje.</Text>
          </Card>
        ) : null}

        {!isLoading && !error && (appointmentsQuery.data ?? []).length > 0 ? (
          <View className="gap-3">
            {(manicuresQuery.data ?? []).map((manicure) => {
              const agenda = groupedAgenda.get(manicure.uid) ?? [];
              if (!agenda.length) {
                return null;
              }

              return (
                <Card key={manicure.uid} className="gap-3 rounded-[24px] border-white/10 bg-white/5">
                  <View className="gap-1">
                    <Text className="text-base font-semibold text-zinc-50">
                      {manicure.displayName}
                    </Text>
                    <Text className="text-xs text-zinc-400">
                      {agenda.length} atendimento(s) hoje
                    </Text>
                  </View>

                  <View className="gap-2">
                    {agenda.map((appointment) => {
                      const client = clientById.get(appointment.clientId);
                      const command = commandByAppointmentId.get(appointment.id);
                      return (
                        <View
                          key={appointment.id}
                          className="rounded-2xl border border-white/10 bg-zinc-950/60 p-3"
                        >
                          <View className="flex-row items-center justify-between gap-3">
                            <Text className="text-sm font-semibold text-zinc-100">
                              {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                            </Text>
                            <Text className="text-xs text-zinc-400">
                              {appointmentStatusLabels[appointment.status]}
                            </Text>
                          </View>

                          <Text className="text-sm text-zinc-300">
                            Cliente: {client?.name ?? appointment.clientId}
                          </Text>

                          {command ? (
                            <View className="flex-row items-center justify-between pt-2">
                              <CommandStatusTag status={command.status} />
                              <Text className="text-sm font-semibold text-zinc-50">
                                {formatCurrency(command.total)}
                              </Text>
                            </View>
                          ) : (
                            <Text className="pt-2 text-xs text-zinc-400">
                              Sem comanda vinculada.
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </Card>
              );
            })}
          </View>
        ) : null}
      </View>
    </OperationalScreenShell>
  );
}
