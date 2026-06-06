import { Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { addDays, endOfDay, startOfDay, subDays } from 'date-fns';

import { CommandForm } from '@/components/features/commands/CommandForm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppointments } from '@/hooks/appointments/useAppointments';
import { useClients } from '@/hooks/clients/useClients';
import { useCreateCommandMutation } from '@/hooks/commands/useCommandMutations';
import { useManicures } from '@/hooks/users/useManicures';
import { type UpsertCommandInput } from '@/schemas/commands/command.schema';

const commandsListRoute = '/owner/commands' satisfies Href;

const getOwnerCommandDetailsRoute = (commandId: string): Href => ({
  pathname: '/owner/commands/[commandId]',
  params: { commandId },
});

export default function OwnerNewCommandScreen() {
  const router = useRouter();

  const createCommandMutation = useCreateCommandMutation();
  const appointmentsQuery = useAppointments({
    start: startOfDay(subDays(new Date(), 15)),
    end: endOfDay(addDays(new Date(), 7)),
    statuses: ['scheduled', 'confirmed', 'completed'],
    limitCount: 150,
  });
  const clientsQuery = useClients({ limitCount: 200 });
  const manicuresQuery = useManicures({ limitCount: 50 });

  async function handleSubmit(data: Omit<UpsertCommandInput, 'salonId'>) {
    const commandId = await createCommandMutation.mutateAsync(data);
    router.replace(getOwnerCommandDetailsRoute(commandId));
  }

  if (appointmentsQuery.isLoading || clientsQuery.isLoading || manicuresQuery.isLoading) {
    return (
      <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
        <Card>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando dados da nova comanda...</Text>
        </Card>
      </View>
    );
  }

  const error = appointmentsQuery.error ?? clientsQuery.error ?? manicuresQuery.error ?? null;
  if (error) {
    return (
      <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
        <Card>
          <Text className="text-sm text-error">
            {error instanceof Error ? error.message : 'Falha ao carregar os dados da comanda.'}
          </Text>
        </Card>
        <View className="pt-4">
          <Button
            label="Voltar para a lista"
            variant="ghost"
            onPress={() => router.replace(commandsListRoute)}
          />
        </View>
      </View>
    );
  }

  return (
    <CommandForm
      title="Nova comanda"
      description="Abra uma comanda vinculando atendimento, cliente e profissional."
      submitLabel="Salvar comanda"
      isSubmitting={createCommandMutation.isPending}
      appointments={appointmentsQuery.data ?? []}
      clients={clientsQuery.data ?? []}
      manicures={manicuresQuery.data ?? []}
      onSubmit={handleSubmit}
      onCancel={() => router.replace(commandsListRoute)}
    />
  );
}
