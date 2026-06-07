import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Bell, CalendarDays, Settings2, UsersRound } from 'lucide-react-native';

import {
  OperationalBottomNav,
  OperationalHeroCard,
  OperationalMetricCard,
  OperationalScreenShell,
} from '@/components/features/shared';
import { NotificationsBellButton } from '@/components/features/notifications';
import { GoogleCalendarSyncStatusTag } from '@/components/features/google';
import {
  AgendaCalendar,
  AgendaViewToggle,
  AppointmentCard,
  type AppointmentCardItem,
} from '@/components/features/appointments';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useGoogleCalendarConnection } from '@/hooks/google';
import { useUnreadNotificationsCount } from '@/hooks/notifications';
import { useAppointments } from '@/hooks/appointments';
import { useClients } from '@/hooks/clients/useClients';
import type { Appointment } from '@/schemas/appointments/appointment.schema';
import { useSessionStore } from '@/stores/sessionStore';
import { getAgendaInterval, getReferenceDate, type AgendaViewMode } from '@/utils/dates/agenda-range';

const nailTechnicianRoutes = {
  appointments: '/nail-technician/appointments',
  newAppointment: '/nail-technician/appointments/new',
  clients: '/nail-technician/clients',
  googleCalendar: '/nail-technician/google-calendar',
  notifications: '/nail-technician/notifications',
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

function getGoogleStatusDescription(syncIndicator: ReturnType<typeof useGoogleCalendarConnection>['syncIndicator']) {
  if (syncIndicator === 'connected') {
    return 'Conta conectada e pronta para sincronizar os atendimentos.';
  }

  if (syncIndicator === 'error') {
    return 'Erro de sincronização detectado. Revise a conexão para continuar.';
  }

  return 'Conexão pendente. Finalize o OAuth para ativar a sincronização.';
}

export default function NailTechnicianAgendaScreen() {
  const router = useRouter();
  const googleConnection = useGoogleCalendarConnection();
  const unreadNotifications = useUnreadNotificationsCount();
  const role = useSessionStore((state) => state.role);
  const userId = useSessionStore((state) => state.userId);

  const [mode, setMode] = useState<AgendaViewMode>('day');
  const [referenceDate, setReferenceDate] = useState<Date>(getReferenceDate());

  const interval = useMemo(() => getAgendaInterval(referenceDate, mode), [mode, referenceDate]);
  const clientsQuery = useClients({ limitCount: 300 });
  const appointmentsQuery = useAppointments({
    start: interval.start,
    end: interval.end,
    manicureId: role === 'nail_technician' ? (userId ?? undefined) : undefined,
    limitCount: 300,
  });

  const clientsById = useMemo(
    () => new Map((clientsQuery.data ?? []).map((client) => [client.id, client.name])),
    [clientsQuery.data]
  );

  const appointmentItems = useMemo(
    () => (appointmentsQuery.data ?? []).map((item) => mapAppointmentToCardItem(item, clientsById)),
    [appointmentsQuery.data, clientsById]
  );
  const scheduledCount = appointmentItems.filter((item) => item.status !== 'cancelled').length;
  const expectedRevenue = appointmentItems.reduce((total, item) => total + item.priceCents, 0) / 100;

  const isLoading = appointmentsQuery.isLoading || clientsQuery.isLoading;
  const queryError = appointmentsQuery.error ?? clientsQuery.error;

  return (
    <OperationalScreenShell
      title="Agenda"
      subtitle="Acompanhe seus horários, os próximos atendimentos e os atalhos mais importantes do dia."
      headerAccessory={
        <NotificationsBellButton
          unreadCount={unreadNotifications.unreadCount}
          onPress={() => router.push(nailTechnicianRoutes.notifications)}
        />
      }
      topSlot={
        <View className="gap-4">
          <OperationalHeroCard eyebrow="Resumo do dia" title={`${scheduledCount} atendimento(s)`}>
            <View className="flex-row gap-3">
              <View className="flex-1 rounded-2xl bg-white/15 px-4 py-3">
                <Text className="text-xs text-zinc-100/80">A receber</Text>
                <Text className="pt-1 text-lg font-black text-white">
                  {expectedRevenue.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white/15 px-4 py-3">
                <Text className="text-xs text-zinc-100/80">Clientes visíveis</Text>
                <Text className="pt-1 text-lg font-black text-white">{clientsById.size}</Text>
              </View>
            </View>
          </OperationalHeroCard>

          <View className="flex-row gap-3">
            <OperationalMetricCard label="Hoje" value={String(scheduledCount)} helper="Atendimentos ativos" />
            <OperationalMetricCard
              label="Google Agenda"
              value={googleConnection.syncIndicator === 'connected' ? 'OK' : googleConnection.syncIndicator === 'error' ? 'Erro' : 'Pendente'}
              helper="Sincronização"
              featured
            />
          </View>
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
              onPress: () => router.replace('/nail-technician/agenda'),
            },
            {
              key: 'clients',
              label: 'Clientes',
              icon: UsersRound,
              onPress: () => router.push(nailTechnicianRoutes.clients),
            },
            {
              key: 'notifications',
              label: 'Alertas',
              icon: Bell,
              onPress: () => router.push(nailTechnicianRoutes.notifications),
            },
            {
              key: 'google',
              label: 'Google',
              icon: Settings2,
              onPress: () => router.push(nailTechnicianRoutes.googleCalendar),
            },
          ]}
        />
      }
    >
      <View className="gap-4">
        <AgendaViewToggle mode={mode} onChangeMode={setMode} />
        <AgendaCalendar referenceDate={referenceDate} mode={mode} onChangeReferenceDate={setReferenceDate} />

        <View className="gap-3 rounded-[24px] border border-white/10 bg-white/5 p-4">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1 gap-1">
              <Text className="text-sm font-semibold text-zinc-100">Google Agenda</Text>
              <Text className="text-sm leading-6 text-zinc-300">
                {getGoogleStatusDescription(googleConnection.syncIndicator)}
              </Text>
            </View>
            <GoogleCalendarSyncStatusTag status={googleConnection.syncIndicator} />
          </View>

          {googleConnection.errorMessage ? (
            <Text className="text-sm text-error">{googleConnection.errorMessage}</Text>
          ) : null}

          <Button
            label="Gerenciar Google Agenda"
            variant="secondary"
            className="h-12 rounded-2xl"
            onPress={() => router.push(nailTechnicianRoutes.googleCalendar)}
          />
        </View>

        <View className="flex-row gap-3">
          <Button
            label="Criar atendimento"
            className="flex-1"
            onPress={() => router.push(nailTechnicianRoutes.newAppointment)}
          />
          <Button
            label="Ver atendimentos"
            className="flex-1"
            variant="secondary"
            onPress={() => router.push(nailTechnicianRoutes.appointments)}
          />
        </View>

        {isLoading ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-zinc-300">Carregando agenda...</Text>
          </Card>
        ) : null}

        {!isLoading && queryError ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-error">
              {queryError instanceof Error ? queryError.message : 'Falha ao carregar atendimentos.'}
            </Text>
          </Card>
        ) : null}

        {!isLoading && !queryError && appointmentItems.length === 0 ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-zinc-300">
              Nenhum atendimento encontrado para o período selecionado.
            </Text>
          </Card>
        ) : null}

        {!isLoading && !queryError && appointmentItems.length > 0 ? (
          <View className="gap-3">
            {appointmentItems.map((item) => (
              <AppointmentCard
                key={item.id}
                appointment={item}
                onPress={(appointmentId) => router.push(getAppointmentDetailsRoute(appointmentId))}
              />
            ))}
          </View>
        ) : null}
      </View>
    </OperationalScreenShell>
  );
}
