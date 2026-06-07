import { Alert, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppointment } from '@/hooks/appointments/useAppointment';
import { useClient } from '@/hooks/clients/useClient';
import { useCommand } from '@/hooks/commands/useCommand';
import { useUpdateCommandMutation } from '@/hooks/commands/useCommandMutations';
import { useManicures } from '@/hooks/users/useManicures';
import { type CommandPaymentMethod } from '@/schemas/commands/command.schema';
import {
  formatCommandPaymentMethod,
  formatCommandStatus,
  formatCurrency,
  formatDateTime,
} from '@/components/features/commands/commandFormatters';

const commandsListRoute = '/owner/commands' satisfies Href;

const getOwnerCommandEditRoute = (commandId: string): Href => ({
  pathname: '/owner/commands/[commandId]/edit',
  params: { commandId },
});

export default function OwnerCommandDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ commandId?: string }>();
  const commandId = params.commandId;

  const commandQuery = useCommand(commandId);
  const command = commandQuery.data;

  const clientQuery = useClient(command?.clientId);
  const appointmentQuery = useAppointment(command?.appointmentId);
  const manicuresQuery = useManicures({ limitCount: 50 });
  const updateCommandMutation = useUpdateCommandMutation();

  const manicure = (manicuresQuery.data ?? []).find((item) => item.uid === command?.manicureId) ?? null;

  async function closeCommand(paymentMethod: CommandPaymentMethod) {
    if (!command) {
      return;
    }

    try {
      await updateCommandMutation.mutateAsync({
        commandId: command.id,
        data: {
          appointmentId: command.appointmentId,
          clientId: command.clientId,
          manicureId: command.manicureId,
          items: command.items,
          paymentMethod,
          status: 'closed',
          closedAt: new Date(),
        },
      });
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao fechar comanda.');
    }
  }

  function handleCloseCommand() {
    Alert.alert('Fechar comanda', 'Selecione a forma de pagamento.', [
      { text: 'Dinheiro', onPress: () => void closeCommand('cash') },
      { text: 'Pix', onPress: () => void closeCommand('pix') },
      { text: 'Crédito', onPress: () => void closeCommand('credit') },
      { text: 'Débito', onPress: () => void closeCommand('debit') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  if (commandQuery.isLoading || manicuresQuery.isLoading || clientQuery.isLoading || appointmentQuery.isLoading) {
    return (
      <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
        <Card>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando comanda...</Text>
        </Card>
      </View>
    );
  }

  const error = commandQuery.error ?? clientQuery.error ?? appointmentQuery.error ?? manicuresQuery.error ?? null;
  if (error) {
    return (
      <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
        <Card>
          <Text className="text-sm text-error">
            {error instanceof Error ? error.message : 'Falha ao carregar comanda.'}
          </Text>
        </Card>
        <View className="pt-4">
          <Button label="Voltar para a lista" variant="ghost" onPress={() => router.replace(commandsListRoute)} />
        </View>
      </View>
    );
  }

  if (!command) {
    return (
      <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
        <Card>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Comanda não encontrada.</Text>
        </Card>
        <View className="pt-4">
          <Button label="Voltar para a lista" variant="ghost" onPress={() => router.replace(commandsListRoute)} />
        </View>
      </View>
    );
  }

  const clientName = clientQuery.data?.name ?? command.clientId;
  const appointment = appointmentQuery.data;

  return (
    <View className="flex-1 justify-between bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
      <View className="gap-4">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{clientName}</Text>
          <Text className="text-base text-zinc-600 dark:text-zinc-300">Comanda #{command.id}</Text>
        </View>

        <Card className="gap-2">
          <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Resumo</Text>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            Status: {formatCommandStatus(command.status)}
          </Text>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            Pagamento: {formatCommandPaymentMethod(command.paymentMethod)}
          </Text>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            Criada em: {formatDateTime(command.createdAt)}
          </Text>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            Fechada em: {formatDateTime(command.closedAt)}
          </Text>
        </Card>

        <Card className="gap-2">
          <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Atendimento</Text>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            Horário: {appointment ? formatDateTime(appointment.startTime) : 'Não encontrado'}
          </Text>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            Profissional: {manicure?.displayName ?? command.manicureId}
          </Text>
        </Card>

        <Card className="gap-2">
          <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Itens</Text>
          <View className="gap-2">
            {command.items.map((item, index) => {
              const lineTotal = item.price * item.quantity;
              return (
                <View key={`${item.service}-${index}`} className="rounded-xl bg-zinc-100 p-3 dark:bg-zinc-800">
                  <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.service}</Text>
                  <Text className="text-sm text-zinc-600 dark:text-zinc-300">
                    {item.quantity}x {formatCurrency(item.price)} = {formatCurrency(lineTotal)}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Total: {formatCurrency(command.total)}
          </Text>
        </Card>
      </View>

      <View className="gap-2 pt-4">
        <Button label="Editar comanda" onPress={() => router.push(getOwnerCommandEditRoute(command.id))} />

        {command.status === 'open' ? (
          <Button
            label={updateCommandMutation.isPending ? 'Fechando...' : 'Fechar comanda'}
            variant="secondary"
            accessibilityHint="Abre as opções de forma de pagamento para fechar a comanda."
            onPress={handleCloseCommand}
            disabled={updateCommandMutation.isPending}
          />
        ) : null}

        <Button label="Voltar para a lista" variant="ghost" onPress={() => router.replace(commandsListRoute)} />
      </View>
    </View>
  );
}
