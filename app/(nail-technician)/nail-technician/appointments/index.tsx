import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppointmentCard, type AppointmentCardItem } from '@/components/features/appointments';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAppointments } from '@/hooks/appointments';
import { useClients } from '@/hooks/clients/useClients';
import type { Appointment } from '@/schemas/appointments/appointment.schema';
import { useSessionStore } from '@/stores/sessionStore';

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

  return (
    <View className="flex-1 bg-zinc-50 p-6 dark:bg-zinc-950">
      <View className="gap-3 pb-4 pt-10">
        <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Atendimentos</Text>
        <Text className="text-base text-zinc-600 dark:text-zinc-300">
          Consulte os atendimentos cadastrados e acesse os detalhes para atualizar informacoes.
        </Text>
        <Input
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Buscar por cliente ou observacao"
          autoCapitalize="words"
          returnKeyType="search"
        />

        <View className="flex-row gap-2">
          <Button label="Novo atendimento" className="flex-1" onPress={() => router.push('./new')} />
          <Button
            label="Voltar agenda"
            className="flex-1"
            variant="ghost"
            onPress={() => router.replace('../agenda')}
          />
        </View>
      </View>

      {isLoading ? (
        <Card>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando atendimentos...</Text>
        </Card>
      ) : null}

      {!isLoading && queryError ? (
        <Card>
          <Text className="text-sm text-error">
            {queryError instanceof Error ? queryError.message : 'Falha ao carregar atendimentos.'}
          </Text>
        </Card>
      ) : null}

      {!isLoading && !queryError && filteredAppointments.length === 0 ? (
        <Card>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            Nenhum atendimento encontrado para o filtro informado.
          </Text>
        </Card>
      ) : null}

      {!isLoading && !queryError && filteredAppointments.length > 0 ? (
        <FlatList
          data={filteredAppointments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <AppointmentCard appointment={item} onPress={(appointmentId) => router.push(`./${appointmentId}`)} />
          )}
        />
      ) : null}
    </View>
  );
}
