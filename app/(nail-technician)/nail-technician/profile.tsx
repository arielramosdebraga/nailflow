import { ScrollView, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useCurrentSalon } from '@/hooks/salons/useCurrentSalon';
import { useCurrentUserProfile } from '@/hooks/users/useCurrentUserProfile';

const routes = {
  agenda: '/nail-technician/agenda',
  notificationsSettings: '/nail-technician/notifications/settings',
  googleCalendar: '/nail-technician/google-calendar',
  reports: '/nail-technician/reports',
} as const satisfies Record<string, Href>;

function getRoleLabel(role: string) {
  if (role === 'super_admin') {
    return 'Super admin';
  }

  if (role === 'salon_owner') {
    return 'Dona do salão';
  }

  return 'Profissional';
}

export default function NailTechnicianProfileScreen() {
  const router = useRouter();
  const profileQuery = useCurrentUserProfile();
  const salonQuery = useCurrentSalon();

  const profile = profileQuery.data;
  const initials = profile?.displayName
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <ScrollView className="flex-1" contentContainerClassName="gap-4 p-6 pb-10 pt-10">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Perfil</Text>
          <Text className="text-base text-zinc-600 dark:text-zinc-300">
            Consulte seus dados de acesso, o vínculo com o salão e os atalhos operacionais da conta.
          </Text>
        </View>

        {profileQuery.isLoading ? (
          <Card>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando perfil...</Text>
          </Card>
        ) : null}

        {profileQuery.error ? (
          <Card>
            <Text className="text-sm text-error">
              {profileQuery.error instanceof Error ? profileQuery.error.message : 'Falha ao carregar o perfil.'}
            </Text>
          </Card>
        ) : null}

        {profile ? (
          <>
            <Card className="gap-4">
              <View className="flex-row items-center gap-4">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Text className="text-xl font-bold text-primary">{initials || 'NF'}</Text>
                </View>
                <View className="flex-1 gap-1">
                  <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{profile.displayName}</Text>
                  <Text className="text-sm text-zinc-600 dark:text-zinc-300">{profile.email}</Text>
                  <Text className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {getRoleLabel(profile.role)}
                  </Text>
                </View>
              </View>
            </Card>

            <Card className="gap-3">
              <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Dados da conta</Text>
              <View className="gap-2">
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="text-sm text-zinc-600 dark:text-zinc-300">Telefone</Text>
                  <Text className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {profile.phone ?? 'Não informado'}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="text-sm text-zinc-600 dark:text-zinc-300">Google Agenda</Text>
                  <Text className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {profile.googleCalendarConnected ? 'Conectada' : 'Pendente'}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="text-sm text-zinc-600 dark:text-zinc-300">Salão</Text>
                  <Text className="text-right text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {salonQuery.data?.name ?? profile.salonId ?? 'Sem vínculo'}
                  </Text>
                </View>
              </View>
            </Card>

            <Card className="gap-3">
              <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Atalhos</Text>
              <View className="gap-2">
                <Button
                  label="Configurações de notificação"
                  variant="secondary"
                  onPress={() => router.push(routes.notificationsSettings)}
                />
                <Button
                  label="Gerenciar Google Agenda"
                  variant="ghost"
                  onPress={() => router.push(routes.googleCalendar)}
                />
                <Button label="Ver relatórios" variant="ghost" onPress={() => router.push(routes.reports)} />
              </View>
            </Card>
          </>
        ) : null}
      </ScrollView>

      <View className="p-6 pt-2">
        <Button label="Voltar para a agenda" variant="ghost" onPress={() => router.replace(routes.agenda)} />
      </View>
    </View>
  );
}
