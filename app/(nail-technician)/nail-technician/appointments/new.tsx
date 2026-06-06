import { Controller, useForm, useWatch } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { formatAppointmentStatus } from '@/components/features/appointments/appointmentFormatters';
import {
  OperationalMetricCard,
  OperationalScreenShell,
} from '@/components/features/shared';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useCreateAppointmentMutation } from '@/hooks/appointments';
import { useClients } from '@/hooks/clients/useClients';
import {
  AppointmentFormSchema,
  mapAppointmentFormToUpsertInput,
} from '@/schemas/appointments/appointment-form.schema';
import {
  type AppointmentStatus,
  type UpsertAppointmentInput,
} from '@/schemas/appointments/appointment.schema';
import { useSessionStore } from '@/stores/sessionStore';

interface AppointmentFormValues {
  clientId: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  price: string;
  notes: string;
  status: AppointmentStatus;
}

const appointmentStatuses: AppointmentStatus[] = ['scheduled', 'confirmed', 'completed', 'cancelled'];
const agendaRoute = '/nail-technician/agenda' satisfies Href;

const inputTheme = {
  labelClassName: 'text-zinc-200',
  inputWrapperClassName: 'rounded-2xl border-white/10 bg-white/5',
  className: 'text-zinc-100',
} as const;

const getAppointmentDetailsRoute = (appointmentId: string): Href => ({
  pathname: '/nail-technician/appointments/[appointmentId]',
  params: { appointmentId },
});

function formatDateInput(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTimeInput(value: Date): string {
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function parseDateTime(dateValue: string, timeValue: string): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue.trim());
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue.trim());

  if (!dateMatch || !timeMatch) {
    return null;
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  const parsed = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
    return null;
  }

  return parsed;
}

function getDefaultValues(): AppointmentFormValues {
  const startAt = new Date();
  startAt.setMinutes(0, 0, 0);
  startAt.setHours(Math.max(8, startAt.getHours() + 1));

  const endAt = new Date(startAt);
  endAt.setHours(startAt.getHours() + 1);

  return {
    clientId: '',
    startDate: formatDateInput(startAt),
    startTime: formatTimeInput(startAt),
    endDate: formatDateInput(endAt),
    endTime: formatTimeInput(endAt),
    price: '0,00',
    notes: '',
    status: 'scheduled',
  };
}

export default function NailTechnicianNewAppointmentScreen() {
  const router = useRouter();
  const userId = useSessionStore((state) => state.userId);
  const clientsQuery = useClients({ limitCount: 250 });
  const createAppointmentMutation = useCreateAppointmentMutation();
  const form = useForm<AppointmentFormValues>({
    defaultValues: getDefaultValues(),
  });

  const selectedClientId = useWatch({
    control: form.control,
    name: 'clientId',
  });
  const selectedStatus = useWatch({
    control: form.control,
    name: 'status',
  });

  const selectedClient = (clientsQuery.data ?? []).find((client) => client.id === selectedClientId) ?? null;

  function setFormMessage(message: string) {
    form.setError('root.server', { message });
  }

  async function handleSubmit(values: AppointmentFormValues) {
    if (!userId) {
      setFormMessage('Não foi possível identificar a profissional logada.');
      return;
    }

    const startAt = parseDateTime(values.startDate, values.startTime);
    const endAt = parseDateTime(values.endDate, values.endTime);

    if (!startAt || !endAt) {
      setFormMessage('Preencha data e horário no formato válido: AAAA-MM-DD e HH:mm.');
      return;
    }

    const parsed = AppointmentFormSchema.safeParse({
      clientId: values.clientId,
      manicureId: userId,
      startTime: startAt,
      endTime: endAt,
      notes: values.notes,
      price: values.price,
      status: values.status,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      if (!firstIssue) {
        setFormMessage('Falha ao validar o formulário.');
        return;
      }

      const field = firstIssue.path[0];
      if (field === 'clientId') {
        form.setError('clientId', { message: firstIssue.message });
        return;
      }

      if (field === 'price') {
        form.setError('price', { message: firstIssue.message });
        return;
      }

      setFormMessage(firstIssue.message);
      return;
    }

    try {
      const appointmentId = await createAppointmentMutation.mutateAsync(
        mapAppointmentFormToUpsertInput(parsed.data) as Omit<UpsertAppointmentInput, 'salonId'>,
      );
      router.replace(getAppointmentDetailsRoute(appointmentId));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao salvar atendimento.';
      setFormMessage(message);
    }
  }

  return (
    <OperationalScreenShell
      title="Novo atendimento"
      subtitle="Monte o atendimento com cliente, horário, valor e status inicial seguindo o mesmo fluxo operacional da sua agenda."
      onBackPress={() => router.replace(agendaRoute)}
      backLabel="Voltar para agenda"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="pb-10"
      topSlot={
        <View className="flex-row gap-3">
          <OperationalMetricCard
            label="Clientes"
            value={String(clientsQuery.data?.length ?? 0)}
            helper="Disponíveis para seleção"
          />
          <OperationalMetricCard
            label="Status inicial"
            value={formatAppointmentStatus(selectedStatus)}
            helper="Pode ser alterado depois"
            featured
          />
        </View>
      }
    >
      {!userId ? (
        <Card className="border-white/10 bg-white/5">
          <Text className="text-sm text-error">Não foi possível identificar a profissional logada.</Text>
        </Card>
      ) : null}

      {userId && clientsQuery.isLoading ? (
        <Card className="border-white/10 bg-white/5">
          <Text className="text-sm text-zinc-300">Carregando clientes...</Text>
        </Card>
      ) : null}

      {userId && clientsQuery.error ? (
        <Card className="border-white/10 bg-white/5">
          <Text className="text-sm text-error">
            {clientsQuery.error instanceof Error ? clientsQuery.error.message : 'Falha ao carregar clientes.'}
          </Text>
        </Card>
      ) : null}

      {userId && !clientsQuery.isLoading && !clientsQuery.error ? (
        <View className="gap-4">
          <Card className="gap-3 border-white/10 bg-white/5">
            <Text className="text-sm font-semibold text-zinc-100">Cliente</Text>
            {clientsQuery.data && clientsQuery.data.length > 0 ? (
              <View className="gap-2">
                {clientsQuery.data.map((client) => {
                  const isSelected = client.id === selectedClientId;

                  return (
                    <Pressable
                      key={client.id}
                      onPress={() => form.setValue('clientId', client.id, { shouldValidate: true })}
                      className={`rounded-[20px] border px-4 py-3 ${
                        isSelected ? 'border-primary bg-primary/15' : 'border-white/10 bg-black/20'
                      }`}
                    >
                      <Text className="text-sm font-semibold text-zinc-100">{client.name}</Text>
                      <Text className="pt-1 text-xs text-zinc-400">{client.phone}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text className="text-sm text-zinc-300">Nenhuma cliente cadastrada para selecionar.</Text>
            )}
            {form.formState.errors.clientId?.message ? (
              <Text className="text-sm text-error">{form.formState.errors.clientId.message}</Text>
            ) : null}
            {selectedClient ? (
              <Text className="text-xs text-zinc-400">Selecionada: {selectedClient.name}</Text>
            ) : null}
          </Card>

          <Card className="gap-4 border-white/10 bg-white/5">
            <Text className="text-sm font-semibold text-zinc-100">Horário</Text>

            <Controller
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <Input
                  label="Data inicial (AAAA-MM-DD)"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  autoCapitalize="none"
                  placeholder="2026-06-01"
                  {...inputTheme}
                />
              )}
            />

            <Controller
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <Input
                  label="Hora inicial (HH:mm)"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  autoCapitalize="none"
                  placeholder="09:00"
                  {...inputTheme}
                />
              )}
            />

            <Controller
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <Input
                  label="Data final (AAAA-MM-DD)"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  autoCapitalize="none"
                  placeholder="2026-06-01"
                  {...inputTheme}
                />
              )}
            />

            <Controller
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <Input
                  label="Hora final (HH:mm)"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  autoCapitalize="none"
                  placeholder="10:00"
                  {...inputTheme}
                />
              )}
            />
          </Card>

          <Card className="gap-4 border-white/10 bg-white/5">
            <Controller
              control={form.control}
              name="price"
              render={({ field, fieldState }) => (
                <Input
                  label="Valor (R$)"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  keyboardType="decimal-pad"
                  placeholder="0,00"
                  error={fieldState.error?.message}
                  {...inputTheme}
                />
              )}
            />

            <Controller
              control={form.control}
              name="notes"
              render={({ field, fieldState }) => (
                <Input
                  label="Observações"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Detalhes do atendimento"
                  className="h-24 py-3 text-zinc-100"
                  multiline
                  textAlignVertical="top"
                  error={fieldState.error?.message}
                  labelClassName="text-zinc-200"
                  inputWrapperClassName="rounded-2xl border-white/10 bg-white/5"
                />
              )}
            />
          </Card>

          <Card className="gap-3 border-white/10 bg-white/5">
            <Text className="text-sm font-semibold text-zinc-100">Status</Text>
            <View className="flex-row flex-wrap gap-2">
              {appointmentStatuses.map((status) => {
                const isSelected = selectedStatus === status;

                return (
                  <Pressable
                    key={status}
                    onPress={() => form.setValue('status', status, { shouldValidate: true })}
                    className={`rounded-full border px-4 py-2 ${
                      isSelected ? 'border-primary bg-primary/15' : 'border-white/10 bg-black/20'
                    }`}
                  >
                    <Text className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-zinc-200'}`}>
                      {formatAppointmentStatus(status)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {form.formState.errors.root?.server?.message ? (
            <Text className="text-sm text-error">{form.formState.errors.root.server.message}</Text>
          ) : null}

          <View className="gap-3">
            <Button
              label={createAppointmentMutation.isPending ? 'Salvando...' : 'Salvar atendimento'}
              className="rounded-2xl"
              onPress={form.handleSubmit(handleSubmit)}
              disabled={createAppointmentMutation.isPending}
            />
            <Button
              label="Cancelar"
              variant="secondary"
              className="rounded-2xl"
              onPress={() => router.replace(agendaRoute)}
              disabled={createAppointmentMutation.isPending}
            />
          </View>
        </View>
      ) : null}
    </OperationalScreenShell>
  );
}
