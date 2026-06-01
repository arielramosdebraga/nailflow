import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { endOfDay, startOfDay } from 'date-fns';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppointments } from '@/hooks/appointments/useAppointments';
import { useClients } from '@/hooks/clients/useClients';
import { useCommands } from '@/hooks/commands/useCommands';
import { useManicures } from '@/hooks/users/useManicures';
import { formatCurrency, formatTime } from '@/components/features/commands/commandFormatters';
import { CommandStatusTag } from '@/components/features/commands/CommandStatusTag';

const appointmentStatusLabels = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Concluido',
  cancelled: 'Cancelado',
} as const;

export default function OwnerAgendaDayScreen() {
  const router = useRouter();

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
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <ScrollView className="flex-1" contentContainerClassName="p-6 pb-10 pt-10">
        <View className="gap-2 pb-5">
          <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Agenda consolidada</Text>
          <Text className="text-base text-zinc-600 dark:text-zinc-300">
            Visao do dia agrupada por manicure com status de comanda.
          </Text>
        </View>

        {isLoading ? (
          <Card>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando agenda do dia...</Text>
          </Card>
        ) : null}

        {error ? (
          <Card>
            <Text className="text-sm text-error">{error instanceof Error ? error.message : 'Falha ao carregar.'}</Text>
          </Card>
        ) : null}

        {!isLoading && !error && (appointmentsQuery.data ?? []).length === 0 ? (
          <Card>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">Nenhum atendimento para hoje.</Text>
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
                <Card key={manicure.uid} className="gap-3">
                  <View className="gap-1">
                    <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      {manicure.displayName}
                    </Text>
                    <Text className="text-xs text-zinc-600 dark:text-zinc-300">
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
                          className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700"
                        >
                          <View className="flex-row items-center justify-between gap-3">
                            <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                              {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                            </Text>
                            <Text className="text-xs text-zinc-600 dark:text-zinc-300">
                              {appointmentStatusLabels[appointment.status]}
                            </Text>
                          </View>

                          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
                            Cliente: {client?.name ?? appointment.clientId}
                          </Text>

                          {command ? (
                            <View className="flex-row items-center justify-between pt-2">
                              <CommandStatusTag status={command.status} />
                              <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                {formatCurrency(command.total)}
                              </Text>
                            </View>
                          ) : (
                            <Text className="pt-2 text-xs text-zinc-600 dark:text-zinc-300">
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
      </ScrollView>

      <View className="p-6 pt-2">
        <Button label="Voltar ao dashboard" variant="ghost" onPress={() => router.replace('../dashboard')} />
      </View>
    </View>
  );
}
