import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { addDays, addMonths, startOfDay, startOfMonth } from 'date-fns';

import { CommandCard } from '@/components/features/commands/CommandCard';
import { formatCurrency } from '@/components/features/commands/commandFormatters';
import { NotificationsBellButton } from '@/components/features/notifications';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthSession } from '@/hooks/auth/useAuthSession';
import { useAppointments } from '@/hooks/appointments/useAppointments';
import { useClients } from '@/hooks/clients/useClients';
import { useCommands, useSalonFinancialSummary } from '@/hooks/commands';
import { useUnreadNotificationsCount } from '@/hooks/notifications';
import { useManicures } from '@/hooks/users/useManicures';

const ownerRoutes = {
  notifications: '/owner/notifications',
  commands: '/owner/commands',
  agenda: '/owner/agenda',
  manicures: '/owner/manicures',
  newManicure: '/owner/manicures/new' as Href,
  finance: '/owner/finance',
  salon: '/owner/salon',
  googleCalendar: '/nail-technician/google-calendar',
  login: '/login',
} as const satisfies Record<string, Href>;

const getOwnerCommandDetailsRoute = (commandId: string): Href => ({
  pathname: '/owner/commands/[commandId]',
  params: { commandId },
});

export default function OwnerDashboardScreen() {
  const router = useRouter();
  const authSession = useAuthSession();
  const dateRanges = useMemo(() => {
    const referenceDate = new Date();
    const todayStart = startOfDay(referenceDate);
    const currentMonthStart = startOfMonth(referenceDate);

    return {
      todayStart,
      tomorrowStart: addDays(todayStart, 1),
      currentMonthStart,
      nextMonthStart: addMonths(currentMonthStart, 1),
    };
  }, []);

  const recentCommandsQuery = useCommands({ limitCount: 20 });
  const openCommandsQuery = useCommands({ status: 'open', limitCount: 300 });
  const appointmentsTodayQuery = useAppointments({
    start: dateRanges.todayStart,
    end: dateRanges.tomorrowStart,
    limitCount: 250,
  });
  const clientsQuery = useClients({ limitCount: 200 });
  const manicuresQuery = useManicures({ limitCount: 50 });
  const currentMonthSummaryQuery = useSalonFinancialSummary({
    start: dateRanges.currentMonthStart,
    end: dateRanges.nextMonthStart,
    granularity: 'day',
    includeZeroRevenueProfessionals: true,
  });
  const unreadNotifications = useUnreadNotificationsCount();

  const recentCommands = recentCommandsQuery.data ?? [];
  const openCommands = openCommandsQuery.data ?? [];
  const appointmentsToday = appointmentsTodayQuery.data ?? [];
  const googleConnectedCount = (manicuresQuery.data ?? []).filter((item) => item.googleCalendarConnected).length;
  const clientsById = new Map((clientsQuery.data ?? []).map((client) => [client.id, client] as const));
  const manicuresById = new Map((manicuresQuery.data ?? []).map((manicure) => [manicure.uid, manicure] as const));

  const isLoading =
    recentCommandsQuery.isLoading ||
    openCommandsQuery.isLoading ||
    appointmentsTodayQuery.isLoading ||
    clientsQuery.isLoading ||
    manicuresQuery.isLoading ||
    currentMonthSummaryQuery.isLoading;
  const error =
    recentCommandsQuery.error ??
    openCommandsQuery.error ??
    appointmentsTodayQuery.error ??
    clientsQuery.error ??
    manicuresQuery.error ??
    currentMonthSummaryQuery.error;

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <ScrollView className="flex-1" contentContainerClassName="p-6 pb-10 pt-10">
        <View className="gap-2 pb-5">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 text-3xl font-bold text-zinc-900 dark:text-zinc-100">Painel do salão</Text>
            <NotificationsBellButton
              unreadCount={unreadNotifications.unreadCount}
              onPress={() => router.push(ownerRoutes.notifications)}
            />
          </View>
          <Text className="text-base text-zinc-600 dark:text-zinc-300">
            Visão rápida de comandas, agenda do dia e equipe.
          </Text>
        </View>

        {isLoading ? (
          <Card>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando indicadores...</Text>
          </Card>
        ) : null}

        {error ? (
          <Card>
            <Text className="text-sm text-error">
              {error instanceof Error ? error.message : 'Falha ao carregar o painel.'}
            </Text>
          </Card>
        ) : null}

        {!isLoading && !error ? (
          <View className="gap-3">
            <View className="flex-row gap-3">
              <Card className="flex-1 gap-1">
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">Comandas abertas</Text>
                <Text className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{openCommands.length}</Text>
              </Card>
              <Card className="flex-1 gap-1">
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">Comandas fechadas no mês</Text>
                <Text className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {currentMonthSummaryQuery.data?.totals.closedCommandsCount ?? 0}
                </Text>
              </Card>
            </View>

            <View className="flex-row gap-3">
              <Card className="flex-1 gap-1">
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">Faturamento do mês</Text>
                <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(currentMonthSummaryQuery.data?.totals.grossRevenue ?? 0)}
                </Text>
              </Card>
              <Card className="flex-1 gap-1">
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">Atendimentos hoje</Text>
                <Text className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{appointmentsToday.length}</Text>
              </Card>
            </View>

            <Card className="gap-2">
              <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Equipe</Text>
              <Text className="text-sm text-zinc-600 dark:text-zinc-300">
                Profissionais ativas: {(manicuresQuery.data ?? []).length}
              </Text>
              <Text className="text-sm text-zinc-600 dark:text-zinc-300">
                Clientes cadastrados: {(clientsQuery.data ?? []).length}
              </Text>
              <Text className="text-sm text-zinc-600 dark:text-zinc-300">
                Google Agenda conectada: {googleConnectedCount} profissional(is)
              </Text>
            </Card>

            <View className="gap-2">
              <Button
                label="Gerenciar comandas"
                accessibilityHint="Abre a lista de comandas do salão."
                onPress={() => router.push(ownerRoutes.commands)}
              />
              <Button
                label="Agenda consolidada de hoje"
                variant="secondary"
                accessibilityHint="Abre a agenda consolidada do dia por profissional."
                onPress={() => router.push(ownerRoutes.agenda)}
              />
              <Button
                label="Visão financeira"
                variant="secondary"
                accessibilityHint="Abre a visão financeira com resumo e desempenho por profissional."
                onPress={() => router.push(ownerRoutes.finance)}
              />
              <Button
                label="Nova profissional"
                variant="secondary"
                accessibilityHint="Abre o fluxo seguro para cadastrar uma nova profissional."
                onPress={() => router.push(ownerRoutes.newManicure)}
              />
              <Button
                label="Equipe de profissionais"
                variant="ghost"
                accessibilityHint="Abre a lista de profissionais do salão."
                onPress={() => router.push(ownerRoutes.manicures)}
              />
              <Button
                label="Dados do salão"
                variant="ghost"
                accessibilityHint="Abre a visão operacional do salão atual."
                onPress={() => router.push(ownerRoutes.salon)}
              />
              <Button
                label="Minha conexão com Google Agenda"
                variant="ghost"
                accessibilityHint="Abre a tela de conexão da sua conta com o Google Agenda."
                onPress={() => router.push(ownerRoutes.googleCalendar)}
              />
            </View>

            {recentCommands.length > 0 ? (
              <View className="gap-2 pt-2">
                <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Comandas recentes</Text>
                <View className="gap-3">
                  {recentCommands.slice(0, 3).map((command) => (
                    <CommandCard
                      key={command.id}
                      command={command}
                      clientName={clientsById.get(command.clientId)?.name}
                      manicureName={manicuresById.get(command.manicureId)?.displayName}
                      onPress={() => router.push(getOwnerCommandDetailsRoute(command.id))}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <View className="p-6 pt-2">
        <Button
          label={authSession.isLoading ? 'Saindo...' : 'Sair'}
          variant="ghost"
          accessibilityHint="Encerra sua sessão e volta para a tela de login."
          onPress={async () => {
            await authSession.signOut();
            router.replace(ownerRoutes.login);
          }}
        />
      </View>
    </View>
  );
}
