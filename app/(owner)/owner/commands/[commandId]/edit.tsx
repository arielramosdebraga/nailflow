import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDays, endOfDay, startOfDay, subDays } from 'date-fns';

import { CommandForm } from '@/components/features/commands/CommandForm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppointments } from '@/hooks/appointments/useAppointments';
import { useClients } from '@/hooks/clients/useClients';
import { useCommand } from '@/hooks/commands/useCommand';
import { useUpdateCommandMutation } from '@/hooks/commands/useCommandMutations';
import { useManicures } from '@/hooks/users/useManicures';
import { type UpsertCommandInput } from '@/schemas/commands/command.schema';

export default function OwnerEditCommandScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ commandId?: string }>();
  const commandId = params.commandId;

  const commandQuery = useCommand(commandId);
  const updateCommandMutation = useUpdateCommandMutation();

  const appointmentsQuery = useAppointments({
    start: startOfDay(subDays(new Date(), 30)),
    end: endOfDay(addDays(new Date(), 7)),
    statuses: ['scheduled', 'confirmed', 'completed'],
    limitCount: 200,
  });
  const clientsQuery = useClients({ limitCount: 250 });
  const manicuresQuery = useManicures({ limitCount: 60 });

  async function handleSubmit(data: Omit<UpsertCommandInput, 'salonId'>) {
    if (!commandId) {
      throw new Error('ID da comanda invalido.');
    }

    await updateCommandMutation.mutateAsync({
      commandId,
      data,
    });

    router.replace('../');
  }

  if (commandQuery.isLoading || appointmentsQuery.isLoading || clientsQuery.isLoading || manicuresQuery.isLoading) {
    return (
      <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
        <Card>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando dados da comanda...</Text>
        </Card>
      </View>
    );
  }

  const error = commandQuery.error ?? appointmentsQuery.error ?? clientsQuery.error ?? manicuresQuery.error ?? null;
  if (error || !commandQuery.data) {
    return (
      <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
        <Card>
          <Text className="text-sm text-error">
            {error instanceof Error ? error.message : 'Falha ao carregar comanda.'}
          </Text>
        </Card>
        <View className="pt-4">
          <Button label="Voltar" variant="ghost" onPress={() => router.replace('../../')} />
        </View>
      </View>
    );
  }

  return (
    <CommandForm
      title="Editar comanda"
      description="Atualize os itens, profissional e status da comanda."
      submitLabel="Salvar alteracoes"
      isSubmitting={updateCommandMutation.isPending}
      appointments={appointmentsQuery.data ?? []}
      clients={clientsQuery.data ?? []}
      manicures={manicuresQuery.data ?? []}
      initialCommand={commandQuery.data}
      onSubmit={handleSubmit}
      onCancel={() => router.replace('../')}
    />
  );
}
