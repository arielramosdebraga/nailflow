import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppointmentForm, type AppointmentFormValues } from '@/components/features/appointments';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useCreateAppointmentMutation } from '@/hooks/appointments';
import { useClients } from '@/hooks/clients/useClients';
import {
  AppointmentFormSchema,
  mapAppointmentFormToUpsertInput,
} from '@/schemas/appointments/appointment-form.schema';
import { useSessionStore } from '@/stores/sessionStore';

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

export default function NewAppointmentScreen() {
  const router = useRouter();
  const createAppointmentMutation = useCreateAppointmentMutation();
  const userId = useSessionStore((state) => state.userId);
  const clientsQuery = useClients({ limitCount: 300 });
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const clientOptions = useMemo(
    () =>
      (clientsQuery.data ?? [])
        .map((client) => ({ id: client.id, name: client.name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [clientsQuery.data],
  );

  async function handleSubmit(values: AppointmentFormValues) {
    if (!userId) {
      setErrorMessage('Sessao invalida. Entre novamente para continuar.');
      return;
    }

    const parsed = AppointmentFormSchema.safeParse({
      clientId: values.clientId,
      manicureId: userId,
      startTime: parseDateTime(values.date, values.startTime),
      endTime: parseDateTime(values.date, values.endTime),
      notes: values.notes,
      status: values.status,
      price: values.price,
    });

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? 'Dados invalidos para criar atendimento.');
      return;
    }

    setErrorMessage(undefined);
    const appointmentId = await createAppointmentMutation.mutateAsync(
      mapAppointmentFormToUpsertInput(parsed.data),
    );
    router.replace(`../${appointmentId}`);
  }

  return (
    <ScrollView
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
      contentContainerClassName="p-6 pb-10 pt-10"
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-2 pb-5">
        <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Novo atendimento</Text>
        <Text className="text-base text-zinc-600 dark:text-zinc-300">
          Registre os dados principais para incluir o atendimento na agenda.
        </Text>
      </View>

      {clientsQuery.error ? (
        <Card className="mb-4">
          <Text className="text-sm text-error">
            {clientsQuery.error instanceof Error ? clientsQuery.error.message : 'Falha ao carregar clientes.'}
          </Text>
        </Card>
      ) : null}

      {clientOptions.length === 0 ? (
        <Card className="mb-4 gap-3">
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            Nenhuma cliente cadastrada. Cadastre uma cliente antes de criar atendimentos.
          </Text>
          <Button label="Cadastrar cliente" variant="ghost" onPress={() => router.push('../clients/new')} />
        </Card>
      ) : null}

      <AppointmentForm
        mode="create"
        clients={clientOptions}
        submitLabel="Salvar atendimento"
        isSubmitting={createAppointmentMutation.isPending}
        errorMessage={errorMessage}
        onCancel={() => router.replace('../')}
        onSubmit={handleSubmit}
      />
    </ScrollView>
  );
}
