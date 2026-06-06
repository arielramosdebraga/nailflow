import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Bell, CalendarDays, Search, Settings2, UsersRound } from 'lucide-react-native';

import { AppointmentCard, type AppointmentCardItem } from '@/components/features/appointments';
import {
  OperationalBottomNav,
  OperationalMetricCard,
  OperationalScreenShell,
} from '@/components/features/shared';
import { NotificationsBellButton } from '@/components/features/notifications';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAppointments } from '@/hooks/appointments';
import { useClients } from '@/hooks/clients/useClients';
import { useUnreadNotificationsCount } from '@/hooks/notifications';
import type { Appointment } from '@/schemas/appointments/appointment.schema';
import { useSessionStore } from '@/stores/sessionStore';

const appointmentsRoutes = {
  agenda: '/nail-technician/agenda',
  clients: '/nail-technician/clients',
  googleCalendar: '/nail-technician/google-calendar',
  notifications: '/nail-technician/notifications',
  newAppointment: '/nail-technician/appointments/new',
} as const satisfies Record<string, Href>;

const getAppointmentDetailsRoute = (appointmentId: string): Href => ({
  pathname: '/nail-technician/appointments/[appointmentId]',
  params: { appointmentId },
});

function mapAppointmentToCardItem(appointment: Appointment, clientsById: Map<string, string>): AppointmentCardItem {
  return {
    id: appointment.id,
    clientId: appointment.clientId,
    clientName: clientsById.get(appointment.clientId) ?? 'Cliente sem cadastro',
    startsAt: appointment.startTime.toISOString(),
    endsAt: appointment.endTime.toISOString(),
    status: appointment.status,
    notes: appointment.notes,
    priceCents: appointment.priceCents,
  };
}

function buildListInterval(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 30);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setDate(end.getDate() + 120);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export default function AppointmentsListScreen() {
  const router = useRouter();
  const role = useSessionStore((state) => state.role);
  const userId = useSessionStore((state) => state.userId);
  const unreadNotifications = useUnreadNotificationsCount();
  const [searchTerm, setSearchTerm] = useState('');

  const interval = useMemo(() => buildListInterval(), []);
  const appointmentsQuery = useAppointments({
    start: interval.start,
    end: interval.end,
    manicureId: role === 'nail_technician' ? (userId ?? undefined) : undefined,
    limitCount: 500,
  });
  const clientsQuery = useClients({ limitCount: 500 });

  const clientsById = useMemo(
    () => new Map((clientsQuery.data ?? []).map((client) => [client.id, client.name])),
    [clientsQuery.data],
  );

  const appointments = useMemo(
    () => (appointmentsQuery.data ?? []).map((item) => mapAppointmentToCardItem(item, clientsById)),
    [appointmentsQuery.data, clientsById],
  );

  const filteredAppointments = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    if (!normalizedTerm) {
      return appointments;
    }

    return appointments.filter((appointment) => {
      const byClient = appointment.clientName.toLowerCase().includes(normalizedTerm);
      const byNotes = (appointment.notes ?? '').toLowerCase().includes(normalizedTerm);
      return byClient || byNotes;
    });
  }, [appointments, searchTerm]);

  const isLoading = appointmentsQuery.isLoading || clientsQuery.isLoading;
  const queryError = appointmentsQuery.error ?? clientsQuery.error;
  const activeAppointments = filteredAppointments.filter((appointment) => appointment.status !== 'cancelled').length;
  const projectedRevenue =
    filteredAppointments.reduce((total, appointment) => total + appointment.priceCents, 0) / 100;

  return (
    <OperationalScreenShell
      title="Atendimentos"
      subtitle="Consulte seus atendimentos, filtre por cliente ou observação e acompanhe a agenda operacional em um só lugar."
      headerAccessory={
        <NotificationsBellButton
          unreadCount={unreadNotifications.unreadCount}
          onPress={() => router.push(appointmentsRoutes.notifications)}
        />
      }
      topSlot={
        <View className="gap-3">
          <View className="flex-row gap-3">
            <OperationalMetricCard
              label="Encontrados"
              value={String(filteredAppointments.length)}
              helper="No período operacional"
            />
            <OperationalMetricCard
              label="Ativos"
              value={String(activeAppointments)}
              helper="Sem cancelamentos"
              featured
            />
          </View>

          <Card className="gap-2 border-white/10 bg-white/5">
            <Text className="text-sm font-semibold text-zinc-100">Receita prevista</Text>
            <Text className="text-2xl font-black text-zinc-50">
              {projectedRevenue.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </Text>
            <Text className="text-sm leading-6 text-zinc-300">
              A lista considera os últimos 30 dias e os próximos 120 dias para facilitar o acompanhamento do ciclo de atendimento.
            </Text>
          </Card>
        </View>
      }
      footer={
        <OperationalBottomNav
          items={[
            {
              key: 'agenda',
              label: 'Agenda',
              icon: CalendarDays,
              active: true,
              onPress: () => router.replace(appointmentsRoutes.agenda),
            },
            {
              key: 'clients',
              label: 'Clientes',
              icon: UsersRound,
              onPress: () => router.push(appointmentsRoutes.clients),
            },
            {
              key: 'notifications',
              label: 'Alertas',
              icon: Bell,
              onPress: () => router.push(appointmentsRoutes.notifications),
            },
            {
              key: 'google',
              label: 'Google',
              icon: Settings2,
              onPress: () => router.push(appointmentsRoutes.googleCalendar),
            },
          ]}
        />
      }
    >
      <View className="gap-4">
        <Input
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Buscar por cliente ou observação"
          autoCapitalize="words"
          returnKeyType="search"
          label="Busca rápida"
          labelClassName="text-zinc-200"
          inputWrapperClassName="rounded-2xl border-white/10 bg-white/5"
          className="text-zinc-100"
          leftAdornment={<Search size={18} color="#a1a1aa" />}
        />

        <View className="flex-row gap-3">
          <Button
            label="Novo atendimento"
            className="flex-1 rounded-2xl"
            onPress={() => router.push(appointmentsRoutes.newAppointment)}
          />
          <Button
            label="Ver agenda"
            variant="secondary"
            className="flex-1 rounded-2xl"
            onPress={() => router.replace(appointmentsRoutes.agenda)}
          />
        </View>

        {isLoading ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-zinc-300">Carregando atendimentos...</Text>
          </Card>
        ) : null}

        {!isLoading && queryError ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-error">
              {queryError instanceof Error ? queryError.message : 'Falha ao carregar atendimentos.'}
            </Text>
          </Card>
        ) : null}

        {!isLoading && !queryError && filteredAppointments.length === 0 ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-zinc-300">
              Nenhum atendimento encontrado para o filtro informado.
            </Text>
          </Card>
        ) : null}

        {!isLoading && !queryError && filteredAppointments.length > 0 ? (
          <View className="gap-3">
            {filteredAppointments.map((item) => (
              <AppointmentCard
                key={item.id}
                appointment={item}
                showDate
                onPress={(appointmentId) => router.push(getAppointmentDetailsRoute(appointmentId))}
              />
            ))}
          </View>
        ) : null}
      </View>
    </OperationalScreenShell>
  );
}
