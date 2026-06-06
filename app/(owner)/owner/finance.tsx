import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { addDays, addMonths, startOfDay, startOfMonth, subDays } from 'date-fns';

import { formatCurrency } from '@/components/features/commands/commandFormatters';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppointments } from '@/hooks/appointments/useAppointments';
import { useCommands, useSalonFinancialSummary } from '@/hooks/commands';

const ownerRoutes = {
  dashboard: '/owner/dashboard',
  manicures: '/owner/manicures',
} as const satisfies Record<string, Href>;

export default function OwnerFinanceScreen() {
  const router = useRouter();
  const dateRanges = useMemo(() => {
    const referenceDate = new Date();
    const todayStart = startOfDay(referenceDate);
    const currentMonthStart = startOfMonth(referenceDate);

    return {
      todayStart,
      tomorrowStart: addDays(todayStart, 1),
      lastSevenDaysStart: startOfDay(subDays(referenceDate, 6)),
      currentMonthStart,
      nextMonthStart: addMonths(currentMonthStart, 1),
    };
  }, []);

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
  const lastSevenDaysSummaryQuery = useSalonFinancialSummary({
    start: dateRanges.lastSevenDaysStart,
    end: dateRanges.tomorrowStart,
    granularity: 'day',
    includeZeroRevenueProfessionals: false,
  });

  const currentMonthSummary = currentMonthSummaryQuery.data;
  const lastSevenDaysSummary = lastSevenDaysSummaryQuery.data;
  const professionalSummary = currentMonthSummary?.professionals ?? [];
  const openCommands = openCommandsQuery.data ?? [];

  const appointmentsTodayByProfessional = useMemo(() => {
    const entries = new Map<string, number>();

    for (const appointment of appointmentsTodayQuery.data ?? []) {
      const currentValue = entries.get(appointment.manicureId) ?? 0;
      entries.set(appointment.manicureId, currentValue + 1);
    }

    return entries;
  }, [appointmentsTodayQuery.data]);

  const openCommandsByProfessional = useMemo(() => {
    const entries = new Map<string, number>();

    for (const command of openCommandsQuery.data ?? []) {
      const currentValue = entries.get(command.manicureId) ?? 0;
      entries.set(command.manicureId, currentValue + 1);
    }

    return entries;
  }, [openCommandsQuery.data]);

  const professionalsWithRevenue = professionalSummary.filter((item) => item.grossRevenue > 0).length;
  const isLoading =
    openCommandsQuery.isLoading ||
    appointmentsTodayQuery.isLoading ||
    currentMonthSummaryQuery.isLoading ||
    lastSevenDaysSummaryQuery.isLoading;
  const error =
    openCommandsQuery.error ??
    appointmentsTodayQuery.error ??
    currentMonthSummaryQuery.error ??
    lastSevenDaysSummaryQuery.error ??
    null;

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <ScrollView className="flex-1" contentContainerClassName="gap-4 p-6 pb-10 pt-10">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Financeiro</Text>
          <Text className="text-base text-zinc-600 dark:text-zinc-300">
            Acompanhe o faturamento fechado, o volume em aberto e o desempenho financeiro da equipe.
          </Text>
        </View>

        {isLoading ? (
          <Card>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando visão financeira...</Text>
          </Card>
        ) : null}

        {error ? (
          <Card>
            <Text className="text-sm text-error">
              {error instanceof Error ? error.message : 'Falha ao carregar os dados financeiros.'}
            </Text>
          </Card>
        ) : null}

        {!isLoading && !error ? (
          <>
            <View className="flex-row gap-3">
              <Card className="flex-1 gap-1">
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">Faturamento fechado</Text>
                <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(currentMonthSummary?.totals.grossRevenue ?? 0)}
                </Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                  {currentMonthSummary?.totals.closedCommandsCount ?? 0} comandas fechadas no mês
                </Text>
              </Card>
              <Card className="flex-1 gap-1">
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">Ticket médio</Text>
                <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(currentMonthSummary?.totals.averageTicket ?? 0)}
                </Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">Base nas comandas fechadas do mês</Text>
              </Card>
            </View>

            <View className="flex-row gap-3">
              <Card className="flex-1 gap-1">
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">Em aberto</Text>
                <Text className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{openCommands.length}</Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">Comandas ainda abertas</Text>
              </Card>
              <Card className="flex-1 gap-1">
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">Profissionais com faturamento</Text>
                <Text className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{professionalsWithRevenue}</Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">No mês atual</Text>
              </Card>
            </View>

            <View className="flex-row gap-3">
              <Card className="flex-1 gap-1">
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">Últimos 7 dias</Text>
                <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(lastSevenDaysSummary?.totals.grossRevenue ?? 0)}
                </Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">Fechamentos confirmados no período</Text>
              </Card>
              <Card className="flex-1 gap-1">
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">Mês atual</Text>
                <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(currentMonthSummary?.totals.grossRevenue ?? 0)}
                </Text>
                <Text className="text-xs text-zinc-500 dark:text-zinc-400">Baseado na data de fechamento</Text>
              </Card>
            </View>

            <Card className="gap-3">
              <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Resumo por profissional</Text>
              {professionalSummary.length > 0 ? (
                <View className="gap-3">
                  {professionalSummary.map((item) => (
                    <View
                      key={item.professionalId}
                      className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
                    >
                      <View className="flex-row items-start justify-between gap-3">
                        <View className="flex-1 gap-1">
                          <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {item.professionalName}
                          </Text>
                          <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                            {item.professionalEmail ?? 'Sem e-mail cadastrado'}
                          </Text>
                        </View>
                        <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(item.grossRevenue)}
                        </Text>
                      </View>
                      <View className="gap-1 pt-2">
                        <Text className="text-sm text-zinc-600 dark:text-zinc-300">
                          Comandas abertas: {openCommandsByProfessional.get(item.professionalId) ?? 0}
                        </Text>
                        <Text className="text-sm text-zinc-600 dark:text-zinc-300">
                          Atendimentos hoje: {appointmentsTodayByProfessional.get(item.professionalId) ?? 0}
                        </Text>
                        <Text className="text-sm text-zinc-600 dark:text-zinc-300">
                          Google Agenda: {item.googleCalendarConnected ? 'Conectado' : 'Não conectado'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">
                  Nenhum dado financeiro disponível para exibir no momento.
                </Text>
              )}
            </Card>

            <Card className="gap-3">
              <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Fechamentos por pagamento
              </Text>
              <View className="gap-2">
                {(currentMonthSummary?.totals.paymentBreakdown ?? []).map((item) => (
                  <View key={item.method} className="flex-row items-center justify-between gap-3">
                    <Text className="text-sm text-zinc-600 dark:text-zinc-300">{item.label}</Text>
                    <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.count} comandas • {formatCurrency(item.amount)}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          </>
        ) : null}
      </ScrollView>

      <View className="gap-2 p-6 pt-2">
        <Button label="Ver equipe" variant="secondary" onPress={() => router.push(ownerRoutes.manicures)} />
        <Button label="Voltar ao painel" variant="ghost" onPress={() => router.replace(ownerRoutes.dashboard)} />
      </View>
    </View>
  );
}
