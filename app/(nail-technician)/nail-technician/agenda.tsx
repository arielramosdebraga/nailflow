import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

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
import { useAuthSession } from '@/hooks/auth/useAuthSession';
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
  const authSession = useAuthSession();
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

  const isLoading = appointmentsQuery.isLoading || clientsQuery.isLoading;
  const queryError = appointmentsQuery.error ?? clientsQuery.error;

  return (
    <View className="flex-1 justify-between bg-zinc-50 p-6 dark:bg-zinc-950">
      <View className="flex-1 gap-4 pt-10">
        <View className="gap-2">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1 gap-2">
              <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Agenda de atendimentos</Text>
              <Text className="text-base text-zinc-600 dark:text-zinc-300">
                Acompanhe os horarios do dia e da semana com acesso rapido para criar, editar e consultar detalhes.
              </Text>
            </View>
            <NotificationsBellButton
              unreadCount={unreadNotifications.unreadCount}
              onPress={() => router.push(nailTechnicianRoutes.notifications)}
            />
          </View>
        </View>

        <AgendaViewToggle mode={mode} onChangeMode={setMode} />
        <AgendaCalendar referenceDate={referenceDate} mode={mode} onChangeReferenceDate={setReferenceDate} />

        <Card className="gap-3">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1 gap-1">
              <Text className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                Sincronização Google Agenda
              </Text>
              <Text className="text-sm text-zinc-600 dark:text-zinc-300">
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
            onPress={() => router.push(nailTechnicianRoutes.googleCalendar)}
          />
        </Card>

        <View className="flex-row gap-2">
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

        <View className="flex-row gap-2">
          <Button
            label="Gerenciar clientes"
            className="flex-1"
            variant="ghost"
            onPress={() => router.push(nailTechnicianRoutes.clients)}
          />
        </View>

        {isLoading ? (
          <Card>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando agenda...</Text>
          </Card>
        ) : null}

        {!isLoading && queryError ? (
          <Card>
            <Text className="text-sm text-error">
              {queryError instanceof Error ? queryError.message : 'Falha ao carregar atendimentos.'}
            </Text>
          </Card>
        ) : null}

        {!isLoading && !queryError && appointmentItems.length === 0 ? (
          <Card>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">
              Nenhum atendimento encontrado para o periodo selecionado.
            </Text>
          </Card>
        ) : null}

        {!isLoading && !queryError && appointmentItems.length > 0 ? (
          <FlatList
            data={appointmentItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
            renderItem={({ item }) => (
              <AppointmentCard
                appointment={item}
                onPress={(appointmentId) => router.push(getAppointmentDetailsRoute(appointmentId))}
              />
            )}
          />
        ) : null}
      </View>

      <Button
        label={authSession.isLoading ? 'Saindo...' : 'Sair'}
        variant="ghost"
        onPress={async () => {
          await authSession.signOut();
          router.replace('/login');
        }}
      />
    </View>
  );
}
