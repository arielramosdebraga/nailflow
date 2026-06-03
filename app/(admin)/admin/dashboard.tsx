import { ScrollView, Text, View } from 'react-native';

import { AdminHeader, AdminKpiCards } from '@/components/features/admin';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAdminSessionGuard, useGlobalDashboard } from '@/hooks/admin';

export default function AdminDashboardScreen() {
  useAdminSessionGuard();
  const dashboardQuery = useGlobalDashboard({ includeInactiveSalons: true });

  return (
    <ScrollView className="flex-1 bg-zinc-50 dark:bg-zinc-950" contentContainerClassName="p-6 pb-8">
      <AdminHeader
        title="Dashboard global"
        subtitle="KPIs reais de operacao do NailFlow para acompanhamento do superadministrador."
        activeRoute="dashboard"
      />

      <View className="gap-3 pt-6">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Indicadores</Text>
          <Button
            label={dashboardQuery.isFetching ? 'Atualizando...' : 'Atualizar'}
            onPress={() => {
              void dashboardQuery.refetch();
            }}
            fullWidth={false}
            disabled={dashboardQuery.isFetching}
            className="h-10 rounded-lg px-3"
          />
        </View>

        {dashboardQuery.isLoading && !dashboardQuery.data ? (
          <Card>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando KPIs do dashboard...</Text>
          </Card>
        ) : null}

        {dashboardQuery.error ? (
          <Card>
            <Text className="text-sm text-error">
              {dashboardQuery.error instanceof Error
                ? dashboardQuery.error.message
                : 'Falha ao carregar dashboard global.'}
            </Text>
          </Card>
        ) : null}

        {dashboardQuery.data ? (
          <AdminKpiCards
            summary={dashboardQuery.data.summary}
            generatedAt={dashboardQuery.data.generatedAt}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}
