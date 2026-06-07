import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { addDays, addMonths, startOfDay, startOfMonth } from 'date-fns';

import { formatCurrency } from '@/components/features/commands/commandFormatters';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppointments } from '@/hooks/appointments/useAppointments';
import { useClients } from '@/hooks/clients/useClients';
import { useCommands, useSalonFinancialSummary } from '@/hooks/commands';
import { useCurrentSalon } from '@/hooks/salons/useCurrentSalon';
import { useManicures } from '@/hooks/users/useManicures';
import { useSessionStore } from '@/stores/sessionStore';

const ownerRoutes = {
  dashboard: '/owner/dashboard',
  finance: '/owner/finance',
  manicures: '/owner/manicures',
  agenda: '/owner/agenda',
} as const satisfies Record<string, Href>;

export default function OwnerSalonScreen() {
  const router = useRouter();
  const salonId = useSessionStore((state) => state.salonId);
  const currentSalonQuery = useCurrentSalon();
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

  const manicuresQuery = useManicures({ limitCount: 80 });
  const clientsQuery = useClients({ limitCount: 300 });
  const openCommandsQuery = useCommands({ status: 'open', limitCount: 400 });
  const appointmentsTodayQuery = useAppointments({
    start: dateRanges.todayStart,
    end: dateRanges.tomorrowStart,
    limitCount: 400,
  });
  const currentMonthSummaryQuery = useSalonFinancialSummary({
    start: dateRanges.currentMonthStart,
    end: dateRanges.nextMonthStart,
    granularity: 'day',
    includeZeroRevenueProfessionals: true,
  });

  const activeGoogleIntegrations = useMemo(
    () => (manicuresQuery.data ?? []).filter((item) => item.googleCalendarConnected).length,
    [manicuresQuery.data]
  );
  const currentSalon = currentSalonQuery.data ?? null;
  const operationalStatus = currentSalon?.active === false ? 'Inativo' : 'Ativo';

  const isLoading =
    currentSalonQuery.isLoading ||
    manicuresQuery.isLoading ||
    clientsQuery.isLoading ||
    openCommandsQuery.isLoading ||
    appointmentsTodayQuery.isLoading ||
    currentMonthSummaryQuery.isLoading;
  const error =
    currentSalonQuery.error ??
    manicuresQuery.error ??
    clientsQuery.error ??
    openCommandsQuery.error ??
    appointmentsTodayQuery.error ??
    currentMonthSummaryQuery.error ??
    null;

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <ScrollView className="flex-1" contentContainerClassName="gap-4 p-6 pb-10 pt-10">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Salão</Text>
          <Text className="text-base text-zinc-600 dark:text-zinc-300">
            Consulte a visão operacional do salão e os atalhos mais importantes da gestão diária.
          </Text>
        </View>

        <Card className="gap-2">
          <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Identificação operacional</Text>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            Salão atual: {currentSalon?.name ?? salonId ?? 'Sem vínculo'}
          </Text>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            Fuso horário: {currentSalon?.timezone ?? 'America/Sao_Paulo'}
          </Text>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            Moeda operacional: {currentSalon?.currency ?? 'BRL'}
          </Text>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Situação do cadastro: {operationalStatus}</Text>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            Nesta fase, os dados de operação usam o salão vinculado à sessão atual.
          </Text>
        </Card>

        {isLoading ? (
          <Card>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando dados do salão...</Text>
          </Card>
        ) : null}

        {error ? (
          <Card>
            <Text className="text-sm text-error">
              {error instanceof Error ? error.message : 'Falha ao carregar os dados do salão.'}
            </Text>
          </Card>
        ) : null}

        {!isLoading && !error ? (
          <>
            <View className="flex-row gap-3">
              <Card className="flex-1 gap-1">
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">Equipe ativa</Text>
                <Text className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {(manicuresQuery.data ?? []).length}
                </Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">Profissionais vinculadas</Text>
              </Card>
              <Card className="flex-1 gap-1">
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">Clientes</Text>
                <Text className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {(clientsQuery.data ?? []).length}
                </Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">Cadastros ativos</Text>
              </Card>
            </View>

            <View className="flex-row gap-3">
              <Card className="flex-1 gap-1">
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">Atendimentos hoje</Text>
                <Text className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {(appointmentsTodayQuery.data ?? []).length}
                </Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">Agenda consolidada do dia</Text>
              </Card>
              <Card className="flex-1 gap-1">
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">Faturamento fechado</Text>
                <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(currentMonthSummaryQuery.data?.totals.grossRevenue ?? 0)}
                </Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">Comandas encerradas no mês</Text>
              </Card>
            </View>

            <Card className="gap-3">
              <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Integrações e operação</Text>
              <View className="gap-2">
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="text-sm text-zinc-600 dark:text-zinc-300">Google Agenda conectada</Text>
                  <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {activeGoogleIntegrations} profissional(is)
                  </Text>
                </View>
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="text-sm text-zinc-600 dark:text-zinc-300">Comandas em aberto</Text>
                  <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {(openCommandsQuery.data ?? []).length}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="text-sm text-zinc-600 dark:text-zinc-300">Status operacional</Text>
                  <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{operationalStatus}</Text>
                </View>
              </View>
            </Card>
          </>
        ) : null}
      </ScrollView>

      <View className="gap-2 p-6 pt-2">
        <Button label="Ver financeiro" variant="secondary" onPress={() => router.push(ownerRoutes.finance)} />
        <Button label="Ver equipe" variant="ghost" onPress={() => router.push(ownerRoutes.manicures)} />
        <Button label="Agenda consolidada" variant="ghost" onPress={() => router.push(ownerRoutes.agenda)} />
        <Button label="Voltar ao painel" variant="ghost" onPress={() => router.replace(ownerRoutes.dashboard)} />
      </View>
    </View>
  );
}
