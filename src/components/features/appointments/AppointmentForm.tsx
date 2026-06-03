import { useEffect, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
  type Appointment,
  type AppointmentStatus,
  type UpsertAppointmentInput,
} from '@/schemas/appointments/appointment.schema';
import {
  AppointmentFormSchema,
  mapAppointmentFormToUpsertInput,
} from '@/schemas/appointments/appointment-form.schema';
import { type Client } from '@/schemas/clients/client.schema';
import { formatAppointmentStatus } from '@/components/features/appointments/appointmentFormatters';

export interface AppointmentFormValues {
  clientId: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  price: string;
  notes: string;
  status: AppointmentStatus;
}

interface AppointmentFormProps {
  title: string;
  description: string;
  submitLabel: string;
  manicureId: string;
  clients: Client[];
  isSubmitting: boolean;
  initialAppointment?: Appointment | null;
  defaultDate?: string;
  onSubmit: (data: Omit<UpsertAppointmentInput, 'salonId'>) => Promise<void>;
  onCancel: () => void;
}

const appointmentStatuses: AppointmentStatus[] = ['scheduled', 'confirmed', 'completed', 'cancelled'];

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

function parseCalendarDateString(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day, 9, 0, 0, 0);

  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
    return null;
  }

  return parsed;
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

function getDefaultValues(initialAppointment: Appointment | null | undefined, defaultDate: string | undefined): AppointmentFormValues {
  if (initialAppointment) {
    return {
      clientId: initialAppointment.clientId,
      startDate: formatDateInput(initialAppointment.startTime),
      startTime: formatTimeInput(initialAppointment.startTime),
      endDate: formatDateInput(initialAppointment.endTime),
      endTime: formatTimeInput(initialAppointment.endTime),
      price: (initialAppointment.priceCents / 100).toFixed(2).replace('.', ','),
      notes: initialAppointment.notes,
      status: initialAppointment.status,
    };
  }

  const baseDate = parseCalendarDateString(defaultDate) ?? new Date();
  const startAt = new Date(baseDate);
  startAt.setMinutes(0, 0, 0);
  if (!defaultDate) {
    startAt.setHours(Math.max(8, startAt.getHours() + 1));
  }

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

export function AppointmentForm({
  title,
  description,
  submitLabel,
  manicureId,
  clients,
  isSubmitting,
  initialAppointment,
  defaultDate,
  onSubmit,
  onCancel,
}: AppointmentFormProps) {
  const form = useForm<AppointmentFormValues>({
    defaultValues: getDefaultValues(initialAppointment, defaultDate),
  });

  const selectedClientId = useWatch({
    control: form.control,
    name: 'clientId',
  });
  const selectedStatus = useWatch({
    control: form.control,
    name: 'status',
  });

  const selectedClient = useMemo(() => clients.find((item) => item.id === selectedClientId) ?? null, [clients, selectedClientId]);

  useEffect(() => {
    form.reset(getDefaultValues(initialAppointment, defaultDate));
  }, [defaultDate, form, initialAppointment]);

  function setFormMessage(message: string) {
    form.setError('root.server', { message });
  }

  async function handleSubmit(values: AppointmentFormValues) {
    const startAt = parseDateTime(values.startDate, values.startTime);
    const endAt = parseDateTime(values.endDate, values.endTime);

    if (!startAt || !endAt) {
      setFormMessage('Preencha data e horario no formato valido: AAAA-MM-DD e HH:mm.');
      return;
    }

    const parsed = AppointmentFormSchema.safeParse({
      clientId: values.clientId,
      manicureId,
      startTime: startAt,
      endTime: endAt,
      notes: values.notes,
      price: values.price,
      status: values.status,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      if (!firstIssue) {
        setFormMessage('Falha ao validar o formulario.');
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
      await onSubmit(mapAppointmentFormToUpsertInput(parsed.data));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao salvar atendimento.';
      setFormMessage(message);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
      contentContainerClassName="p-6 pb-10 pt-10"
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-2 pb-5">
        <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{title}</Text>
        <Text className="text-base text-zinc-600 dark:text-zinc-300">{description}</Text>
      </View>

      <View className="gap-4">
        <Card className="gap-3">
          <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Cliente</Text>
          {clients.length === 0 ? (
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">Nenhuma cliente cadastrada para selecionar.</Text>
          ) : (
            <View className="gap-2">
              {clients.map((client) => {
                const isSelected = client.id === selectedClientId;
                return (
                  <Pressable
                    key={client.id}
                    className={`rounded-xl border p-3 ${isSelected ? 'border-primary bg-primary/10' : 'border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900'}`}
                    onPress={() => form.setValue('clientId', client.id, { shouldValidate: true })}
                  >
                    <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{client.name}</Text>
                    <Text className="text-xs text-zinc-600 dark:text-zinc-300">{client.phone}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          {form.formState.errors.clientId?.message ? (
            <Text className="text-sm text-error">{form.formState.errors.clientId.message}</Text>
          ) : null}
          {selectedClient ? (
            <Text className="text-xs text-zinc-600 dark:text-zinc-300">Selecionada: {selectedClient.name}</Text>
          ) : null}
        </Card>

        <Card className="gap-3">
          <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Horario</Text>

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
              />
            )}
          />
        </Card>

        <Card className="gap-3">
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
              />
            )}
          />

          <Controller
            control={form.control}
            name="notes"
            render={({ field, fieldState }) => (
              <Input
                label="Observacoes"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="Detalhes do atendimento"
                className="h-24 py-3"
                multiline
                textAlignVertical="top"
                error={fieldState.error?.message}
              />
            )}
          />
        </Card>

        <Card className="gap-3">
          <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Status</Text>
          <View className="flex-row flex-wrap gap-2">
            {appointmentStatuses.map((status) => (
              <Button
                key={status}
                label={formatAppointmentStatus(status)}
                fullWidth={false}
                variant={selectedStatus === status ? 'primary' : 'ghost'}
                onPress={() => form.setValue('status', status, { shouldValidate: true })}
              />
            ))}
          </View>
        </Card>

        {form.formState.errors.root?.server?.message ? (
          <Text className="text-sm text-error">{form.formState.errors.root.server.message}</Text>
        ) : null}

        <View className="gap-2">
          <Button label={isSubmitting ? 'Salvando...' : submitLabel} onPress={form.handleSubmit(handleSubmit)} disabled={isSubmitting} />
          <Button label="Cancelar" variant="ghost" onPress={onCancel} disabled={isSubmitting} />
        </View>
      </View>
    </ScrollView>
  );
}
