import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useClients } from '@/hooks/clients/useClients';

const clientsRoutes = {
  newClient: '/nail-technician/clients/new',
} as const satisfies Record<string, Href>;

const getClientDetailsRoute = (clientId: string): Href => ({
  pathname: '/nail-technician/clients/[clientId]',
  params: { clientId },
});

export default function ClientsListScreen() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const clientsQuery = useClients({
    searchTerm,
    limitCount: 100,
  });

  const clients = useMemo(() => clientsQuery.data ?? [], [clientsQuery.data]);

  return (
    <View className="flex-1 bg-zinc-50 p-6 dark:bg-zinc-950">
      <View className="gap-3 pb-4 pt-10">
        <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Clientes</Text>
        <Text className="text-base text-zinc-600 dark:text-zinc-300">
          Gerencie os clientes do salão e acompanhe contatos de forma centralizada.
        </Text>
        <Input
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Buscar por nome"
          autoCapitalize="words"
          returnKeyType="search"
        />
        <Button label="Cadastrar novo cliente" onPress={() => router.push(clientsRoutes.newClient)} />
      </View>

      {clientsQuery.isLoading ? (
        <Card>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando clientes...</Text>
        </Card>
      ) : null}

      {clientsQuery.error ? (
        <Card>
          <Text className="text-sm text-error">
            {clientsQuery.error instanceof Error ? clientsQuery.error.message : 'Falha ao carregar clientes.'}
          </Text>
        </Card>
      ) : null}

      {!clientsQuery.isLoading && !clientsQuery.error && clients.length === 0 ? (
        <Card>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            Nenhum cliente encontrado para o filtro informado.
          </Text>
        </Card>
      ) : null}

      {!clientsQuery.isLoading && !clientsQuery.error && clients.length > 0 ? (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(getClientDetailsRoute(item.id))}>
              <Card className="gap-2">
                <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</Text>
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">{item.phone}</Text>
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">
                  {item.email ? item.email : 'E-mail não informado'}
                </Text>
              </Card>
            </Pressable>
          )}
        />
      ) : null}
    </View>
  );
}
