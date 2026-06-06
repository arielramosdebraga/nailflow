import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatDateTime } from '@/components/features/commands/commandFormatters';
import { useNailTechnicianReports, type ReportPeriod } from '@/hooks/reports/useNailTechnicianReports';

const routes = {
  agenda: '/nail-technician/agenda',
  profile: '/nail-technician/profile',
} as const satisfies Record<string, Href>;

export default function NailTechnicianReportsScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<ReportPeriod>('week');
  const reports = useNailTechnicianReports(period);

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <ScrollView className="flex-1" contentContainerClassName="gap-4 p-6 pb-10 pt-10">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Relatórios</Text>
          <Text className="text-base text-zinc-600 dark:text-zinc-300">
            Acompanhe seus atendimentos, o faturamento fechado e os indicadores mais importantes da rotina.
          </Text>
        </View>

        <View className="flex-row gap-2">
          <Button
            label="Esta semana"
            variant={period === 'week' ? 'primary' : 'ghost'}
            className="flex-1"
            onPress={() => setPeriod('week')}
          />
          <Button
            label="Este mês"
            variant={period === 'month' ? 'primary' : 'ghost'}
            className="flex-1"
            onPress={() => setPeriod('month')}
          />
        </View>

        <Card className="gap-1">
          <Text className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Período analisado</Text>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">{reports.intervalLabel}</Text>
        </Card>

        {reports.isLoading ? (
          <Card>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando indicadores...</Text>
          </Card>
        ) : null}

        {reports.error ? (
          <Card>
            <Text className="text-sm text-error">
              {reports.error instanceof Error ? reports.error.message : 'Falha ao carregar os relatórios.'}
            </Text>
          </Card>
        ) : null}

        {!reports.isLoading && !reports.error ? (
          <>
            <View className="flex-row gap-3">
              {reports.metrics.slice(0, 2).map((metric) => (
                <Card key={metric.label} className="flex-1 gap-1">
                  <Text className="text-sm text-zinc-600 dark:text-zinc-300">{metric.label}</Text>
                  <Text className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{metric.value}</Text>
                  <Text className="text-xs text-zinc-500 dark:text-zinc-400">{metric.helper}</Text>
                </Card>
              ))}
            </View>

            <View className="flex-row gap-3">
              {reports.metrics.slice(2).map((metric) => (
                <Card key={metric.label} className="flex-1 gap-1">
                  <Text className="text-sm text-zinc-600 dark:text-zinc-300">{metric.label}</Text>
                  <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{metric.value}</Text>
                  <Text className="text-xs text-zinc-500 dark:text-zinc-400">{metric.helper}</Text>
                </Card>
              ))}
            </View>

            <Card className="gap-3">
              <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Resumo por status</Text>
              <View className="gap-2">
                {reports.statusBreakdown.map((item) => (
                  <View key={item.label} className="flex-row items-center justify-between">
                    <Text className="text-sm text-zinc-600 dark:text-zinc-300">{item.label}</Text>
                    <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.value}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <Card className="gap-3">
              <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Comandas fechadas recentes</Text>
              {reports.recentClosedCommands.length > 0 ? (
                <View className="gap-3">
                  {reports.recentClosedCommands.map((command) => (
                    <View key={command.id} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                      <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(command.total)}
                      </Text>
                      <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                        Fechada em {formatDateTime(command.closedAt ?? command.createdAt)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-sm text-zinc-600 dark:text-zinc-300">
                  Nenhuma comanda fechada encontrada nesse período.
                </Text>
              )}
            </Card>
          </>
        ) : null}
      </ScrollView>

      <View className="gap-2 p-6 pt-2">
        <Button label="Ver perfil" variant="secondary" onPress={() => router.push(routes.profile)} />
        <Button label="Voltar para a agenda" variant="ghost" onPress={() => router.replace(routes.agenda)} />
      </View>
    </View>
  );
}
