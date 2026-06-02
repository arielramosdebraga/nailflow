import { Alert, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useClient } from '@/hooks/clients/useClient';
import { useDeleteClientMutation } from '@/hooks/clients/useClientMutations';

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
            router.replace('../');
          } catch (error) {
            Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao excluir cliente.');
          }
        },
      },
    ]);
  }

  if (clientQuery.isLoading) {
    return (
      <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
        <Card>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando cliente...</Text>
        </Card>
      </View>
    );
  }

  if (clientQuery.error) {
    return (
      <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
        <Card>
          <Text className="text-sm text-error">
            {clientQuery.error instanceof Error ? clientQuery.error.message : 'Falha ao carregar cliente.'}
          </Text>
        </Card>
        <View className="pt-4">
          <Button label="Voltar" variant="ghost" onPress={() => router.replace('../')} />
        </View>
      </View>
    );
  }

  const client = clientQuery.data;
  if (!client) {
    return (
      <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
        <Card>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Cliente nao encontrado.</Text>
        </Card>
        <View className="pt-4">
          <Button label="Voltar" variant="ghost" onPress={() => router.replace('../')} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-between bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
      <View className="gap-4">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{client.name}</Text>
          <Text className="text-base text-zinc-600 dark:text-zinc-300">{client.phone}</Text>
          <Text className="text-base text-zinc-600 dark:text-zinc-300">
            {client.email ? client.email : 'E-mail nao informado'}
          </Text>
        </View>

        <Card className="gap-2">
          <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Tags</Text>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            {client.tags.length > 0 ? client.tags.join(', ') : 'Sem tags cadastradas'}
          </Text>
        </Card>

        <Card className="gap-2">
          <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Observacoes</Text>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            {client.notes ? client.notes : 'Sem observacoes cadastradas'}
          </Text>
        </Card>
      </View>

      <View className="gap-2">
        <Button label="Editar cliente" onPress={() => router.push('./edit')} />
        <Button
          label={deleteClientMutation.isPending ? 'Excluindo...' : 'Excluir cliente'}
          variant="danger"
          onPress={handleDelete}
          disabled={deleteClientMutation.isPending}
        />
        <Button label="Voltar para lista" variant="ghost" onPress={() => router.replace('../')} />
      </View>
    </View>
  );
}
