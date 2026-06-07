import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  Bell,
  CalendarDays,
  LayoutGrid,
  ReceiptText,
  UsersRound,
} from "lucide-react-native";
import { Pressable, Text, TextInput, View } from "react-native";

import {
  OperationalBottomNav,
  OperationalScreenShell,
} from "@/components/features/shared";
import { Card } from "@/components/ui/Card";
import { useNotificationPreferences } from "@/hooks/notifications";
import { type NotificationPreferences } from "@/services/notifications";

interface PreferenceToggleItem {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}

const toggleItems: PreferenceToggleItem[] = [
  {
    key: "newAppointment",
    label: "Novo atendimento agendado",
    description: "Avisa quando um novo agendamento for criado para você.",
  },
  {
    key: "appointmentCanceled",
    label: "Atendimento cancelado",
    description: "Avisa quando um atendimento for cancelado.",
  },
  {
    key: "appointmentRescheduled",
    label: "Atendimento remarcado",
    description: "Avisa quando horário ou data forem alterados.",
  },
  {
    key: "preReminder",
    label: "Lembrete pré-atendimento",
    description: "Dispara um lembrete antes do início do atendimento.",
  },
  {
    key: "syncError",
    label: "Erro de sincronização com o Google",
    description: "Notifica quando houver falha na sincronização.",
  },
  {
    key: "googleExpired",
    label: "Conexão com o Google expirada",
    description: "Avisa quando for necessário reconectar o Google Agenda.",
  },
];

const stateMessages = {
  loading: "Carregando preferências de notificação...",
  error: "Não foi possível carregar ou salvar as preferências de notificação.",
} as const;

function parseMinutes(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  if (parsed < 5) {
    return 5;
  }

  if (parsed > 1440) {
    return 1440;
  }

  return parsed;
}

function normalizeTime(value: string, fallback: string): string {
  const normalized = value.trim();
  if (/^\d{2}:\d{2}$/.test(normalized)) {
    return normalized;
  }

  return fallback;
}

export default function OwnerNotificationSettingsScreen() {
  const router = useRouter();
  const preferencesQuery = useNotificationPreferences();
  const [draftOverride, setDraftOverride] = useState<
    Partial<NotificationPreferences>
  >({});

  const draft = useMemo(
    () => ({
      ...preferencesQuery.preferences,
      ...draftOverride,
    }),
    [draftOverride, preferencesQuery.preferences],
  );

  const isBusy = preferencesQuery.isLoading || preferencesQuery.isSaving;

  const toggles = useMemo(
    () =>
      toggleItems.map((item) => ({
        ...item,
        enabled: Boolean(draft[item.key]),
      })),
    [draft],
  );

  const hasChanges = useMemo(
    () =>
      JSON.stringify(draft) !== JSON.stringify(preferencesQuery.preferences),
    [draft, preferencesQuery.preferences],
  );

  const savePreferences = async () => {
    await preferencesQuery.updatePreferences({
      ...draft,
      quietHoursStart: normalizeTime(draft.quietHoursStart, "22:00"),
      quietHoursEnd: normalizeTime(draft.quietHoursEnd, "07:00"),
      preReminderMinutes: parseMinutes(String(draft.preReminderMinutes), 60),
    });
    setDraftOverride({});
  };

  return (
    <OperationalScreenShell
      title="Configurações"
      subtitle="Escolha quais alertas operacionais o salão deve receber no dia a dia."
      backLabel="Voltar"
      onBackPress={() => router.back()}
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
              onPress: () => router.push("/owner/commands"),
            },
            {
              key: "notifications",
              label: "Alertas",
              icon: Bell,
              active: true,
              onPress: () => router.replace("/owner/notifications"),
            },
          ]}
        />
      }
    >
      <View className="gap-4">
        {preferencesQuery.errorMessage ? (
          <Card className="border-white/10 bg-white/5">
            <Text
              className="text-sm text-error"
              accessibilityLiveRegion="polite"
            >
              {`${stateMessages.error} ${preferencesQuery.errorMessage}`}
            </Text>
          </Card>
        ) : null}

        {preferencesQuery.isLoading ? (
          <Card
            className="border-white/10 bg-white/5"
            accessible
            accessibilityLabel={stateMessages.loading}
          >
            <Text
              className="text-sm text-zinc-300"
              accessibilityLiveRegion="polite"
            >
              {stateMessages.loading}
            </Text>
          </Card>
        ) : null}

        {!preferencesQuery.isLoading ? (
          <View className="gap-4">
            <Card className="gap-4 rounded-[24px] border-white/10 bg-white/5">
              <Text className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Tipos de alerta
              </Text>

              <View className="gap-3">
                {toggles.map((item) => (
                  <View
                    key={item.key}
                    className="rounded-2xl border border-white/10 bg-zinc-950/60 p-4"
                  >
                    <View className="flex-row items-center justify-between gap-3">
                      <View className="flex-1 gap-1">
                        <Text className="text-sm font-semibold text-zinc-100">
                          {item.label}
                        </Text>
                        <Text className="text-xs leading-5 text-zinc-400">
                          {item.description}
                        </Text>
                      </View>

                      <Pressable
                        disabled={isBusy}
                        onPress={() =>
                          setDraftOverride((current) => ({
                            ...current,
                            [item.key]: !item.enabled,
                          }))
                        }
                        className={`rounded-full px-3 py-2 ${
                          item.enabled ? "bg-primary" : "bg-white/10"
                        } ${isBusy ? "opacity-60" : "active:opacity-90"}`}
                        accessibilityRole="switch"
                        accessibilityLabel={item.label}
                        accessibilityHint={item.description}
                        accessibilityState={{
                          checked: item.enabled,
                          disabled: isBusy,
                        }}
                      >
                        <Text
                          className={`text-xs font-semibold ${item.enabled ? "text-white" : "text-zinc-200"}`}
                        >
                          {item.enabled ? "Ativado" : "Desativado"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </Card>

            <Card className="gap-4 rounded-[24px] border-white/10 bg-white/5">
              <Text className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Modo silencioso
              </Text>

              <View className="rounded-2xl border border-white/10 bg-zinc-950/60 p-4">
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-1 gap-1 pr-3">
                    <Text className="text-sm font-semibold text-zinc-100">
                      Ativar modo silencioso
                    </Text>
                    <Text className="text-xs leading-5 text-zinc-400">
                      Durante este horário, os alertas não devem incomodar.
                    </Text>
                  </View>

                  <Pressable
                    disabled={isBusy}
                    onPress={() =>
                      setDraftOverride((current) => ({
                        ...current,
                        quietHoursEnabled: !Boolean(draft.quietHoursEnabled),
                      }))
                    }
                    className={`rounded-full px-3 py-2 ${
                      draft.quietHoursEnabled ? "bg-primary" : "bg-white/10"
                    } ${isBusy ? "opacity-60" : "active:opacity-90"}`}
                    accessibilityRole="switch"
                    accessibilityLabel="Ativar modo silencioso"
                    accessibilityHint="Quando ativado, evita alertas push no horário configurado."
                    accessibilityState={{
                      checked: Boolean(draft.quietHoursEnabled),
                      disabled: isBusy,
                    }}
                  >
                    <Text
                      className={`text-xs font-semibold ${draft.quietHoursEnabled ? "text-white" : "text-zinc-200"}`}
                    >
                      {draft.quietHoursEnabled ? "Ativado" : "Desativado"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View className="gap-3">
                <View className="gap-2">
                  <Text className="text-sm font-medium text-zinc-200">
                    Horário de início (HH:mm)
                  </Text>
                  <TextInput
                    value={draft.quietHoursStart}
                    editable={!isBusy}
                    onBlur={() =>
                      setDraftOverride((current) => ({
                        ...current,
                        quietHoursStart: normalizeTime(
                          draft.quietHoursStart,
                          "22:00",
                        ),
                      }))
                    }
                    onChangeText={(value) => {
                      setDraftOverride((current) => ({
                        ...current,
                        quietHoursStart: value,
                      }));
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="numbers-and-punctuation"
                    placeholder="22:00"
                    placeholderTextColor="#71717a"
                    accessibilityLabel="Horário de início do modo silencioso"
                    accessibilityHint="Informe no formato HH:mm. Exemplo: 22:00."
                    className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-zinc-50"
                  />
                </View>

                <View className="gap-2">
                  <Text className="text-sm font-medium text-zinc-200">
                    Horário de término (HH:mm)
                  </Text>
                  <TextInput
                    value={draft.quietHoursEnd}
                    editable={!isBusy}
                    onBlur={() =>
                      setDraftOverride((current) => ({
                        ...current,
                        quietHoursEnd: normalizeTime(
                          draft.quietHoursEnd,
                          "07:00",
                        ),
                      }))
                    }
                    onChangeText={(value) => {
                      setDraftOverride((current) => ({
                        ...current,
                        quietHoursEnd: value,
                      }));
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="numbers-and-punctuation"
                    placeholder="07:00"
                    placeholderTextColor="#71717a"
                    accessibilityLabel="Horário de término do modo silencioso"
                    accessibilityHint="Informe no formato HH:mm. Exemplo: 07:00."
                    className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-zinc-50"
                  />
                </View>
              </View>
            </Card>

            <Card className="gap-3 rounded-[24px] border-white/10 bg-white/5">
              <Text className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Lembrete
              </Text>
              <Text className="text-sm leading-6 text-zinc-300">
                Defina em quantos minutos antes do atendimento o lembrete deve
                ser enviado.
              </Text>
              <TextInput
                value={String(draft.preReminderMinutes)}
                editable={!isBusy}
                onBlur={() =>
                  setDraftOverride((current) => ({
                    ...current,
                    preReminderMinutes: parseMinutes(
                      String(draft.preReminderMinutes),
                      60,
                    ),
                  }))
                }
                onChangeText={(value) => {
                  setDraftOverride((current) => ({
                    ...current,
                    preReminderMinutes: parseMinutes(
                      value,
                      draft.preReminderMinutes,
                    ),
                  }));
                }}
                keyboardType="number-pad"
                placeholder="60"
                placeholderTextColor="#71717a"
                accessibilityLabel="Minutos de antecedência do lembrete"
                accessibilityHint="Defina entre 5 e 1440 minutos antes do atendimento."
                className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-zinc-50"
              />
            </Card>

            <Pressable
              onPress={() => void savePreferences()}
              disabled={isBusy || !hasChanges}
              className={`h-12 items-center justify-center rounded-2xl ${
                isBusy || !hasChanges
                  ? "bg-zinc-700"
                  : "bg-primary active:opacity-90"
              }`}
              accessibilityRole="button"
              accessibilityLabel="Salvar preferências de notificação"
              accessibilityHint="Aplica os ajustes desta tela."
              accessibilityState={{ disabled: isBusy || !hasChanges }}
            >
              <Text
                className={`text-base font-semibold ${isBusy || !hasChanges ? "text-zinc-300" : "text-white"}`}
              >
                {preferencesQuery.isSaving
                  ? "Salvando..."
                  : "Salvar preferências"}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </OperationalScreenShell>
  );
}
