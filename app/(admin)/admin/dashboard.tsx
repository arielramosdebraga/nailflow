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
  const summary = dashboardQuery.data?.summary;
  const activeSalons = summary?.activeSalons ?? 0;
  const totalSalons = summary?.totalSalons ?? 0;
  const occupancyLabel =
    totalSalons > 0 ? `${Math.round((activeSalons / totalSalons) * 100)}%` : '0%';

  return (
    <ScrollView className="flex-1 bg-zinc-950" contentContainerClassName="p-6 pb-8">
      <AdminHeader
        title="Painel Admin"
        subtitle="Governança global do NailFlow com indicadores, trilha de auditoria e atalhos operacionais."
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
          <Text className="text-lg font-semibold text-zinc-50">Indicadores</Text>
          <Button
            label={dashboardQuery.isFetching ? 'Atualizando...' : 'Atualizar'}
            onPress={() => {
              void dashboardQuery.refetch();
            }}
            fullWidth={false}
            disabled={dashboardQuery.isFetching}
            className="h-10 rounded-2xl px-4"
          />
        </View>

        <View className="rounded-[28px] bg-fuchsia-600 px-5 py-5">
          <Text className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-100/80">
            Ecossistema monitorado
          </Text>
          <Text className="pt-2 text-3xl font-black text-white">
            {summary ? new Intl.NumberFormat('pt-BR').format(summary.totalUsers) : '--'}
          </Text>
          <Text className="pt-1 text-sm leading-6 text-zinc-100/85">
            usuários distribuídos em {summary ? new Intl.NumberFormat('pt-BR').format(summary.totalSalons) : '--'} salões, com {occupancyLabel} da base atualmente ativa.
          </Text>

          <View className="pt-4">
            <View className="flex-row gap-3">
              <View className="flex-1 rounded-2xl bg-white/15 px-4 py-3">
                <Text className="text-xs text-zinc-100/80">Salões ativos</Text>
                <Text className="pt-1 text-lg font-black text-white">
                  {summary ? new Intl.NumberFormat('pt-BR').format(summary.activeSalons) : '--'}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white/15 px-4 py-3">
                <Text className="text-xs text-zinc-100/80">Agendamentos</Text>
                <Text className="pt-1 text-lg font-black text-white">
                  {summary ? new Intl.NumberFormat('pt-BR').format(summary.totalAppointments) : '--'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {dashboardQuery.isLoading && !dashboardQuery.data ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-zinc-300">Carregando KPIs do dashboard...</Text>
          </Card>
        ) : null}

        {dashboardQuery.error ? (
          <Card className="border-white/10 bg-white/5">
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

        <Card className="gap-4 rounded-[24px] border-white/10 bg-white/5">
          <Text className="text-lg font-semibold text-zinc-50">Governança</Text>
          <Text className="text-sm leading-6 text-zinc-300">
            Consulte salões, usuários administrativos, notificações e logs de auditoria em um único lugar.
          </Text>
          <View className="gap-3">
            <Button label="Gerenciar salões" className="h-12 rounded-2xl" onPress={() => router.push(adminRoutes.salons)} />
            <Button
              label="Gerenciar usuários"
              variant="secondary"
              className="h-12 rounded-2xl"
              onPress={() => router.push(adminRoutes.users)}
            />
            <Button
              label="Ver logs de auditoria"
              variant="ghost"
              className="h-12 rounded-2xl border-white/10 bg-white/5"
              onPress={() => router.push(adminRoutes.auditLogs)}
            />
          </View>
        </Card>

        <Card className="gap-4 rounded-[24px] border-white/10 bg-white/5">
          <Text className="text-lg font-semibold text-zinc-50">Alertas e operação</Text>
          <View className="gap-3">
            <View className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
              <Text className="text-sm font-semibold text-amber-300">Auditoria administrativa</Text>
              <Text className="pt-1 text-sm text-zinc-200">
                Acompanhe leituras sensíveis, alterações e rastros operacionais em tempo real.
              </Text>
            </View>
            <View className="rounded-2xl border border-sky-400/30 bg-sky-400/10 p-4">
              <Text className="text-sm font-semibold text-sky-300">Central de notificações</Text>
              <Text className="pt-1 text-sm text-zinc-200">
                Use a central para monitorar eventos globais da plataforma e priorizar respostas.
              </Text>
            </View>
          </View>
          <Button
            label="Abrir central de notificações"
            variant="secondary"
            className="h-12 rounded-2xl"
            onPress={() => router.push(adminRoutes.notifications)}
          />
        </Card>
      </View>
    </ScrollView>
  );
}
