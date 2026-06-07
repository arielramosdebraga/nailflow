import { useMemo } from 'react';
import { Bell, CalendarDays, LayoutGrid, ReceiptText, UsersRound } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { endOfDay, startOfDay } from 'date-fns';

import { NotificationsBellButton } from '@/components/features/notifications';
import { OperationalBottomNav, OperationalMetricCard, OperationalScreenShell } from '@/components/features/shared';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppointments } from '@/hooks/appointments/useAppointments';
import { useCommands } from '@/hooks/commands/useCommands';
import { useManicures } from '@/hooks/users/useManicures';
import { useUnreadNotificationsCount } from '@/hooks/notifications';
import { formatCurrency } from '@/components/features/commands/commandFormatters';

const ownerDashboardRoute = '/owner/dashboard' satisfies Href;

export default function OwnerManicuresListScreen() {
  const router = useRouter();
  const unreadNotifications = useUnreadNotificationsCount();

  const manicuresQuery = useManicures({ limitCount: 60 });
  const appointmentsTodayQuery = useAppointments({
    start: startOfDay(new Date()),
    end: endOfDay(new Date()),
    limitCount: 300,
  });
  const commandsQuery = useCommands({ limitCount: 300 });

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
    for (const command of commandsQuery.data ?? []) {
      if (command.status !== 'open') {
        continue;
      }

      const currentValue = entries.get(command.manicureId) ?? 0;
      entries.set(command.manicureId, currentValue + 1);
    }
    return entries;
  }, [commandsQuery.data]);

  const closedRevenueByManicure = useMemo(() => {
    const entries = new Map<string, number>();
    for (const command of commandsQuery.data ?? []) {
      if (command.status !== 'closed') {
        continue;
      }

      const currentValue = entries.get(command.manicureId) ?? 0;
      entries.set(command.manicureId, currentValue + command.total);
    }
    return entries;
  }, [commandsQuery.data]);

  const isLoading = manicuresQuery.isLoading || appointmentsTodayQuery.isLoading || commandsQuery.isLoading;
  const error = manicuresQuery.error ?? appointmentsTodayQuery.error ?? commandsQuery.error ?? null;
  const activeCount = (manicuresQuery.data ?? []).length;
  const totalOpenCommands = Array.from(openCommandsByManicure.values()).reduce((total, value) => total + value, 0);

  return (
    <OperationalScreenShell
      title="Equipe"
      subtitle="Acompanhe os indicadores operacionais e financeiros por profissional."
      headerAccessory={
        <NotificationsBellButton
          unreadCount={unreadNotifications.unreadCount}
          onPress={() => router.push('/owner/notifications')}
        />
      }
      topSlot={
        <View className="flex-row gap-3">
          <OperationalMetricCard label="Profissionais" value={String(activeCount)} helper="Equipe ativa" />
          <OperationalMetricCard label="Comandas abertas" value={String(totalOpenCommands)} helper="Em acompanhamento" />
        </View>
      }
      footer={
        <OperationalBottomNav
          items={[
            {
              key: 'dashboard',
              label: 'Painel',
              icon: LayoutGrid,
              onPress: () => router.push('/owner/dashboard'),
            },
            {
              key: 'agenda',
              label: 'Agenda',
              icon: CalendarDays,
              onPress: () => router.push('/owner/agenda'),
            },
            {
              key: 'manicures',
              label: 'Equipe',
              icon: UsersRound,
              active: true,
              onPress: () => router.replace('/owner/manicures'),
            },
            {
              key: 'commands',
              label: 'Comandas',
              icon: ReceiptText,
              onPress: () => router.push('/owner/commands'),
            },
            {
              key: 'notifications',
              label: 'Alertas',
              icon: Bell,
              onPress: () => router.push('/owner/notifications'),
            },
          ]}
        />
      }
    >
      <View className="gap-4">
        <Button
          label="Voltar ao painel"
          variant="ghost"
          className="h-12 rounded-2xl border-white/10 bg-white/5"
          onPress={() => router.replace(ownerDashboardRoute)}
        />

        {isLoading ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-zinc-300">Carregando equipe...</Text>
          </Card>
        ) : null}

        {error ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-error">{error instanceof Error ? error.message : 'Falha ao carregar.'}</Text>
          </Card>
        ) : null}

        {!isLoading && !error && (manicuresQuery.data ?? []).length === 0 ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-zinc-300">Nenhuma manicure cadastrada.</Text>
          </Card>
        ) : null}

        {!isLoading && !error && (manicuresQuery.data ?? []).length > 0 ? (
          <View className="gap-3">
            {(manicuresQuery.data ?? []).map((manicure) => (
              <Card key={manicure.uid} className="gap-3 rounded-[24px] border-white/10 bg-white/5">
                <View className="flex-row items-center gap-3">
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                    <Text className="text-base font-black text-primary">
                      {manicure.displayName.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-zinc-50">{manicure.displayName}</Text>
                    <Text className="text-sm text-zinc-300">{manicure.email}</Text>
                  </View>
                </View>
                <Text className="text-sm text-zinc-300">
                  Agenda hoje: {appointmentsByManicure.get(manicure.uid) ?? 0} atendimento(s)
                </Text>
                <Text className="text-sm text-zinc-300">
                  Comandas abertas: {openCommandsByManicure.get(manicure.uid) ?? 0}
                </Text>
                <Text className="text-sm text-zinc-300">
                  Faturamento em comandas fechadas: {formatCurrency(closedRevenueByManicure.get(manicure.uid) ?? 0)}
                </Text>
                <Text className="text-sm text-zinc-300">
                  Google Agenda: {manicure.googleCalendarConnected ? 'Conectado' : 'Não conectado'}
                </Text>
              </Card>
            ))}
          </View>
        ) : null}
      </View>
    </OperationalScreenShell>
  );
}
