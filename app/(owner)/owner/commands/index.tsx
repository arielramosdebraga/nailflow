import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { addDays, endOfDay, startOfDay, subDays } from 'date-fns';

import { CommandCard } from '@/components/features/commands/CommandCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAppointments } from '@/hooks/appointments/useAppointments';
import { useClients } from '@/hooks/clients/useClients';
import { useCommands } from '@/hooks/commands/useCommands';
import { useManicures } from '@/hooks/users/useManicures';
import { type CommandStatus } from '@/schemas/commands/command.schema';

type StatusFilter = 'all' | CommandStatus;

const ownerCommandRoutes = {
  newCommand: '/owner/commands/new',
} as const satisfies Record<string, Href>;

const getOwnerCommandDetailsRoute = (commandId: string): Href => ({
  pathname: '/owner/commands/[commandId]',
  params: { commandId },
});

export default function OwnerCommandsListScreen() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const commandsQuery = useCommands({
    status: statusFilter === 'all' ? undefined : statusFilter,
    limitCount: 200,
  });
  const clientsQuery = useClients({ limitCount: 200 });
  const manicuresQuery = useManicures({ limitCount: 50 });
  const appointmentsQuery = useAppointments({
    start: startOfDay(subDays(new Date(), 30)),
    end: endOfDay(addDays(new Date(), 1)),
    limitCount: 400,
  });

  const clientsById = useMemo(() => {
    const entries = (clientsQuery.data ?? []).map((client) => [client.id, client] as const);
    return new Map(entries);
  }, [clientsQuery.data]);

  const manicureById = useMemo(() => {
    const entries = (manicuresQuery.data ?? []).map((manicure) => [manicure.uid, manicure] as const);
    return new Map(entries);
  }, [manicuresQuery.data]);

  const appointmentById = useMemo(() => {
    const entries = (appointmentsQuery.data ?? []).map((appointment) => [appointment.id, appointment] as const);
    return new Map(entries);
  }, [appointmentsQuery.data]);

  const commands = useMemo(() => {
    const baseList = commandsQuery.data ?? [];
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return baseList;
    }

    return baseList.filter((command) => {
      const clientName = clientsById.get(command.clientId)?.name ?? '';
      const manicureName = manicureById.get(command.manicureId)?.displayName ?? '';
      return (
        command.id.toLowerCase().includes(normalizedSearch) ||
        clientName.toLowerCase().includes(normalizedSearch) ||
        manicureName.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [clientsById, commandsQuery.data, manicureById, searchTerm]);

  const isLoading =
    commandsQuery.isLoading || clientsQuery.isLoading || manicuresQuery.isLoading || appointmentsQuery.isLoading;
  const error = commandsQuery.error ?? clientsQuery.error ?? manicuresQuery.error ?? appointmentsQuery.error ?? null;

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <ScrollView className="flex-1" contentContainerClassName="p-6 pb-10 pt-10">
        <View className="gap-3 pb-4">
          <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Comandas</Text>
          <Text className="text-base text-zinc-600 dark:text-zinc-300">
            Consulte, abra, edite e feche comandas da operacao do salao.
          </Text>

          <Input
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Buscar por cliente, profissional ou ID"
            returnKeyType="search"
          />

          <View className="flex-row flex-wrap gap-2">
            <Button
              label="Todas"
              fullWidth={false}
              variant={statusFilter === 'all' ? 'primary' : 'ghost'}
              onPress={() => setStatusFilter('all')}
            />
            <Button
              label="Abertas"
              fullWidth={false}
              variant={statusFilter === 'open' ? 'primary' : 'ghost'}
              onPress={() => setStatusFilter('open')}
            />
            <Button
              label="Fechadas"
              fullWidth={false}
              variant={statusFilter === 'closed' ? 'primary' : 'ghost'}
              onPress={() => setStatusFilter('closed')}
            />
          </View>

          <Button label="Abrir nova comanda" onPress={() => router.push(ownerCommandRoutes.newCommand)} />
        </View>

        {isLoading ? (
          <Card>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando comandas...</Text>
          </Card>
        ) : null}

        {error ? (
          <Card>
            <Text className="text-sm text-error">{error instanceof Error ? error.message : 'Falha ao carregar.'}</Text>
          </Card>
        ) : null}

        {!isLoading && !error && commands.length === 0 ? (
          <Card>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">
              Nenhuma comanda encontrada para os filtros informados.
            </Text>
          </Card>
        ) : null}

        {!isLoading && !error && commands.length > 0 ? (
          <View className="gap-3">
            {commands.map((command) => {
              const appointment = appointmentById.get(command.appointmentId);
              return (
                <CommandCard
                  key={command.id}
                  command={command}
                  clientName={clientsById.get(command.clientId)?.name}
                  manicureName={manicureById.get(command.manicureId)?.displayName}
                  appointmentStartTime={appointment?.startTime ?? null}
                  onPress={() => router.push(getOwnerCommandDetailsRoute(command.id))}
                />
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
