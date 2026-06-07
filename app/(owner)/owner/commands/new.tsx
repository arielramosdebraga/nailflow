import { useEffect, useMemo } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { useRouter, type Href } from "expo-router";
import { addDays, endOfDay, startOfDay, subDays } from "date-fns";
import {
  Bell,
  CalendarDays,
  LayoutGrid,
  ReceiptText,
  UsersRound,
} from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { NotificationsBellButton } from "@/components/features/notifications";
import {
  OperationalBottomNav,
  OperationalMetricCard,
  OperationalScreenShell,
} from "@/components/features/shared";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAppointments } from "@/hooks/appointments/useAppointments";
import { useClients } from "@/hooks/clients/useClients";
import { useCreateCommandMutation } from "@/hooks/commands/useCommandMutations";
import { useUnreadNotificationsCount } from "@/hooks/notifications";
import { useManicures } from "@/hooks/users/useManicures";
import { type Appointment } from "@/schemas/appointments/appointment.schema";
import {
  CommandFormSchema,
  mapCommandFormToUpsertInput,
  type CommandFormInput,
} from "@/schemas/commands/command-form.schema";
import {
  type Command,
  type CommandPaymentMethod,
  type CommandStatus,
  type UpsertCommandInput,
} from "@/schemas/commands/command.schema";
import {
  formatDateTime,
  formatTime,
} from "@/components/features/commands/commandFormatters";
import { type Client } from "@/schemas/clients/client.schema";
import { type UserProfile } from "@/services/users/userService";

const commandsListRoute = "/owner/commands" satisfies Href;

const getOwnerCommandDetailsRoute = (commandId: string): Href => ({
  pathname: "/owner/commands/[commandId]",
  params: { commandId },
});

const paymentMethods: CommandPaymentMethod[] = [
  "cash",
  "pix",
  "credit",
  "debit",
];

function getPaymentMethodLabel(value: CommandPaymentMethod): string {
  if (value === "cash") {
    return "Dinheiro";
  }

  if (value === "pix") {
    return "Pix";
  }

  if (value === "credit") {
    return "Cartão de crédito";
  }

  return "Cartão de débito";
}

function getDefaultFormValues(
  initialCommand: Command | null | undefined,
): CommandFormInput {
  if (!initialCommand) {
    return {
      appointmentId: "",
      clientId: "",
      manicureId: "",
      items: [{ service: "", price: "", quantity: 1 }],
      paymentMethod: null,
    };
  }

  return {
    appointmentId: initialCommand.appointmentId,
    clientId: initialCommand.clientId,
    manicureId: initialCommand.manicureId,
    items: initialCommand.items.map((item) => ({
      service: item.service,
      price: item.price.toFixed(2).replace(".", ","),
      quantity: item.quantity,
    })),
    paymentMethod: initialCommand.paymentMethod,
  };
}

function getAppointmentLabel(appointment: Appointment): string {
  return `${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}`;
}

interface OwnerCommandFormContentProps {
  submitLabel: string;
  isSubmitting: boolean;
  appointments: Appointment[];
  clients: Client[];
  manicures: UserProfile[];
  initialCommand?: Command | null;
  onSubmit: (data: Omit<UpsertCommandInput, "salonId">) => Promise<void>;
  onCancel: () => void;
}

function OwnerCommandFormContent({
  submitLabel,
  isSubmitting,
  appointments,
  clients,
  manicures,
  initialCommand,
  onSubmit,
  onCancel,
}: OwnerCommandFormContentProps) {
  const form = useForm<CommandFormInput>({
    defaultValues: getDefaultFormValues(initialCommand),
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const selectedAppointmentId = useWatch({
    control: form.control,
    name: "appointmentId",
  });
  const selectedClientId = useWatch({
    control: form.control,
    name: "clientId",
  });
  const selectedManicureId = useWatch({
    control: form.control,
    name: "manicureId",
  });
  const selectedPaymentMethod = useWatch({
    control: form.control,
    name: "paymentMethod",
  });
  const statusValue = selectedPaymentMethod
    ? "closed"
    : (initialCommand?.status ?? "open");
  const commandStatus: CommandStatus =
    statusValue === "closed" ? "closed" : "open";

  const selectedAppointment = useMemo(
    () =>
      appointments.find((item) => item.id === selectedAppointmentId) ?? null,
    [appointments, selectedAppointmentId],
  );
  const selectedClient = useMemo(
    () => clients.find((item) => item.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );
  const selectedManicure = useMemo(
    () => manicures.find((item) => item.uid === selectedManicureId) ?? null,
    [manicures, selectedManicureId],
  );

  useEffect(() => {
    form.reset(getDefaultFormValues(initialCommand));
  }, [form, initialCommand]);

  function toggleStatus(status: CommandStatus) {
    if (status === "open") {
      form.setValue("paymentMethod", null);
      return;
    }

    if (!form.getValues("paymentMethod")) {
      form.setValue("paymentMethod", "cash");
    }
  }

  function applyAppointment(appointment: Appointment) {
    form.setValue("appointmentId", appointment.id, { shouldValidate: true });
    form.setValue("clientId", appointment.clientId, { shouldValidate: true });
    form.setValue("manicureId", appointment.manicureId, {
      shouldValidate: true,
    });
  }

  async function handleSubmit(values: CommandFormInput) {
    const parsed = CommandFormSchema.safeParse(values);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      if (firstIssue) {
        form.setError("root.server", { message: firstIssue.message });
      }
      return;
    }

    try {
      const payload = mapCommandFormToUpsertInput(parsed.data, {
        status: commandStatus,
        closedAt:
          commandStatus === "closed"
            ? (initialCommand?.closedAt ?? new Date())
            : null,
      });
      await onSubmit(payload);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao salvar a comanda.";
      form.setError("root.server", { message });
    }
  }

  return (
    <View className="gap-4">
      <Card className="gap-3 rounded-[24px] border-white/10 bg-white/5">
        <Text className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Atendimento
        </Text>

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
                  className={`rounded-2xl border p-4 ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-white/10 bg-zinc-950/60"
                  }`}
                  onPress={() => applyAppointment(appointment)}
                >
                  <Text className="text-sm font-semibold text-zinc-100">
                    {getAppointmentLabel(appointment)}
                  </Text>
                  <Text className="pt-1 text-xs text-zinc-400">
                    ID: {appointment.id}
                  </Text>
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

      <Card className="gap-3 rounded-[24px] border-white/10 bg-white/5">
        <Text className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Cliente
        </Text>
        <View className="gap-2">
          {clients.map((client) => {
            const isSelected = client.id === selectedClientId;

            return (
              <Pressable
                key={client.id}
                className={`rounded-2xl border p-4 ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-white/10 bg-zinc-950/60"
                }`}
                onPress={() =>
                  form.setValue("clientId", client.id, { shouldValidate: true })
                }
              >
                <Text className="text-sm font-semibold text-zinc-100">
                  {client.name}
                </Text>
                <Text className="pt-1 text-xs text-zinc-400">
                  {client.phone}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {selectedClient ? (
          <Text className="text-xs text-zinc-400">
            Selecionado: {selectedClient.name}
          </Text>
        ) : null}
      </Card>

      <Card className="gap-3 rounded-[24px] border-white/10 bg-white/5">
        <Text className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Profissional
        </Text>
        <View className="gap-2">
          {manicures.map((manicure) => {
            const isSelected = manicure.uid === selectedManicureId;

            return (
              <Pressable
                key={manicure.uid}
                className={`rounded-2xl border p-4 ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-white/10 bg-zinc-950/60"
                }`}
                onPress={() =>
                  form.setValue("manicureId", manicure.uid, {
                    shouldValidate: true,
                  })
                }
              >
                <Text className="text-sm font-semibold text-zinc-100">
                  {manicure.displayName}
                </Text>
                <Text className="pt-1 text-xs text-zinc-400">
                  {manicure.email}
                </Text>
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

      <Card className="gap-3 rounded-[24px] border-white/10 bg-white/5">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Itens da comanda
          </Text>
          <Button
            label="Adicionar item"
            variant="secondary"
            fullWidth={false}
            className="rounded-2xl px-4"
            onPress={() => append({ service: "", price: "", quantity: 1 })}
          />
        </View>

        <View className="gap-4">
          {fields.map((field, index) => (
            <View
              key={field.id}
              className="gap-3 rounded-2xl border border-white/10 bg-zinc-950/60 p-4"
            >
              <Controller
                control={form.control}
                name={`items.${index}.service`}
                render={({ field: fieldProps, fieldState }) => (
                  <Input
                    label={`Serviço ${index + 1}`}
                    value={fieldProps.value}
                    onChangeText={fieldProps.onChange}
                    onBlur={fieldProps.onBlur}
                    placeholder="Ex.: Banho de gel"
                    error={fieldState.error?.message}
                    labelClassName="text-zinc-200"
                    inputWrapperClassName="rounded-2xl border-white/10 bg-white/5"
                    className="text-zinc-50"
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
                    labelClassName="text-zinc-200"
                    inputWrapperClassName="rounded-2xl border-white/10 bg-white/5"
                    className="text-zinc-50"
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
                      const digitsOnly = text.replace(/[^0-9]/g, "");
                      fieldProps.onChange(digitsOnly ? Number(digitsOnly) : 1);
                    }}
                    onBlur={fieldProps.onBlur}
                    keyboardType="number-pad"
                    placeholder="1"
                    error={fieldState.error?.message}
                    labelClassName="text-zinc-200"
                    inputWrapperClassName="rounded-2xl border-white/10 bg-white/5"
                    className="text-zinc-50"
                  />
                )}
              />

              {fields.length > 1 ? (
                <Button
                  label="Remover item"
                  variant="danger"
                  className="rounded-2xl"
                  onPress={() => remove(index)}
                />
              ) : null}
            </View>
          ))}
        </View>
      </Card>

      <Card className="gap-4 rounded-[24px] border-white/10 bg-white/5">
        <Text className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Status
        </Text>

        <View className="flex-row gap-2">
          <Pressable
            onPress={() => toggleStatus("open")}
            className={`flex-1 rounded-2xl px-4 py-3 ${commandStatus === "open" ? "bg-primary" : "border border-white/10 bg-zinc-950/60"}`}
          >
            <Text
              className={`text-center text-sm font-semibold ${commandStatus === "open" ? "text-white" : "text-zinc-200"}`}
            >
              Aberta
            </Text>
          </Pressable>

          <Pressable
            onPress={() => toggleStatus("closed")}
            className={`flex-1 rounded-2xl px-4 py-3 ${commandStatus === "closed" ? "bg-primary" : "border border-white/10 bg-zinc-950/60"}`}
          >
            <Text
              className={`text-center text-sm font-semibold ${commandStatus === "closed" ? "text-white" : "text-zinc-200"}`}
            >
              Fechada
            </Text>
          </Pressable>
        </View>

        {commandStatus === "closed" ? (
          <View className="gap-2">
            <Text className="text-sm font-medium text-zinc-200">Pagamento</Text>
            <View className="flex-row flex-wrap gap-2">
              {paymentMethods.map((method) => {
                const isSelected = selectedPaymentMethod === method;

                return (
                  <Pressable
                    key={method}
                    onPress={() => form.setValue("paymentMethod", method)}
                    className={`rounded-2xl px-4 py-3 ${isSelected ? "bg-secondary" : "border border-white/10 bg-zinc-950/60"}`}
                  >
                    <Text
                      className={`text-sm font-semibold ${isSelected ? "text-white" : "text-zinc-200"}`}
                    >
                      {getPaymentMethodLabel(method)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {selectedPaymentMethod ? (
          <Text className="text-xs text-zinc-400">
            Pagamento selecionado:{" "}
            {getPaymentMethodLabel(selectedPaymentMethod)}
          </Text>
        ) : null}
      </Card>

      {form.formState.errors.root?.server?.message ? (
        <Text className="text-sm text-error">
          {form.formState.errors.root.server.message}
        </Text>
      ) : null}

      <View className="gap-3">
        <Button
          label={isSubmitting ? "Salvando..." : submitLabel}
          className="h-12 rounded-2xl"
          onPress={form.handleSubmit(handleSubmit)}
          disabled={isSubmitting}
        />

        <Pressable
          onPress={onCancel}
          disabled={isSubmitting}
          className={`h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 ${isSubmitting ? "opacity-60" : "active:opacity-90"}`}
        >
          <Text className="text-base font-semibold text-zinc-100">
            Cancelar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function OwnerNewCommandScreen() {
  const router = useRouter();
  const unreadNotifications = useUnreadNotificationsCount();

  const createCommandMutation = useCreateCommandMutation();
  const appointmentsQuery = useAppointments({
    start: startOfDay(subDays(new Date(), 15)),
    end: endOfDay(addDays(new Date(), 7)),
    statuses: ["scheduled", "confirmed", "completed"],
    limitCount: 150,
  });
  const clientsQuery = useClients({ limitCount: 200 });
  const manicuresQuery = useManicures({ limitCount: 50 });

  async function handleSubmit(data: Omit<UpsertCommandInput, "salonId">) {
    const commandId = await createCommandMutation.mutateAsync(data);
    router.replace(getOwnerCommandDetailsRoute(commandId));
  }

  const isLoading =
    appointmentsQuery.isLoading ||
    clientsQuery.isLoading ||
    manicuresQuery.isLoading;
  const error =
    appointmentsQuery.error ??
    clientsQuery.error ??
    manicuresQuery.error ??
    null;

  return (
    <OperationalScreenShell
      title="Nova comanda"
      subtitle="Abra uma comanda vinculando atendimento, cliente, profissional e itens."
      backLabel="Voltar para comandas"
      onBackPress={() => router.replace(commandsListRoute)}
      headerAccessory={
        <NotificationsBellButton
          unreadCount={unreadNotifications.unreadCount}
          onPress={() => router.push("/owner/notifications")}
        />
      }
      topSlot={
        !isLoading && !error ? (
          <View className="flex-row gap-3">
            <OperationalMetricCard
              label="Atendimentos"
              value={String((appointmentsQuery.data ?? []).length)}
              helper="Disponíveis para vincular"
            />
            <OperationalMetricCard
              label="Profissionais"
              value={String((manicuresQuery.data ?? []).length)}
              helper="Equipe carregada"
            />
          </View>
        ) : undefined
      }
      keyboardShouldPersistTaps="handled"
      footer={
        <OperationalBottomNav
          items={[
            {
              key: "dashboard",
              label: "Painel",
              icon: LayoutGrid,
              onPress: () => router.push("/owner/dashboard"),
            },
            {
              key: "agenda",
              label: "Agenda",
              icon: CalendarDays,
              onPress: () => router.push("/owner/agenda"),
            },
            {
              key: "manicures",
              label: "Equipe",
              icon: UsersRound,
              onPress: () => router.push("/owner/manicures"),
            },
            {
              key: "commands",
              label: "Comandas",
              icon: ReceiptText,
              active: true,
              onPress: () => router.replace("/owner/commands"),
            },
            {
              key: "notifications",
              label: "Alertas",
              icon: Bell,
              onPress: () => router.push("/owner/notifications"),
            },
          ]}
        />
      }
    >
      <View className="gap-4">
        {isLoading ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-zinc-300">
              Carregando dados da comanda...
            </Text>
          </Card>
        ) : null}

        {error ? (
          <View className="gap-4">
            <Card className="border-white/10 bg-white/5">
              <Text className="text-sm text-error">
                {error instanceof Error
                  ? error.message
                  : "Falha ao carregar os dados da comanda."}
              </Text>
            </Card>
            <Pressable
              onPress={() => router.replace(commandsListRoute)}
              className="h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 active:opacity-90"
            >
              <Text className="text-base font-semibold text-zinc-100">
                Voltar para comandas
              </Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoading && !error ? (
          <OwnerCommandFormContent
            submitLabel="Salvar comanda"
            isSubmitting={createCommandMutation.isPending}
            appointments={appointmentsQuery.data ?? []}
            clients={clientsQuery.data ?? []}
            manicures={manicuresQuery.data ?? []}
            onSubmit={handleSubmit}
            onCancel={() => router.replace(commandsListRoute)}
          />
        ) : null}
      </View>
    </OperationalScreenShell>
  );
}
