import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import type { AppointmentStatus } from '@/schemas/appointments/appointment.schema';

import { getAppointmentStatusLabel } from './AppointmentStatusTag';

export interface AppointmentFormValues {
  clientId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  price: string;
  notes: string;
}

export interface AppointmentClientOption {
  id: string;
  name: string;
}

interface AppointmentFormProps {
  mode: 'create' | 'edit';
  clients: AppointmentClientOption[];
  initialValues?: Partial<AppointmentFormValues>;
  submitLabel: string;
  isSubmitting?: boolean;
  errorMessage?: string;
  onSubmit: (values: AppointmentFormValues) => Promise<void> | void;
  onCancel: () => void;
}

const statusOptions: AppointmentStatus[] = ['scheduled', 'confirmed', 'completed', 'cancelled'];

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^\d{2}:\d{2}$/;

function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDefaultValues(initialValues?: Partial<AppointmentFormValues>): AppointmentFormValues {
  return {
    clientId: initialValues?.clientId ?? '',
    date: initialValues?.date ?? getTodayIsoDate(),
    startTime: initialValues?.startTime ?? '09:00',
    endTime: initialValues?.endTime ?? '10:00',
    status: initialValues?.status ?? 'scheduled',
    price: initialValues?.price ?? '0',
    notes: initialValues?.notes ?? '',
  };
}

function validateValues(values: AppointmentFormValues): Partial<Record<keyof AppointmentFormValues, string>> {
  const errors: Partial<Record<keyof AppointmentFormValues, string>> = {};

  if (!values.clientId.trim()) {
    errors.clientId = 'Selecione uma cliente.';
  }

  if (!isoDatePattern.test(values.date)) {
    errors.date = 'Use o formato AAAA-MM-DD.';
  }

  if (!timePattern.test(values.startTime)) {
    errors.startTime = 'Use o formato HH:mm.';
  }

  if (!timePattern.test(values.endTime)) {
    errors.endTime = 'Use o formato HH:mm.';
  }

  if (!errors.startTime && !errors.endTime && values.startTime >= values.endTime) {
    errors.endTime = 'O horario final deve ser maior que o inicial.';
  }

  const normalizedPrice = values.price.trim().replace(/\./g, '').replace(',', '.');
  const parsedPrice = Number.parseFloat(normalizedPrice);
  if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
    errors.price = 'Informe um valor valido.';
  }

  return errors;
}

export function AppointmentForm({
  mode,
  clients,
  initialValues,
  submitLabel,
  isSubmitting,
  errorMessage,
  onSubmit,
  onCancel,
}: AppointmentFormProps) {
  const form = useForm<AppointmentFormValues>({
    defaultValues: getDefaultValues(initialValues),
  });

  async function handleSubmit(values: AppointmentFormValues) {
    const validationErrors = validateValues(values);
    const fields = Object.entries(validationErrors) as [keyof AppointmentFormValues, string][];
    if (fields.length > 0) {
      for (const [field, message] of fields) {
        form.setError(field, { message });
      }
      return;
    }

    try {
      await onSubmit(values);
    } catch (error) {
      const fallbackMessage = mode === 'create' ? 'Falha ao criar atendimento.' : 'Falha ao atualizar atendimento.';
      const message = error instanceof Error ? error.message : fallbackMessage;
      form.setError('root', { message });
    }
  }

  return (
    <Card className="gap-4">
      <Controller
        control={form.control}
        name="clientId"
        render={({ field, fieldState }) => (
          <View className="gap-2">
            <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Cliente</Text>
            {clients.length === 0 ? (
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                Cadastre uma cliente para criar atendimentos.
              </Text>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {clients.map((client) => {
                  const isSelected = field.value === client.id;
                  return (
                    <Button
                      key={client.id}
                      label={client.name}
                      variant={isSelected ? 'primary' : 'ghost'}
                      fullWidth={false}
                      className="h-10 px-3"
                      onPress={() => field.onChange(client.id)}
                    />
                  );
                })}
              </View>
            )}
            {fieldState.error?.message ? (
              <Text className="text-sm text-error">{fieldState.error.message}</Text>
            ) : null}
          </View>
        )}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Controller
            control={form.control}
            name="date"
            render={({ field, fieldState }) => (
              <Input
                label="Data"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="AAAA-MM-DD"
                autoCapitalize="none"
                error={fieldState.error?.message}
              />
            )}
          />
        </View>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Controller
            control={form.control}
            name="startTime"
            render={({ field, fieldState }) => (
              <Input
                label="Inicio"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="09:00"
                keyboardType="numbers-and-punctuation"
                error={fieldState.error?.message}
              />
            )}
          />
        </View>

        <View className="flex-1">
          <Controller
            control={form.control}
            name="endTime"
            render={({ field, fieldState }) => (
              <Input
                label="Fim"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="10:00"
                keyboardType="numbers-and-punctuation"
                error={fieldState.error?.message}
              />
            )}
          />
        </View>
      </View>

      <Controller
        control={form.control}
        name="price"
        render={({ field, fieldState }) => (
          <Input
            label="Valor (R$)"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="120,00"
            keyboardType="numbers-and-punctuation"
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={form.control}
        name="status"
        render={({ field }) => (
          <View className="gap-2">
            <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Status</Text>
            <View className="flex-row flex-wrap gap-2">
              {statusOptions.map((status) => {
                const isSelected = field.value === status;
                return (
                  <Button
                    key={status}
                    label={getAppointmentStatusLabel(status)}
                    variant={isSelected ? 'primary' : 'ghost'}
                    fullWidth={false}
                    className="h-10 px-3"
                    onPress={() => field.onChange(status)}
                  />
                );
              })}
            </View>
          </View>
        )}
      />

      <Controller
        control={form.control}
        name="notes"
        render={({ field, fieldState }) => (
          <Input
            label="Observacoes (opcional)"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="Preferencias ou detalhes do atendimento"
            error={fieldState.error?.message}
          />
        )}
      />

      {errorMessage ? <Text className="text-sm text-error">{errorMessage}</Text> : null}
      {form.formState.errors.root?.message ? (
        <Text className="text-sm text-error">{form.formState.errors.root.message}</Text>
      ) : null}

      <View className="gap-2">
        <Button
          label={isSubmitting ? 'Salvando...' : submitLabel}
          onPress={form.handleSubmit(handleSubmit)}
          disabled={isSubmitting}
        />
        <Button label="Cancelar" variant="ghost" onPress={onCancel} disabled={isSubmitting} />
      </View>
    </Card>
  );
}
