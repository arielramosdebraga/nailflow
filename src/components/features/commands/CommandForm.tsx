import { useEffect, useMemo } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { OperationalScreenShell } from '@/components/features/shared';
import { Input } from '@/components/ui/Input';
import { type Appointment } from '@/schemas/appointments/appointment.schema';
import { type Client } from '@/schemas/clients/client.schema';
import {
  CommandFormSchema,
  mapCommandFormToUpsertInput,
  type CommandFormInput,
} from '@/schemas/commands/command-form.schema';
import {
  type Command,
  type CommandPaymentMethod,
  type CommandStatus,
  type UpsertCommandInput,
} from '@/schemas/commands/command.schema';
import { formatDateTime, formatTime } from '@/components/features/commands/commandFormatters';
import { type UserProfile } from '@/services/users/userService';

interface CommandFormProps {
  title: string;
  description: string;
  submitLabel: string;
  isSubmitting: boolean;
  appointments: Appointment[];
  clients: Client[];
  manicures: UserProfile[];
  initialCommand?: Command | null;
  onSubmit: (data: Omit<UpsertCommandInput, 'salonId'>) => Promise<void>;
  onCancel: () => void;
}

const paymentMethods: CommandPaymentMethod[] = ['cash', 'pix', 'credit', 'debit'];

function getPaymentMethodLabel(value: CommandPaymentMethod): string {
  if (value === 'cash') {
    return 'Dinheiro';
  }

  if (value === 'pix') {
    return 'Pix';
  }

  if (value === 'credit') {
    return 'Cartão de crédito';
  }

  return 'Cartão de débito';
}

function getDefaultFormValues(initialCommand: Command | null | undefined): CommandFormInput {
  if (!initialCommand) {
    return {
      appointmentId: '',
      clientId: '',
      manicureId: '',
      items: [{ service: '', price: '', quantity: 1 }],
      paymentMethod: null,
    };
  }

  return {
    appointmentId: initialCommand.appointmentId,
    clientId: initialCommand.clientId,
    manicureId: initialCommand.manicureId,
    items: initialCommand.items.map((item) => ({
      service: item.service,
      price: item.price.toFixed(2).replace('.', ','),
      quantity: item.quantity,
    })),
    paymentMethod: initialCommand.paymentMethod,
  };
}

function getAppointmentLabel(appointment: Appointment): string {
  return `${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}`;
}

export function CommandForm({
  title,
  description,
  submitLabel,
  isSubmitting,
  appointments,
  clients,
  manicures,
  initialCommand,
  onSubmit,
  onCancel,
}: CommandFormProps) {
  const form = useForm<CommandFormInput>({
    defaultValues: getDefaultFormValues(initialCommand),
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const selectedAppointmentId = useWatch({ control: form.control, name: 'appointmentId' });
  const selectedClientId = useWatch({ control: form.control, name: 'clientId' });
  const selectedManicureId = useWatch({ control: form.control, name: 'manicureId' });
  const selectedPaymentMethod = useWatch({ control: form.control, name: 'paymentMethod' });
  const statusValue = selectedPaymentMethod ? 'closed' : initialCommand?.status ?? 'open';
  const commandStatus: CommandStatus = statusValue === 'closed' ? 'closed' : 'open';

  const selectedAppointment = useMemo(
    () => appointments.find((item) => item.id === selectedAppointmentId) ?? null,
    [appointments, selectedAppointmentId]
  );
  const selectedClient = useMemo(
    () => clients.find((item) => item.id === selectedClientId) ?? null,
    [clients, selectedClientId]
  );
  const selectedManicure = useMemo(
    () => manicures.find((item) => item.uid === selectedManicureId) ?? null,
    [manicures, selectedManicureId]
  );

  useEffect(() => {
    form.reset(getDefaultFormValues(initialCommand));
  }, [form, initialCommand]);

  function toggleStatus(status: CommandStatus) {
    if (status === 'open') {
      form.setValue('paymentMethod', null);
      return;
    }

    if (!form.getValues('paymentMethod')) {
      form.setValue('paymentMethod', 'cash');
    }
  }

  function applyAppointment(appointment: Appointment) {
    form.setValue('appointmentId', appointment.id, { shouldValidate: true });
    form.setValue('clientId', appointment.clientId, { shouldValidate: true });
    form.setValue('manicureId', appointment.manicureId, { shouldValidate: true });
  }

  async function handleSubmit(values: CommandFormInput) {
    const parsed = CommandFormSchema.safeParse(values);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      if (firstIssue) {
        form.setError('root.server', { message: firstIssue.message });
      }
      return;
    }

    try {
      const payload = mapCommandFormToUpsertInput(parsed.data, {
        status: commandStatus,
        closedAt: commandStatus === 'closed' ? initialCommand?.closedAt ?? new Date() : null,
      });
      await onSubmit(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao salvar comanda.';
      form.setError('root.server', { message });
    }
  }

  return (
    <OperationalScreenShell title={title} subtitle={description}>
      <View className="gap-4">
        <Card className="gap-3 border-white/10 bg-white/5">
          <Text className="text-sm font-semibold text-zinc-200">Atendimento</Text>
          {appointments.length === 0 ? (
            <Text className="text-sm text-zinc-300">
              Nenhum atendimento disponível para vincular.
            </Text>
          ) : (
            <View className="gap-2">
              {appointments.map((appointment) => {
                const isSelected = appointment.id === selectedAppointmentId;
                return (
                  <Pressable
                    key={appointment.id}
                    className={`rounded-[20px] border p-4 ${isSelected ? 'border-primary bg-primary/15' : 'border-white/10 bg-zinc-900/70'}`}
                    onPress={() => applyAppointment(appointment)}
                  >
                    <Text className="text-sm font-semibold text-zinc-100">
                      {getAppointmentLabel(appointment)}
                    </Text>
                    <Text className="text-xs text-zinc-400">ID: {appointment.id}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {selectedAppointment ? (
            <Text className="text-xs text-zinc-400">
              Selecionado: {formatDateTime(selectedAppointment.startTime)}
            </Text>
          ) : null}
        </Card>

        <Card className="gap-3 border-white/10 bg-white/5">
          <Text className="text-sm font-semibold text-zinc-200">Cliente</Text>
          <View className="gap-2">
            {clients.map((client) => {
              const isSelected = client.id === selectedClientId;
              return (
                <Pressable
                  key={client.id}
                  className={`rounded-[20px] border p-4 ${isSelected ? 'border-primary bg-primary/15' : 'border-white/10 bg-zinc-900/70'}`}
                  onPress={() => form.setValue('clientId', client.id, { shouldValidate: true })}
                >
                  <Text className="text-sm font-semibold text-zinc-100">{client.name}</Text>
                  <Text className="text-xs text-zinc-400">{client.phone}</Text>
                </Pressable>
              );
            })}
          </View>
          {selectedClient ? (
            <Text className="text-xs text-zinc-400">Selecionado: {selectedClient.name}</Text>
          ) : null}
        </Card>

        <Card className="gap-3 border-white/10 bg-white/5">
          <Text className="text-sm font-semibold text-zinc-200">Profissional</Text>
          <View className="gap-2">
            {manicures.map((manicure) => {
              const isSelected = manicure.uid === selectedManicureId;
              return (
                <Pressable
                  key={manicure.uid}
                  className={`rounded-[20px] border p-4 ${isSelected ? 'border-primary bg-primary/15' : 'border-white/10 bg-zinc-900/70'}`}
                  onPress={() => form.setValue('manicureId', manicure.uid, { shouldValidate: true })}
                >
                  <Text className="text-sm font-semibold text-zinc-100">
                    {manicure.displayName}
                  </Text>
                  <Text className="text-xs text-zinc-400">{manicure.email}</Text>
                </Pressable>
              );
            })}
          </View>
          {selectedManicure ? (
            <Text className="text-xs text-zinc-400">
              Selecionada: {selectedManicure.displayName}
            </Text>
          ) : null}
        </Card>

        <Card className="gap-3 border-white/10 bg-white/5">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-zinc-200">Itens da comanda</Text>
            <Button
              label="Adicionar item"
              variant="secondary"
              fullWidth={false}
              className="rounded-2xl"
              onPress={() => append({ service: '', price: '', quantity: 1 })}
            />
          </View>

          <View className="gap-4">
            {fields.map((field, index) => (
              <View key={field.id} className="gap-3 rounded-[20px] border border-white/10 bg-zinc-900/70 p-4">
                <Controller
                  control={form.control}
                  name={`items.${index}.service`}
                  render={({ field: fieldProps, fieldState }) => (
                    <Input
                      label={`Serviço ${index + 1}`}
                      value={fieldProps.value}
                      onChangeText={fieldProps.onChange}
                      onBlur={fieldProps.onBlur}
                      placeholder="Ex: Banho de gel"
                      error={fieldState.error?.message}
                      inputWrapperClassName="rounded-2xl border-white/10 bg-zinc-950"
                    />
                  )}
                />

                <Controller
                  control={form.control}
                  name={`items.${index}.price`}
                  render={({ field: fieldProps, fieldState }) => (
                    <Input
                      label="Valor"
                      value={fieldProps.value}
                      onChangeText={fieldProps.onChange}
                      onBlur={fieldProps.onBlur}
                      keyboardType="decimal-pad"
                      placeholder="0,00"
                      error={fieldState.error?.message}
                      inputWrapperClassName="rounded-2xl border-white/10 bg-zinc-950"
                    />
                  )}
                />

                <Controller
                  control={form.control}
                  name={`items.${index}.quantity`}
                  render={({ field: fieldProps, fieldState }) => (
                    <Input
                      label="Quantidade"
                      value={String(fieldProps.value)}
                      onChangeText={(text) => {
                        const digitsOnly = text.replace(/[^0-9]/g, '');
                        fieldProps.onChange(digitsOnly ? Number(digitsOnly) : 1);
                      }}
                      onBlur={fieldProps.onBlur}
                      keyboardType="number-pad"
                      placeholder="1"
                      error={fieldState.error?.message}
                      inputWrapperClassName="rounded-2xl border-white/10 bg-zinc-950"
                    />
                  )}
                />

                {fields.length > 1 ? (
                  <Button label="Remover item" variant="danger" className="rounded-2xl" onPress={() => remove(index)} />
                ) : null}
              </View>
            ))}
          </View>
        </Card>

        <Card className="gap-3 border-white/10 bg-white/5">
          <Text className="text-sm font-semibold text-zinc-200">Status</Text>
          <View className="flex-row gap-2">
            <Button
              label="Aberta"
              fullWidth={false}
              variant={commandStatus === 'open' ? 'primary' : 'ghost'}
              className={commandStatus === 'open' ? 'rounded-2xl' : 'rounded-2xl border-white/10 bg-white/5'}
              onPress={() => toggleStatus('open')}
            />
            <Button
              label="Fechada"
              fullWidth={false}
              variant={commandStatus === 'closed' ? 'primary' : 'ghost'}
              className={commandStatus === 'closed' ? 'rounded-2xl' : 'rounded-2xl border-white/10 bg-white/5'}
              onPress={() => toggleStatus('closed')}
            />
          </View>

          {commandStatus === 'closed' ? (
            <Controller
              control={form.control}
              name="paymentMethod"
              render={({ field: fieldProps }) => (
                <View className="gap-2">
                  <Text className="text-sm font-medium text-zinc-200">Pagamento</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {paymentMethods.map((method) => (
                      <Button
                        key={method}
                        label={getPaymentMethodLabel(method)}
                        fullWidth={false}
                        variant={fieldProps.value === method ? 'secondary' : 'ghost'}
                        className={fieldProps.value === method ? 'rounded-2xl' : 'rounded-2xl border-white/10 bg-white/5'}
                        onPress={() => fieldProps.onChange(method)}
                      />
                    ))}
                  </View>
                </View>
              )}
            />
          ) : null}

          {selectedPaymentMethod ? (
            <Text className="text-xs text-zinc-400">
              Pagamento selecionado: {getPaymentMethodLabel(selectedPaymentMethod)}
            </Text>
          ) : null}
        </Card>

        {form.formState.errors.root?.server?.message ? (
          <Text className="text-sm text-error">{form.formState.errors.root.server.message}</Text>
        ) : null}

        <View className="gap-2">
          <Button
            label={isSubmitting ? 'Salvando...' : submitLabel}
            className="h-12 rounded-2xl"
            onPress={form.handleSubmit(handleSubmit)}
            disabled={isSubmitting}
          />
          <Button
            label="Cancelar"
            variant="ghost"
            className="h-12 rounded-2xl border-white/10 bg-white/5"
            onPress={onCancel}
            disabled={isSubmitting}
          />
        </View>
      </View>
    </OperationalScreenShell>
  );
}
