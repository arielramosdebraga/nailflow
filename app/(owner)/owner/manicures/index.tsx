import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { addDays, addMonths, startOfDay, startOfMonth } from 'date-fns';

import { formatCurrency } from '@/components/features/commands/commandFormatters';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppointments } from '@/hooks/appointments/useAppointments';
import { useCommands, useSalonFinancialSummary } from '@/hooks/commands';
import { useManicures } from '@/hooks/users/useManicures';

const ownerDashboardRoute = '/owner/dashboard' satisfies Href;
const ownerFinanceRoute = '/owner/finance' satisfies Href;
const ownerSalonRoute = '/owner/salon' satisfies Href;
const ownerNewManicureRoute = '/owner/manicures/new' as Href;

export default function OwnerManicuresListScreen() {
  const router = useRouter();
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

  const manicuresQuery = useManicures({ limitCount: 60 });
  const appointmentsTodayQuery = useAppointments({
    start: dateRanges.todayStart,
    end: dateRanges.tomorrowStart,
    limitCount: 300,
  });
  const openCommandsQuery = useCommands({ status: 'open', limitCount: 300 });
  const currentMonthSummaryQuery = useSalonFinancialSummary({
    start: dateRanges.currentMonthStart,
    end: dateRanges.nextMonthStart,
    granularity: 'day',
    includeZeroRevenueProfessionals: true,
  });

  const appointmentsByManicure = useMemo(() => {
    const entries = new Map<string, number>();

    for (const appointment of appointmentsTodayQuery.data ?? []) {
      const currentValue = entries.get(appointment.manicureId) ?? 0;
      entries.set(appointment.manicureId, currentValue + 1);
    }

    return entries;
  }, [appointmentsTodayQuery.data]);

  const openCommandsByManicure = useMemo(() => {
    const entries = new Map<string, number>();

    for (const command of openCommandsQuery.data ?? []) {
      const currentValue = entries.get(command.manicureId) ?? 0;
      entries.set(command.manicureId, currentValue + 1);
    }

    return entries;
  }, [openCommandsQuery.data]);

  const closedRevenueByManicure = useMemo(() => {
    const entries = new Map<string, number>();

    for (const professional of currentMonthSummaryQuery.data?.professionals ?? []) {
      entries.set(professional.professionalId, professional.grossRevenue);
    }

    return entries;
  }, [currentMonthSummaryQuery.data?.professionals]);

  const isLoading =
    manicuresQuery.isLoading ||
    appointmentsTodayQuery.isLoading ||
    openCommandsQuery.isLoading ||
    currentMonthSummaryQuery.isLoading;
  const error =
    manicuresQuery.error ??
    appointmentsTodayQuery.error ??
    openCommandsQuery.error ??
    currentMonthSummaryQuery.error ??
    null;
  const activeCount = (manicuresQuery.data ?? []).length;
  const connectedCount = (manicuresQuery.data ?? []).filter((item) => item.googleCalendarConnected).length;

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <ScrollView className="flex-1" contentContainerClassName="p-6 pb-10 pt-10">
        <View className="gap-2 pb-5">
          <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Profissionais</Text>
          <Text className="text-base text-zinc-600 dark:text-zinc-300">
            Acompanhe indicadores operacionais e financeiros por profissional.
          </Text>
        </View>

        <Card className="mb-4 gap-2">
          <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Onboarding seguro</Text>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            O cadastro de novas profissionais agora acontece em um fluxo seguro no backend, sem expor senha nem trocar
            a sessao da owner.
          </Text>
        </Card>

        <View className="flex-row gap-3 pb-4">
          <Card className="flex-1 gap-1">
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">Equipe ativa</Text>
            <Text className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{activeCount}</Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">Profissionais vinculadas</Text>
          </Card>
          <Card className="flex-1 gap-1">
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">Google Agenda</Text>
            <Text className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{connectedCount}</Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">Integrações ativas</Text>
          </Card>
        </View>

        <View className="gap-2 pb-4">
          <Button label="Nova profissional" onPress={() => router.push(ownerNewManicureRoute)} />
          <Button label="Ver financeiro" variant="secondary" onPress={() => router.push(ownerFinanceRoute)} />
          <Button label="Dados do salão" variant="ghost" onPress={() => router.push(ownerSalonRoute)} />
        </View>

        {isLoading ? (
          <Card>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando equipe...</Text>
          </Card>
        ) : null}

        {error ? (
          <Card>
            <Text className="text-sm text-error">
              {error instanceof Error ? error.message : 'Falha ao carregar a equipe.'}
            </Text>
          </Card>
        ) : null}

        {!isLoading && !error && (manicuresQuery.data ?? []).length === 0 ? (
          <Card className="gap-3">
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">
              Nenhuma profissional vinculada ao salão até o momento.
            </Text>
            <Button label="Cadastrar primeira profissional" onPress={() => router.push(ownerNewManicureRoute)} />
          </Card>
        ) : null}

        {!isLoading && !error && (manicuresQuery.data ?? []).length > 0 ? (
          <View className="gap-3">
            {(manicuresQuery.data ?? []).map((manicure) => (
              <Card key={manicure.uid} className="gap-3">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1 gap-1">
                    <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      {manicure.displayName}
                    </Text>
                    <Text className="text-sm text-zinc-600 dark:text-zinc-300">{manicure.email}</Text>
                  </View>
                  <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(closedRevenueByManicure.get(manicure.uid) ?? 0)}
                  </Text>
                </View>
                <View className="gap-1">
                  <Text className="text-sm text-zinc-600 dark:text-zinc-300">
                    Agenda de hoje: {appointmentsByManicure.get(manicure.uid) ?? 0} atendimento(s)
                  </Text>
                  <Text className="text-sm text-zinc-600 dark:text-zinc-300">
                    Comandas abertas: {openCommandsByManicure.get(manicure.uid) ?? 0}
                  </Text>
                  <Text className="text-sm text-zinc-600 dark:text-zinc-300">
                    Faturamento em comandas fechadas: {formatCurrency(closedRevenueByManicure.get(manicure.uid) ?? 0)}
                  </Text>
                  <Text className="text-sm text-zinc-600 dark:text-zinc-300">
                    Google Agenda: {manicure.googleCalendarConnected ? 'Conectada' : 'Não conectada'}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View className="p-6 pt-2">
        <Button label="Voltar ao painel" variant="ghost" onPress={() => router.replace(ownerDashboardRoute)} />
      </View>
    </View>
  );
}
