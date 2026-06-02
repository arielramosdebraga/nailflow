import { useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useSalons } from '@/hooks/salons/useSalons';

export default function AdminSalonsScreen() {
  const router = useRouter();
  const salonsQuery = useSalons({ limitCount: 250 });
  const salons = useMemo(() => salonsQuery.data ?? [], [salonsQuery.data]);

  return (
    <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
      <View className="gap-2 pb-4">
        <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Salões</Text>
        <Text className="text-base text-zinc-600 dark:text-zinc-300">
          Visão global dos salões cadastrados no ecossistema NailFlow.
        </Text>
      </View>

      {salonsQuery.isLoading ? (
        <Card>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando salões...</Text>
        </Card>
      ) : null}

      {salonsQuery.error ? (
        <Card>
          <Text className="text-sm text-error">
            {salonsQuery.error instanceof Error ? salonsQuery.error.message : 'Falha ao carregar salões.'}
          </Text>
        </Card>
      ) : null}

      {!salonsQuery.isLoading && !salonsQuery.error && salons.length === 0 ? (
        <Card>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Nenhum salão encontrado.</Text>
        </Card>
      ) : null}

      {!salonsQuery.isLoading && !salonsQuery.error && salons.length > 0 ? (
        <FlatList
          data={salons}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <Card className="gap-1">
              <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</Text>
              <Text className="text-xs text-zinc-600 dark:text-zinc-300">ID: {item.id}</Text>
              <Text className="text-xs text-zinc-600 dark:text-zinc-300">
                Owner: {item.ownerId ?? 'Nao vinculado'}
              </Text>
              <Text className="text-xs text-zinc-600 dark:text-zinc-300">
                Timezone: {item.timezone} • Moeda: {item.currency}
              </Text>
              <Text className="text-xs text-zinc-600 dark:text-zinc-300">
                Status: {item.active ? 'Ativo' : 'Inativo'}
              </Text>
            </Card>
          )}
        />
      ) : null}

      <View className="pt-2">
        <Button label="Voltar ao painel" variant="ghost" onPress={() => router.replace('../dashboard')} />
      </View>
    </View>
  );
}
