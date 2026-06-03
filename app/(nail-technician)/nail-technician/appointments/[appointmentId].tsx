import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppointmentStatusTag } from '@/components/features/appointments';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppointment } from '@/hooks/appointments';
import { useClients } from '@/hooks/clients/useClients';

function readAppointmentId(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

function formatDateAndTimeRange(startsAt: Date, endsAt: Date): string {
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return 'Horario indisponivel';
  }

  const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${dateFormatter.format(startsAt)} | ${timeFormatter.format(startsAt)} - ${timeFormatter.format(endsAt)}`;
}

function formatPrice(priceCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(priceCents / 100);
}

export default function AppointmentDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ appointmentId?: string | string[] }>();
  const appointmentId = readAppointmentId(params.appointmentId);

  const appointmentQuery = useAppointment(appointmentId);
  const clientsQuery = useClients({ limitCount: 300 });

  const appointment = appointmentQuery.data;

  const clientName = useMemo(() => {
    if (!appointment) {
      return '';
    }

    const client = (clientsQuery.data ?? []).find((item) => item.id === appointment.clientId);
    return client?.name ?? 'Cliente sem cadastro';
  }, [appointment, clientsQuery.data]);

  if (appointmentQuery.isLoading || clientsQuery.isLoading) {
    return (
      <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
        <Card>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando atendimento...</Text>
        </Card>
      </View>
    );
  }

  if (appointmentQuery.error || clientsQuery.error || !appointment) {
    return (
      <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
        <Card>
          <Text className="text-sm text-error">
            {appointmentQuery.error instanceof Error
              ? appointmentQuery.error.message
              : clientsQuery.error instanceof Error
                ? clientsQuery.error.message
                : 'Atendimento nao encontrado.'}
          </Text>
        </Card>
        <View className="pt-4">
          <Button label="Voltar para atendimentos" variant="ghost" onPress={() => router.replace('../')} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-between bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
      <View className="gap-4">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{clientName}</Text>
          <Text className="text-base text-zinc-700 dark:text-zinc-200">
            {formatDateAndTimeRange(appointment.startTime, appointment.endTime)}
          </Text>
          <Text className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Valor: {formatPrice(appointment.priceCents)}
          </Text>
        </View>

        <AppointmentStatusTag status={appointment.status} />

        <Card className="gap-2">
          <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Observacoes</Text>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            {appointment.notes ? appointment.notes : 'Sem observacoes cadastradas.'}
          </Text>
        </Card>
      </View>

      <View className="gap-2">
        <Button label="Editar atendimento" onPress={() => router.push('./edit')} />
        <Button label="Voltar para lista" variant="ghost" onPress={() => router.replace('../')} />
      </View>
    </View>
  );
}
