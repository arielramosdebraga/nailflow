import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { addMonths, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';
import { Calendar, Timeline, WeekCalendar, type DateData, type TimelineEventProps } from 'react-native-calendars';

import {
  AppointmentCard,
  formatAppointmentDate,
  formatAppointmentSyncStatus,
  formatAppointmentTimeRange,
  getTimelineColorByStatus,
  toCalendarDateString,
} from '@/components/features/appointments';
import { GoogleCalendarSyncStatusTag } from '@/components/features/google';
import { NotificationsBellButton } from '@/components/features/notifications';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppointments } from '@/hooks/appointments';
import { useAuthSession } from '@/hooks/auth/useAuthSession';
import { useClients } from '@/hooks/clients/useClients';
import { useGoogleCalendarConnection } from '@/hooks/google';
import { useUnreadNotificationsCount } from '@/hooks/notifications';
import { useSessionStore } from '@/stores/sessionStore';

type AgendaViewMode = 'month' | 'week' | 'day';

interface CalendarMarkedDay {
  marked?: boolean;
  selected?: boolean;
  selectedColor?: string;
  dotColor?: string;
}

function parseCalendarDateString(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return new Date();
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function toTimelineDateTime(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  const seconds = String(value.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export default function NailTechnicianAgendaScreen() {
  const router = useRouter();
  const authSession = useAuthSession();
  const googleConnection = useGoogleCalendarConnection();
  const unreadNotifications = useUnreadNotificationsCount();
  const userId = useSessionStore((state) => state.userId);

  const [viewMode, setViewMode] = useState<AgendaViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<string>(() => toCalendarDateString(new Date()));

  const selectedDateValue = useMemo(() => parseCalendarDateString(selectedDate), [selectedDate]);

  const appointmentRange = useMemo(() => {
    const start = startOfMonth(addMonths(selectedDateValue, -1));
    const end = endOfMonth(addMonths(selectedDateValue, 1));
    return { start, end };
  }, [selectedDateValue]);

  const appointmentsQuery = useAppointments({
    start: appointmentRange.start,
    end: appointmentRange.end,
    manicureId: userId ?? undefined,
    limitCount: 350,
    enabled: Boolean(userId),
  });
  const clientsQuery = useClients({ limitCount: 400, enabled: Boolean(userId) });

  const isLoading = appointmentsQuery.isLoading || clientsQuery.isLoading;
  const error = appointmentsQuery.error ?? clientsQuery.error ?? null;

  const appointments = useMemo(() => {
    return [...(appointmentsQuery.data ?? [])].sort((left, right) => left.startTime.getTime() - right.startTime.getTime());
  }, [appointmentsQuery.data]);

  const clientById = useMemo(() => {
    const map = new Map<string, string>();
    for (const client of clientsQuery.data ?? []) {
      map.set(client.id, client.name);
    }

    return map;
  }, [clientsQuery.data]);

  const selectedDayAppointments = useMemo(() => {
    return appointments.filter((appointment) => toCalendarDateString(appointment.startTime) === selectedDate);
  }, [appointments, selectedDate]);

  const weekAppointments = useMemo(() => {
    const weekStart = startOfWeek(selectedDateValue, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDateValue, { weekStartsOn: 1 });

    return appointments.filter(
      (appointment) => appointment.startTime.getTime() >= weekStart.getTime() && appointment.startTime.getTime() <= weekEnd.getTime(),
    );
  }, [appointments, selectedDateValue]);

  const markedDates = useMemo(() => {
    const dates: Record<string, CalendarMarkedDay> = {};
    for (const appointment of appointments) {
      const dateKey = toCalendarDateString(appointment.startTime);
      const previous = dates[dateKey] ?? {};
      dates[dateKey] = {
        ...previous,
        marked: true,
        dotColor: '#0EA5E9',
      };
    }

    const selectedValue = dates[selectedDate] ?? {};
    dates[selectedDate] = {
      ...selectedValue,
      selected: true,
      selectedColor: '#0EA5E9',
    };

    return dates;
  }, [appointments, selectedDate]);

  const timelineEvents = useMemo<TimelineEventProps[]>(() => {
    return selectedDayAppointments.map((appointment) => ({
      id: appointment.id,
      title: clientById.get(appointment.clientId) ?? appointment.clientId,
      summary: formatAppointmentTimeRange(appointment.startTime, appointment.endTime),
      start: toTimelineDateTime(appointment.startTime),
      end: toTimelineDateTime(appointment.endTime),
      color: getTimelineColorByStatus(appointment.status),
    }));
  }, [clientById, selectedDayAppointments]);

  function handleDayPress(day: DateData) {
    setSelectedDate(day.dateString);
  }

  function renderAgendaContent() {
    if (isLoading) {
      return (
        <Card>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando atendimentos...</Text>
        </Card>
      );
    }

    if (error) {
      return (
        <Card>
          <Text className="text-sm text-error">{error instanceof Error ? error.message : 'Falha ao carregar agenda.'}</Text>
        </Card>
      );
    }

    if (!userId) {
      return (
        <Card>
          <Text className="text-sm text-error">Nao foi possivel identificar a profissional logada.</Text>
        </Card>
      );
    }

    if (viewMode === 'month') {
      return (
        <View className="gap-3">
          <Calendar
            current={selectedDate}
            onDayPress={handleDayPress}
            markedDates={markedDates}
            firstDay={1}
            enableSwipeMonths
            hideExtraDays={false}
          />

          <Card className="gap-2">
            <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              Atendimentos em {formatAppointmentDate(selectedDateValue)}
            </Text>

            {selectedDayAppointments.length === 0 ? (
              <Text className="text-sm text-zinc-600 dark:text-zinc-300">Nenhum atendimento nesta data.</Text>
            ) : (
              <View className="gap-2">
                {selectedDayAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    clientName={clientById.get(appointment.clientId) ?? appointment.clientId}
                    onPress={() => router.push(`./appointments/${appointment.id}`)}
                  />
                ))}
              </View>
            )}
          </Card>
        </View>
      );
    }

    if (viewMode === 'week') {
      return (
        <View className="gap-3">
          <WeekCalendar current={selectedDate} onDayPress={handleDayPress} markedDates={markedDates} firstDay={1} />
          <Card className="gap-2">
            <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Atendimentos da semana</Text>
            {weekAppointments.length === 0 ? (
              <Text className="text-sm text-zinc-600 dark:text-zinc-300">Nenhum atendimento nesta semana.</Text>
            ) : (
              <View className="gap-2">
                {weekAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    clientName={clientById.get(appointment.clientId) ?? appointment.clientId}
                    showDate
                    onPress={() => router.push(`./appointments/${appointment.id}`)}
                  />
                ))}
              </View>
            )}
          </Card>
        </View>
      );
    }

    return (
      <View className="gap-3">
        <WeekCalendar current={selectedDate} onDayPress={handleDayPress} markedDates={markedDates} firstDay={1} />
        <Card className="gap-2">
          <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Agenda do dia: {formatAppointmentDate(selectedDateValue)}
          </Text>
          {selectedDayAppointments.length === 0 ? (
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">Nenhum atendimento neste dia.</Text>
          ) : (
            <View className="h-[380px] overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
              <Timeline
                date={selectedDate}
                events={timelineEvents}
                format24h
                start={7}
                end={22}
                scrollToFirst
                onEventPress={(event) => {
                  if (event.id) {
                    router.push(`./appointments/${event.id}`);
                  }
                }}
              />
            </View>
          )}
        </Card>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <ScrollView className="flex-1" contentContainerClassName="p-6 pb-10 pt-10">
        <View className="gap-2 pb-4">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 text-3xl font-bold text-zinc-900 dark:text-zinc-100">Minha agenda</Text>
            <NotificationsBellButton
              unreadCount={unreadNotifications.unreadCount}
              onPress={() => router.push('./notifications')}
            />
          </View>
          <Text className="text-base text-zinc-600 dark:text-zinc-300">
            Visualize seus atendimentos por mes, semana e dia.
          </Text>
        </View>

        <View className="gap-4">
          <Card className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Google Agenda</Text>
              <GoogleCalendarSyncStatusTag status={googleConnection.syncIndicator} />
            </View>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">
              {googleConnection.syncIndicator === 'connected'
                ? 'Conta conectada e pronta para sincronizar.'
                : googleConnection.syncIndicator === 'error'
                  ? 'Erro de sincronizacao. Revise sua conexao.'
                  : 'Conexao pendente. Finalize o OAuth para sincronizar eventos.'}
            </Text>
            {googleConnection.errorMessage ? <Text className="text-sm text-error">{googleConnection.errorMessage}</Text> : null}
          </Card>

          <Card className="gap-3">
            <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Modo de visualizacao</Text>
            <View className="flex-row flex-wrap gap-2">
              <Button
                label="Mes"
                fullWidth={false}
                variant={viewMode === 'month' ? 'primary' : 'ghost'}
                onPress={() => setViewMode('month')}
              />
              <Button
                label="Semana"
                fullWidth={false}
                variant={viewMode === 'week' ? 'primary' : 'ghost'}
                onPress={() => setViewMode('week')}
              />
              <Button
                label="Dia"
                fullWidth={false}
                variant={viewMode === 'day' ? 'primary' : 'ghost'}
                onPress={() => setViewMode('day')}
              />
            </View>
          </Card>

          <Card className="gap-2">
            <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Resumo rapido</Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">
              Atendimentos no dia selecionado: {selectedDayAppointments.length}
            </Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">Atendimentos na semana: {weekAppointments.length}</Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">
              Sincronizacao atual: {formatAppointmentSyncStatus(appointments[0]?.syncStatus ?? 'disabled')}
            </Text>
          </Card>

          {renderAgendaContent()}
        </View>
      </ScrollView>

      <View className="gap-2 border-t border-zinc-200 p-6 dark:border-zinc-800">
        <Button label="Novo atendimento" onPress={() => router.push('./appointments/new')} />
        <Button label="Acessar clientes" variant="secondary" onPress={() => router.push('./clients')} />
        <Button label="Conectar Google Agenda" variant="ghost" onPress={() => router.push('./google-calendar')} />
        <Button
          label={authSession.isLoading ? 'Saindo...' : 'Sair'}
          variant="ghost"
          onPress={async () => {
            await authSession.signOut();
            router.replace('/login');
          }}
        />
      </View>
    </View>
  );
}
