import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  AgendaCalendar,
  AgendaViewToggle,
  AppointmentCard,
  type AppointmentCardItem,
} from '@/components/features/appointments';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthSession } from '@/hooks/auth/useAuthSession';
import { useAppointments } from '@/hooks/appointments';
import { useClients } from '@/hooks/clients/useClients';
import type { Appointment } from '@/schemas/appointments/appointment.schema';
import { useSessionStore } from '@/stores/sessionStore';
import { getAgendaInterval, getReferenceDate, type AgendaViewMode } from '@/utils/dates/agenda-range';

function mapAppointmentToCardItem(
  appointment: Appointment,
  clientsById: Map<string, string>,
): AppointmentCardItem {
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

export default function NailTechnicianAgendaScreen() {
  const router = useRouter();
  const authSession = useAuthSession();
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
    [clientsQuery.data],
  );

  const appointmentItems = useMemo(
    () => (appointmentsQuery.data ?? []).map((item) => mapAppointmentToCardItem(item, clientsById)),
    [appointmentsQuery.data, clientsById],
  );

  const isLoading = appointmentsQuery.isLoading || clientsQuery.isLoading;
  const queryError = appointmentsQuery.error ?? clientsQuery.error;

  return (
    <View className="flex-1 justify-between bg-zinc-50 p-6 dark:bg-zinc-950">
      <View className="flex-1 gap-4 pt-10">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Agenda de atendimentos</Text>
          <Text className="text-base text-zinc-600 dark:text-zinc-300">
            Acompanhe os horarios do dia e da semana com acesso rapido para criar, editar e consultar detalhes.
          </Text>
        </View>

        <AgendaViewToggle mode={mode} onChangeMode={setMode} />
        <AgendaCalendar referenceDate={referenceDate} mode={mode} onChangeReferenceDate={setReferenceDate} />

        <View className="flex-row gap-2">
          <Button label="Novo atendimento" className="flex-1" onPress={() => router.push('./appointments/new')} />
          <Button
            label="Atendimentos"
            className="flex-1"
            variant="secondary"
            onPress={() => router.push('./appointments')}
          />
        </View>

        <View className="flex-row gap-2">
          <Button
            label="Acessar clientes"
            className="flex-1"
            variant="ghost"
            onPress={() => router.push('./clients')}
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
                onPress={(appointmentId) => router.push(`./appointments/${appointmentId}`)}
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
