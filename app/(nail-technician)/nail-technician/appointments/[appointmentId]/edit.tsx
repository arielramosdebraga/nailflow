import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppointmentForm, type AppointmentFormValues } from '@/components/features/appointments';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppointment, useUpdateAppointmentMutation } from '@/hooks/appointments';
import { useClients } from '@/hooks/clients/useClients';
import {
  AppointmentFormSchema,
  mapAppointmentFormToUpsertInput,
} from '@/schemas/appointments/appointment-form.schema';

function readAppointmentId(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

function parseDateTime(date: string, time: string): Date {
  const [yearPart = '', monthPart = '', dayPart = ''] = date.split('-');
  const [hoursPart = '', minutesPart = ''] = time.split(':');
  const year = Number.parseInt(yearPart, 10);
  const month = Number.parseInt(monthPart, 10);
  const day = Number.parseInt(dayPart, 10);
  const hours = Number.parseInt(hoursPart, 10);
  const minutes = Number.parseInt(minutesPart, 10);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toIsoTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export default function EditAppointmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ appointmentId?: string | string[] }>();
  const appointmentId = readAppointmentId(params.appointmentId);

  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const appointmentQuery = useAppointment(appointmentId);
  const clientsQuery = useClients({ limitCount: 300 });
  const updateAppointmentMutation = useUpdateAppointmentMutation();

  const appointment = appointmentQuery.data;

  const clientOptions = useMemo(
    () =>
      (clientsQuery.data ?? [])
        .map((client) => ({ id: client.id, name: client.name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [clientsQuery.data],
  );

  const initialValues = useMemo(() => {
    if (!appointment) {
      return undefined;
    }

    return {
      clientId: appointment.clientId,
      date: toIsoDate(appointment.startTime),
      startTime: toIsoTime(appointment.startTime),
      endTime: toIsoTime(appointment.endTime),
      status: appointment.status,
      notes: appointment.notes,
      price: (appointment.priceCents / 100).toFixed(2).replace('.', ','),
    } satisfies Partial<AppointmentFormValues>;
  }, [appointment]);

  async function handleSubmit(values: AppointmentFormValues) {
    if (!appointment) {
      setErrorMessage('Atendimento nao encontrado para atualizacao.');
      return;
    }

    const parsed = AppointmentFormSchema.safeParse({
      clientId: values.clientId,
      manicureId: appointment.manicureId,
      startTime: parseDateTime(values.date, values.startTime),
      endTime: parseDateTime(values.date, values.endTime),
      notes: values.notes,
      status: values.status,
      price: values.price,
    });

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? 'Dados invalidos para atualizar atendimento.');
      return;
    }

    setErrorMessage(undefined);
    await updateAppointmentMutation.mutateAsync({
      appointmentId,
      data: mapAppointmentFormToUpsertInput(parsed.data),
    });
    router.replace('../');
  }

  if (appointmentQuery.isLoading || clientsQuery.isLoading) {
    return (
      <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
        <Card>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando dados do atendimento...</Text>
        </Card>
      </View>
    );
  }

  if (appointmentQuery.error || clientsQuery.error || !appointment || !initialValues) {
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
          <Button label="Voltar" variant="ghost" onPress={() => router.replace('../../')} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
      contentContainerClassName="p-6 pb-10 pt-10"
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-2 pb-5">
        <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Editar atendimento</Text>
        <Text className="text-base text-zinc-600 dark:text-zinc-300">
          Atualize os dados do atendimento mantendo a agenda organizada.
        </Text>
      </View>

      <AppointmentForm
        mode="edit"
        clients={clientOptions}
        initialValues={initialValues}
        submitLabel="Salvar alteracoes"
        isSubmitting={updateAppointmentMutation.isPending}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
        onCancel={() => router.replace('../')}
      />
    </ScrollView>
  );
}
