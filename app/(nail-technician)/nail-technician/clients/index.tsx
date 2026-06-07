import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Bell, CalendarDays, Search, Settings2, UsersRound } from 'lucide-react-native';

import { OperationalBottomNav, OperationalScreenShell } from '@/components/features/shared';
import { NotificationsBellButton } from '@/components/features/notifications';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useClients } from '@/hooks/clients/useClients';
import { useUnreadNotificationsCount } from '@/hooks/notifications';

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
  const unreadNotifications = useUnreadNotificationsCount();
  const clientsQuery = useClients({
    searchTerm,
    limitCount: 100,
  });

  const clients = useMemo(() => clientsQuery.data ?? [], [clientsQuery.data]);

  return (
    <OperationalScreenShell
      title="Clientes"
      subtitle="Consulte sua base de atendimento e acesse rapidamente os detalhes de cada cliente."
      headerAccessory={
        <NotificationsBellButton
          unreadCount={unreadNotifications.unreadCount}
          onPress={() => router.push('/nail-technician/notifications')}
        />
      }
      footer={
        <OperationalBottomNav
          items={[
            {
              key: 'agenda',
              label: 'Agenda',
              icon: CalendarDays,
              onPress: () => router.push('/nail-technician/agenda'),
            },
            {
              key: 'clients',
              label: 'Clientes',
              icon: UsersRound,
              active: true,
              onPress: () => router.replace('/nail-technician/clients'),
            },
            {
              key: 'notifications',
              label: 'Alertas',
              icon: Bell,
              onPress: () => router.push('/nail-technician/notifications'),
            },
            {
              key: 'google',
              label: 'Google',
              icon: Settings2,
              onPress: () => router.push('/nail-technician/google-calendar'),
            },
          ]}
        />
      }
    >
      <View className="gap-3">
        <Input
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Buscar por nome"
          autoCapitalize="words"
          returnKeyType="search"
          inputWrapperClassName="rounded-2xl border-white/10 bg-white/5"
          leftAdornment={<Search size={18} color="#a1a1aa" />}
        />
        <Button
          label="Cadastrar novo cliente"
          className="h-12 rounded-2xl"
          onPress={() => router.push(clientsRoutes.newClient)}
        />

        {clientsQuery.isLoading ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-zinc-300">Carregando clientes...</Text>
          </Card>
        ) : null}

        {clientsQuery.error ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-error">
              {clientsQuery.error instanceof Error ? clientsQuery.error.message : 'Falha ao carregar clientes.'}
            </Text>
          </Card>
        ) : null}

        {!clientsQuery.isLoading && !clientsQuery.error && clients.length === 0 ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-zinc-300">
              Nenhum cliente encontrado para o filtro informado.
            </Text>
          </Card>
        ) : null}

        {!clientsQuery.isLoading && !clientsQuery.error && clients.length > 0 ? (
          <View className="gap-3">
            {clients.map((item) => (
              <Pressable key={item.id} onPress={() => router.push(getClientDetailsRoute(item.id))}>
                <Card className="gap-3 rounded-[20px] border-white/10 bg-white/5">
                  <View className="flex-row items-center gap-3">
                    <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                      <Text className="text-base font-black text-primary">
                        {item.name.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1 gap-1">
                      <Text className="text-base font-semibold text-zinc-50">{item.name}</Text>
                      <Text className="text-sm text-zinc-300">{item.phone}</Text>
                    </View>
                  </View>
                  <Text className="text-sm text-zinc-300">
                    {item.email ? item.email : 'E-mail não informado'}
                  </Text>
                  <Text className="text-xs text-zinc-500">
                    {item.lastVisit
                      ? `Último atendimento em ${item.lastVisit.toLocaleDateString('pt-BR')}`
                      : 'Sem atendimento recente registrado'}
                  </Text>
                </Card>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </OperationalScreenShell>
  );
}
