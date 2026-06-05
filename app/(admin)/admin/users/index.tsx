import { useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { useAdminUsers } from '@/hooks/users';

const roleLabels: Record<string, string> = {
  super_admin: 'Superadministrador',
  salon_owner: 'Dono de salao',
  nail_technician: 'Profissional',
};
const adminDashboardRoute = '/admin/dashboard' satisfies Href;

export default function AdminUsersScreen() {
  const router = useRouter();
  const usersQuery = useAdminUsers({ limitCount: 300 });
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  return (
    <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
      <View className="gap-2 pb-4">
        <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Usuarios</Text>
        <Text className="text-base text-zinc-600 dark:text-zinc-300">
          Visao administrativa dos perfis e papeis cadastrados no ecossistema NailFlow.
        </Text>
      </View>

      {usersQuery.isLoading ? (
        <Card>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando usuarios...</Text>
        </Card>
      ) : null}

      {usersQuery.error ? (
        <Card>
          <Text className="text-sm text-error">
            {usersQuery.error instanceof Error ? usersQuery.error.message : 'Falha ao carregar usuarios.'}
          </Text>
        </Card>
      ) : null}

      {!usersQuery.isLoading && !usersQuery.error && users.length === 0 ? (
        <Card>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Nenhum usuario encontrado.</Text>
        </Card>
      ) : null}

      {!usersQuery.isLoading && !usersQuery.error && users.length > 0 ? (
        <FlatList
          data={users}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <Card className="gap-2">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1 gap-1">
                  <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.displayName}</Text>
                  <Text className="text-xs text-zinc-600 dark:text-zinc-300">{item.email}</Text>
                </View>
                <Tag label={roleLabels[item.role] ?? item.role} />
              </View>

              <Text className="text-xs text-zinc-600 dark:text-zinc-300">UID: {item.uid}</Text>
              <Text className="text-xs text-zinc-600 dark:text-zinc-300">
                Salao: {item.salonId ?? 'Sem vinculacao'}
              </Text>
              <Text className="text-xs text-zinc-600 dark:text-zinc-300">
                Status: {item.active ? 'Ativo' : 'Inativo'}
              </Text>
              <Text className="text-xs text-zinc-600 dark:text-zinc-300">
                Criado em: {item.createdAt ? item.createdAt.toLocaleString('pt-BR') : 'Nao informado'}
              </Text>
            </Card>
          )}
        />
      ) : null}

      <View className="pt-2">
        <Button label="Voltar ao painel" variant="ghost" onPress={() => router.replace(adminDashboardRoute)} />
      </View>
    </View>
  );
}
