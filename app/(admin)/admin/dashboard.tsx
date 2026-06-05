import { useRouter, type Href } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { AdminHeader, AdminKpiCards } from '@/components/features/admin';
import { NotificationsBellButton } from '@/components/features/notifications';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAdminSessionGuard, useGlobalDashboard } from '@/hooks/admin';
import { useUnreadNotificationsCount } from '@/hooks/notifications';

const adminRoutes = {
  auditLogs: '/admin/audit-logs',
  notifications: '/admin/notifications',
  salons: '/admin/salons',
  users: '/admin/users',
} as const satisfies Record<string, Href>;

export default function AdminDashboardScreen() {
  const router = useRouter();
  useAdminSessionGuard();
  const dashboardQuery = useGlobalDashboard({ includeInactiveSalons: true });
  const unreadNotifications = useUnreadNotificationsCount();

  return (
    <ScrollView className="flex-1 bg-zinc-50 dark:bg-zinc-950" contentContainerClassName="p-6 pb-8">
      <AdminHeader
        title="Painel do Superadministrador"
        subtitle="Governanca global do NailFlow com KPIs, auditoria e atalhos operacionais."
        activeRoute="dashboard"
        accessory={
          <NotificationsBellButton
            unreadCount={unreadNotifications.unreadCount}
            onPress={() => router.push(adminRoutes.notifications)}
          />
        }
      />

      <View className="gap-3 pt-6">
        <View className="flex-row items-center justify-between gap-3">
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

        <View className="flex-row gap-2">
          <Button
            label="Central de notificacoes"
            variant="secondary"
            className="flex-1"
            onPress={() => router.push(adminRoutes.notifications)}
          />
          <Button
            label="Auditoria"
            variant="ghost"
            className="flex-1"
            onPress={() => router.push(adminRoutes.auditLogs)}
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
          <AdminKpiCards summary={dashboardQuery.data.summary} generatedAt={dashboardQuery.data.generatedAt} />
        ) : null}

        <Card className="gap-3">
          <Text className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Governanca</Text>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            Consulte saloes, usuarios administrativos, notificacoes e logs de auditoria em um unico lugar.
          </Text>
          <Button label="Gerenciar saloes" onPress={() => router.push(adminRoutes.salons)} />
          <Button label="Gerenciar usuarios" variant="secondary" onPress={() => router.push(adminRoutes.users)} />
          <Button label="Ver logs de auditoria" variant="ghost" onPress={() => router.push(adminRoutes.auditLogs)} />
          <Button
            label="Abrir central de notificacoes"
            variant="secondary"
            onPress={() => router.push(adminRoutes.notifications)}
          />
        </Card>
      </View>
    </ScrollView>
  );
}
