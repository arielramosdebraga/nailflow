import { Alert, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';

import { OperationalScreenShell } from '@/components/features/shared';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useClient } from '@/hooks/clients/useClient';
import { useDeleteClientMutation } from '@/hooks/clients/useClientMutations';

const clientsListRoute = '/nail-technician/clients' satisfies Href;

const getClientEditRoute = (clientId: string): Href => ({
  pathname: '/nail-technician/clients/[clientId]/edit',
  params: { clientId },
});

export default function ClientDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ clientId?: string }>();
  const clientId = params.clientId;
  const clientQuery = useClient(clientId);
  const deleteClientMutation = useDeleteClientMutation();

  function handleDelete() {
    if (!clientId) {
      return;
    }

    Alert.alert('Excluir cliente', 'Tem certeza que deseja excluir este cliente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteClientMutation.mutateAsync(clientId);
            router.replace(clientsListRoute);
          } catch (error) {
            Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao excluir cliente.');
          }
        },
      },
    ]);
  }

  if (clientQuery.isLoading) {
    return (
      <OperationalScreenShell
        title="Cliente"
        subtitle="Carregando os dados completos da cliente."
        onBackPress={() => router.replace(clientsListRoute)}
        backLabel="Voltar para clientes"
        contentContainerClassName="pb-10"
      >
        <Card className="border-white/10 bg-white/5">
          <Text className="text-sm text-zinc-300">Carregando cliente...</Text>
        </Card>
      </OperationalScreenShell>
    );
  }

  if (clientQuery.error) {
    return (
      <OperationalScreenShell
        title="Cliente"
        subtitle="Não foi possível carregar os dados desta cliente."
        onBackPress={() => router.replace(clientsListRoute)}
        backLabel="Voltar para clientes"
        contentContainerClassName="pb-10"
      >
        <Card className="border-white/10 bg-white/5">
          <Text className="text-sm text-error">
            {clientQuery.error instanceof Error ? clientQuery.error.message : 'Falha ao carregar cliente.'}
          </Text>
        </Card>
      </OperationalScreenShell>
    );
  }

  const client = clientQuery.data;
  if (!client) {
    return (
      <OperationalScreenShell
        title="Cliente"
        subtitle="Este cadastro não foi encontrado na sua base operacional."
        onBackPress={() => router.replace(clientsListRoute)}
        backLabel="Voltar para clientes"
        contentContainerClassName="pb-10"
      >
        <Card className="border-white/10 bg-white/5">
          <Text className="text-sm text-zinc-300">Cliente não encontrada.</Text>
        </Card>
      </OperationalScreenShell>
    );
  }

  return (
    <OperationalScreenShell
      title={client.name}
      subtitle="Consulte os dados de contato, histórico textual e ações rápidas desta cliente."
      onBackPress={() => router.replace(clientsListRoute)}
      backLabel="Voltar para clientes"
      contentContainerClassName="pb-10"
      topSlot={
        <Card className="gap-4 border-white/10 bg-white/5">
          <View className="flex-row items-center gap-4">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/15">
              <Text className="text-2xl font-black text-primary">{client.name.slice(0, 1).toUpperCase()}</Text>
            </View>
            <View className="flex-1 gap-1">
              <Text className="text-lg font-semibold text-zinc-50">{client.phone}</Text>
              <Text className="text-sm text-zinc-300">
                {client.email ? client.email : 'E-mail não informado'}
              </Text>
            </View>
          </View>
        </Card>
      }
    >
      <View className="gap-4">
        <Card className="gap-2 border-white/10 bg-white/5">
          <Text className="text-sm font-semibold text-zinc-100">Tags</Text>
          <Text className="text-sm leading-6 text-zinc-300">
            {client.tags.length > 0 ? client.tags.join(', ') : 'Sem tags cadastradas'}
          </Text>
        </Card>

        <Card className="gap-2 border-white/10 bg-white/5">
          <Text className="text-sm font-semibold text-zinc-100">Observações</Text>
          <Text className="text-sm leading-6 text-zinc-300">
            {client.notes ? client.notes : 'Sem observações cadastradas'}
          </Text>
        </Card>

        <View className="gap-3">
          <Button
            label="Editar cliente"
            className="rounded-2xl"
            onPress={() => router.push(getClientEditRoute(client.id))}
          />
          <Button
            label={deleteClientMutation.isPending ? 'Excluindo...' : 'Excluir cliente'}
            variant="danger"
            className="rounded-2xl"
            onPress={handleDelete}
            disabled={deleteClientMutation.isPending}
          />
          <Button
            label="Voltar para clientes"
            variant="secondary"
            className="rounded-2xl"
            onPress={() => router.replace(clientsListRoute)}
            disabled={deleteClientMutation.isPending}
          />
        </View>
      </View>
    </OperationalScreenShell>
  );
}
