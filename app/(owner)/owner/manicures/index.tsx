import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { endOfDay, startOfDay } from 'date-fns';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppointments } from '@/hooks/appointments/useAppointments';
import { useCommands } from '@/hooks/commands/useCommands';
import { useManicures } from '@/hooks/users/useManicures';
import { formatCurrency } from '@/components/features/commands/commandFormatters';

const ownerDashboardRoute = '/owner/dashboard' satisfies Href;

export default function OwnerManicuresListScreen() {
  const router = useRouter();

  const manicuresQuery = useManicures({ limitCount: 60 });
  const appointmentsTodayQuery = useAppointments({
    start: startOfDay(new Date()),
    end: endOfDay(new Date()),
    limitCount: 300,
  });
  const commandsQuery = useCommands({ limitCount: 300 });

  const appointmentsByManicure = useMemo(() => {
    const entries = new Map<string, number>();
    for (const appointment of appointmentsTodayQuery.data ?? []) {
      const currentValue = entries.get(appointment.manicureId) ?? 0;
      entries.set(appointment.manicureId, currentValue + 1);
    }
    return entries;
  }, [appointmentsTodayQuery.data]);

  const openCommandsByManicure = useMemo(() => {
    const entries = new Map<string, number>();
    for (const command of commandsQuery.data ?? []) {
      if (command.status !== 'open') {
        continue;
      }

      const currentValue = entries.get(command.manicureId) ?? 0;
      entries.set(command.manicureId, currentValue + 1);
    }
    return entries;
  }, [commandsQuery.data]);

  const closedRevenueByManicure = useMemo(() => {
    const entries = new Map<string, number>();
    for (const command of commandsQuery.data ?? []) {
      if (command.status !== 'closed') {
        continue;
      }

      const currentValue = entries.get(command.manicureId) ?? 0;
      entries.set(command.manicureId, currentValue + command.total);
    }
    return entries;
  }, [commandsQuery.data]);

  const isLoading = manicuresQuery.isLoading || appointmentsTodayQuery.isLoading || commandsQuery.isLoading;
  const error = manicuresQuery.error ?? appointmentsTodayQuery.error ?? commandsQuery.error ?? null;

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <ScrollView className="flex-1" contentContainerClassName="p-6 pb-10 pt-10">
        <View className="gap-2 pb-5">
          <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Manicures</Text>
          <Text className="text-base text-zinc-600 dark:text-zinc-300">
            Acompanhe indicadores operacionais e financeiros por profissional.
          </Text>
        </View>

        {isLoading ? (
          <Card>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando equipe...</Text>
          </Card>
        ) : null}

        {error ? (
          <Card>
            <Text className="text-sm text-error">{error instanceof Error ? error.message : 'Falha ao carregar.'}</Text>
          </Card>
        ) : null}

        {!isLoading && !error && (manicuresQuery.data ?? []).length === 0 ? (
          <Card>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">Nenhuma manicure cadastrada.</Text>
          </Card>
        ) : null}

        {!isLoading && !error && (manicuresQuery.data ?? []).length > 0 ? (
          <View className="gap-3">
            {(manicuresQuery.data ?? []).map((manicure) => (
              <Card key={manicure.uid} className="gap-2">
                <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{manicure.displayName}</Text>
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">{manicure.email}</Text>
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">
                  Agenda hoje: {appointmentsByManicure.get(manicure.uid) ?? 0} atendimento(s)
                </Text>
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">
                  Comandas abertas: {openCommandsByManicure.get(manicure.uid) ?? 0}
                </Text>
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">
                  Faturamento em comandas fechadas: {formatCurrency(closedRevenueByManicure.get(manicure.uid) ?? 0)}
                </Text>
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">
                  Google Calendar: {manicure.googleCalendarConnected ? 'Conectado' : 'Nao conectado'}
                </Text>
              </Card>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View className="p-6 pt-2">
        <Button label="Voltar ao dashboard" variant="ghost" onPress={() => router.replace(ownerDashboardRoute)} />
      </View>
    </View>
  );
}
