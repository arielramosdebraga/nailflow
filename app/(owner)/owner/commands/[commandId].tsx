import { Alert, Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import {
  Bell,
  CalendarDays,
  LayoutGrid,
  ReceiptText,
  UsersRound,
} from "lucide-react-native";

import { NotificationsBellButton } from "@/components/features/notifications";
import {
  OperationalBottomNav,
  OperationalMetricCard,
  OperationalScreenShell,
} from "@/components/features/shared";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAppointment } from "@/hooks/appointments/useAppointment";
import { useClient } from "@/hooks/clients/useClient";
import { useCommand } from "@/hooks/commands/useCommand";
import { useUpdateCommandMutation } from "@/hooks/commands/useCommandMutations";
import { useUnreadNotificationsCount } from "@/hooks/notifications";
import { useManicures } from "@/hooks/users/useManicures";
import { type CommandPaymentMethod } from "@/schemas/commands/command.schema";
import {
  formatCurrency,
  formatTime,
} from "@/components/features/commands/commandFormatters";

const commandsListRoute = "/owner/commands" satisfies Href;

const getOwnerCommandEditRoute = (commandId: string): Href => ({
  pathname: "/owner/commands/[commandId]/edit",
  params: { commandId },
});

function formatCommandStatusLabel(status: "open" | "closed"): string {
  return status === "closed" ? "Fechada" : "Aberta";
}

function formatPaymentMethodLabel(
  paymentMethod: CommandPaymentMethod | null,
): string {
  if (!paymentMethod) {
    return "Não informado";
  }

  if (paymentMethod === "cash") {
    return "Dinheiro";
  }

  if (paymentMethod === "pix") {
    return "Pix";
  }

  if (paymentMethod === "credit") {
    return "Cartão de crédito";
  }

  return "Cartão de débito";
}

function formatDateTimeLabel(value: Date | null): string {
  if (!value) {
    return "Não informado";
  }

  return value.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OwnerCommandDetailsScreen() {
  const router = useRouter();
  const unreadNotifications = useUnreadNotificationsCount();
  const params = useLocalSearchParams<{ commandId?: string | string[] }>();
  const commandId =
    typeof params.commandId === "string" ? params.commandId : undefined;

  const commandQuery = useCommand(commandId);
  const command = commandQuery.data;

  const clientQuery = useClient(command?.clientId);
  const appointmentQuery = useAppointment(command?.appointmentId);
  const manicuresQuery = useManicures({ limitCount: 50 });
  const updateCommandMutation = useUpdateCommandMutation();

  const manicure =
    (manicuresQuery.data ?? []).find(
      (item) => item.uid === command?.manicureId,
    ) ?? null;

  async function closeCommand(paymentMethod: CommandPaymentMethod) {
    if (!command) {
      return;
    }

    try {
      await updateCommandMutation.mutateAsync({
        commandId: command.id,
        data: {
          appointmentId: command.appointmentId,
          clientId: command.clientId,
          manicureId: command.manicureId,
          items: command.items,
          paymentMethod,
          status: "closed",
          closedAt: new Date(),
        },
      });
    } catch (error) {
      Alert.alert(
        "Erro",
        error instanceof Error ? error.message : "Falha ao fechar a comanda.",
      );
    }
  }

  function handleCloseCommand() {
    Alert.alert("Fechar comanda", "Selecione a forma de pagamento.", [
      { text: "Dinheiro", onPress: () => void closeCommand("cash") },
      { text: "Pix", onPress: () => void closeCommand("pix") },
      { text: "Crédito", onPress: () => void closeCommand("credit") },
      { text: "Débito", onPress: () => void closeCommand("debit") },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  const isLoading =
    commandQuery.isLoading ||
    manicuresQuery.isLoading ||
    clientQuery.isLoading ||
    appointmentQuery.isLoading;
  const error =
    commandQuery.error ??
    clientQuery.error ??
    appointmentQuery.error ??
    manicuresQuery.error ??
    null;

  if (isLoading) {
    return (
      <OperationalScreenShell
        title="Comanda"
        subtitle="Carregando os dados operacionais da comanda."
        backLabel="Voltar para comandas"
        onBackPress={() => router.replace(commandsListRoute)}
        headerAccessory={
          <NotificationsBellButton
            unreadCount={unreadNotifications.unreadCount}
            onPress={() => router.push("/owner/notifications")}
          />
        }
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
        <Card className="border-white/10 bg-white/5">
          <Text className="text-sm text-zinc-300">Carregando comanda...</Text>
        </Card>
      </OperationalScreenShell>
    );
  }

  if (error) {
    return (
      <OperationalScreenShell
        title="Comanda"
        subtitle="Não foi possível carregar as informações desta comanda."
        backLabel="Voltar para comandas"
        onBackPress={() => router.replace(commandsListRoute)}
        headerAccessory={
          <NotificationsBellButton
            unreadCount={unreadNotifications.unreadCount}
            onPress={() => router.push("/owner/notifications")}
          />
        }
      >
        <View className="gap-4">
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-error">
              {error instanceof Error
                ? error.message
                : "Falha ao carregar a comanda."}
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
      </OperationalScreenShell>
    );
  }

  if (!command) {
    return (
      <OperationalScreenShell
        title="Comanda não encontrada"
        subtitle="A comanda solicitada não está disponível ou foi removida."
        backLabel="Voltar para comandas"
        onBackPress={() => router.replace(commandsListRoute)}
      >
        <View className="gap-4">
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-zinc-300">
              Nenhuma comanda foi encontrada para este identificador.
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
      </OperationalScreenShell>
    );
  }

  const clientName = clientQuery.data?.name ?? command.clientId;
  const appointment = appointmentQuery.data;

  return (
    <OperationalScreenShell
      title={clientName}
      subtitle={`Comanda #${command.id}`}
      backLabel="Voltar para comandas"
      onBackPress={() => router.replace(commandsListRoute)}
      headerAccessory={
        <NotificationsBellButton
          unreadCount={unreadNotifications.unreadCount}
          onPress={() => router.push("/owner/notifications")}
        />
      }
      topSlot={
        <View className="flex-row gap-3">
          <OperationalMetricCard
            label="Status"
            value={formatCommandStatusLabel(command.status)}
            helper={formatPaymentMethodLabel(command.paymentMethod)}
            featured={command.status === "closed"}
          />
          <OperationalMetricCard
            label="Total"
            value={formatCurrency(command.total)}
            helper={`${command.items.length} item(ns)`}
          />
        </View>
      }
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
        <Card className="gap-3 rounded-[24px] border-white/10 bg-white/5">
          <Text className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Resumo
          </Text>
          <View className="gap-2">
            <Text className="text-sm text-zinc-300">
              Status:{" "}
              <Text className="font-semibold text-zinc-50">
                {formatCommandStatusLabel(command.status)}
              </Text>
            </Text>
            <Text className="text-sm text-zinc-300">
              Pagamento:{" "}
              <Text className="font-semibold text-zinc-50">
                {formatPaymentMethodLabel(command.paymentMethod)}
              </Text>
            </Text>
            <Text className="text-sm text-zinc-300">
              Criada em:{" "}
              <Text className="font-semibold text-zinc-50">
                {formatDateTimeLabel(command.createdAt)}
              </Text>
            </Text>
            <Text className="text-sm text-zinc-300">
              Fechada em:{" "}
              <Text className="font-semibold text-zinc-50">
                {formatDateTimeLabel(command.closedAt)}
              </Text>
            </Text>
          </View>
        </Card>

        <Card className="gap-3 rounded-[24px] border-white/10 bg-white/5">
          <Text className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Atendimento
          </Text>
          <View className="gap-2">
            <Text className="text-sm text-zinc-300">
              Horário:{" "}
              <Text className="font-semibold text-zinc-50">
                {appointment
                  ? `${formatDateTimeLabel(appointment.startTime)} às ${formatTime(appointment.endTime)}`
                  : "Não encontrado"}
              </Text>
            </Text>
            <Text className="text-sm text-zinc-300">
              Profissional:{" "}
              <Text className="font-semibold text-zinc-50">
                {manicure?.displayName ?? command.manicureId}
              </Text>
            </Text>
          </View>
        </Card>

        <Card className="gap-3 rounded-[24px] border-white/10 bg-white/5">
          <Text className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Itens
          </Text>
          <View className="gap-3">
            {command.items.map((item, index) => {
              const lineTotal = item.price * item.quantity;

              return (
                <View
                  key={`${item.service}-${index}`}
                  className="rounded-2xl border border-white/10 bg-zinc-950/60 p-4"
                >
                  <Text className="text-sm font-semibold text-zinc-100">
                    {item.service}
                  </Text>
                  <Text className="pt-1 text-sm text-zinc-300">
                    {item.quantity}x {formatCurrency(item.price)} ={" "}
                    {formatCurrency(lineTotal)}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text className="text-base font-semibold text-zinc-50">
            Total: {formatCurrency(command.total)}
          </Text>
        </Card>

        <View className="gap-3">
          <Button
            label="Editar comanda"
            className="h-12 rounded-2xl"
            onPress={() => router.push(getOwnerCommandEditRoute(command.id))}
          />

          {command.status === "open" ? (
            <Button
              label={
                updateCommandMutation.isPending
                  ? "Fechando..."
                  : "Fechar comanda"
              }
              variant="secondary"
              className="h-12 rounded-2xl"
              onPress={handleCloseCommand}
              disabled={updateCommandMutation.isPending}
            />
          ) : null}

          <Pressable
            onPress={() => router.replace(commandsListRoute)}
            className="h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 active:opacity-90"
          >
            <Text className="text-base font-semibold text-zinc-100">
              Voltar para comandas
            </Text>
          </Pressable>
        </View>
      </View>
    </OperationalScreenShell>
  );
}
