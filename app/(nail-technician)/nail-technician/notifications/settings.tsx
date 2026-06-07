import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { OperationalMetricCard, OperationalScreenShell } from '@/components/features/shared';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useNotificationPreferences } from '@/hooks/notifications';
import { type NotificationPreferences } from '@/services/notifications';

interface PreferenceToggleItem {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}

const TOGGLE_ITEMS: PreferenceToggleItem[] = [
  {
    key: 'newAppointment',
    label: 'Novo atendimento agendado',
    description: 'Avisa quando um novo agendamento for criado para você.',
  },
  {
    key: 'appointmentCanceled',
    label: 'Atendimento cancelado',
    description: 'Avisa quando um atendimento for cancelado.',
  },
  {
    key: 'appointmentRescheduled',
    label: 'Atendimento remarcado',
    description: 'Avisa quando horário ou data forem alterados.',
  },
  {
    key: 'preReminder',
    label: 'Lembrete pré-atendimento',
    description: 'Dispara um lembrete antes do início do atendimento.',
  },
  {
    key: 'syncError',
    label: 'Erro de sincronização Google',
    description: 'Notifica quando houver falha de sincronização.',
  },
  {
    key: 'googleExpired',
    label: 'Conexão Google expirada',
    description: 'Avisa quando for necessário reconectar o Google Calendar.',
  },
];

const STATE_MESSAGES = {
  loading: 'Carregando preferências de notificação...',
  error: 'Não foi possível carregar ou salvar as preferências de notificação.',
};

const inputTheme = {
  labelClassName: 'text-zinc-200',
  inputWrapperClassName: 'rounded-2xl border-white/10 bg-white/5',
  className: 'text-zinc-100',
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

export default function NailTechnicianNotificationSettingsScreen() {
  const router = useRouter();
  const preferencesQuery = useNotificationPreferences();
  const [draftOverride, setDraftOverride] = useState<Partial<NotificationPreferences>>({});

  const draft = useMemo(
    () => ({
      ...preferencesQuery.preferences,
      ...draftOverride,
    }),
    [draftOverride, preferencesQuery.preferences],
  );

  const isBusy = preferencesQuery.isLoading || preferencesQuery.isSaving;

  const toggles = useMemo(
    () => TOGGLE_ITEMS.map((item) => ({ ...item, enabled: Boolean(draft[item.key]) })),
    [draft],
  );

  const hasChanges = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(preferencesQuery.preferences),
    [draft, preferencesQuery.preferences],
  );

  const enabledCount = toggles.filter((item) => item.enabled).length;

  const savePreferences = async () => {
    await preferencesQuery.updatePreferences({
      ...draft,
      quietHoursStart: normalizeTime(draft.quietHoursStart, '22:00'),
      quietHoursEnd: normalizeTime(draft.quietHoursEnd, '07:00'),
      preReminderMinutes: parseMinutes(String(draft.preReminderMinutes), 60),
    });
    setDraftOverride({});
  };

  return (
    <OperationalScreenShell
      title="Configurações"
      subtitle="Ajuste os alertas da central de notificações, o modo não perturbe e a antecedência dos lembretes."
      onBackPress={() => router.back()}
      backLabel="Voltar para alertas"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="pb-10"
      topSlot={
        <View className="flex-row gap-3">
          <OperationalMetricCard
            label="Alertas ativos"
            value={String(enabledCount)}
            helper="Tipos habilitados"
          />
          <OperationalMetricCard
            label="Silencioso"
            value={draft.quietHoursEnabled ? 'Ligado' : 'Desligado'}
            helper="Não perturbe"
            featured
          />
        </View>
      }
    >
      {preferencesQuery.errorMessage ? (
        <Card className="border-white/10 bg-white/5">
          <Text className="text-sm text-error" accessibilityLiveRegion="polite">
            {`${STATE_MESSAGES.error} ${preferencesQuery.errorMessage}`}
          </Text>
        </Card>
      ) : null}

      {preferencesQuery.isLoading ? (
        <Card className="border-white/10 bg-white/5" accessible accessibilityLabel={STATE_MESSAGES.loading}>
          <Text className="text-sm text-zinc-300" accessibilityLiveRegion="polite">
            {STATE_MESSAGES.loading}
          </Text>
        </Card>
      ) : null}

      {!preferencesQuery.isLoading ? (
        <View className="gap-4">
          <Card className="gap-3 border-white/10 bg-white/5">
            <Text className="text-base font-semibold text-zinc-100">Tipos de notificação</Text>
            {toggles.map((item) => (
              <View key={item.key} className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-1 gap-1">
                    <Text className="text-sm font-semibold text-zinc-100">{item.label}</Text>
                    <Text className="text-xs leading-5 text-zinc-400">{item.description}</Text>
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
                      item.enabled ? 'bg-primary' : 'bg-white/10'
                    } ${isBusy ? 'opacity-60' : 'active:opacity-90'}`}
                    accessibilityRole="switch"
                    accessibilityLabel={item.label}
                    accessibilityHint={item.description}
                    accessibilityState={{ checked: item.enabled, disabled: isBusy }}
                  >
                    <Text className={`text-xs font-semibold ${item.enabled ? 'text-white' : 'text-zinc-200'}`}>
                      {item.enabled ? 'Ativado' : 'Desativado'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </Card>

          <Card className="gap-4 border-white/10 bg-white/5">
            <Text className="text-base font-semibold text-zinc-100">Não perturbe</Text>
            <View className="rounded-[20px] border border-white/10 bg-black/20 p-4">
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-1 gap-1">
                  <Text className="text-sm font-semibold text-zinc-100">Ativar modo silencioso</Text>
                  <Text className="text-xs leading-5 text-zinc-400">
                    Durante este horário, os alertas não devem incomodar.
                  </Text>
                </View>
                <Pressable
                  disabled={isBusy}
                  onPress={() =>
                    setDraftOverride((current) => ({
                      ...current,
                      quietHoursEnabled: !draft.quietHoursEnabled,
                    }))
                  }
                  className={`rounded-full px-3 py-2 ${
                    draft.quietHoursEnabled ? 'bg-primary' : 'bg-white/10'
                  } ${isBusy ? 'opacity-60' : 'active:opacity-90'}`}
                  accessibilityRole="switch"
                  accessibilityLabel="Ativar modo silencioso"
                  accessibilityHint="Quando ativado, evita alertas push no horário configurado."
                  accessibilityState={{ checked: Boolean(draft.quietHoursEnabled), disabled: isBusy }}
                >
                  <Text className={`text-xs font-semibold ${draft.quietHoursEnabled ? 'text-white' : 'text-zinc-200'}`}>
                    {draft.quietHoursEnabled ? 'Ativado' : 'Desativado'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <Input
              label="Horário de início (HH:mm)"
              value={draft.quietHoursStart}
              editable={!isBusy}
              onBlur={() =>
                setDraftOverride((current) => ({
                  ...current,
                  quietHoursStart: normalizeTime(draft.quietHoursStart, '22:00'),
                }))
              }
              onChangeText={(value) => {
                setDraftOverride((current) => ({ ...current, quietHoursStart: value }));
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="numbers-and-punctuation"
              placeholder="22:00"
              accessibilityLabel="Horário de início do modo silencioso"
              accessibilityHint="Informe no formato HH:mm. Exemplo: 22:00."
              {...inputTheme}
            />

            <Input
              label="Horário de fim (HH:mm)"
              value={draft.quietHoursEnd}
              editable={!isBusy}
              onBlur={() =>
                setDraftOverride((current) => ({
                  ...current,
                  quietHoursEnd: normalizeTime(draft.quietHoursEnd, '07:00'),
                }))
              }
              onChangeText={(value) => {
                setDraftOverride((current) => ({ ...current, quietHoursEnd: value }));
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="numbers-and-punctuation"
              placeholder="07:00"
              accessibilityLabel="Horário de fim do modo silencioso"
              accessibilityHint="Informe no formato HH:mm. Exemplo: 07:00."
              {...inputTheme}
            />
          </Card>

          <Card className="gap-3 border-white/10 bg-white/5">
            <Text className="text-base font-semibold text-zinc-100">Lembrete pré-atendimento</Text>
            <Text className="text-xs leading-5 text-zinc-400">
              Defina em quantos minutos antes do atendimento o lembrete deve ser enviado.
            </Text>
            <Input
              label="Antecedência em minutos"
              value={String(draft.preReminderMinutes)}
              editable={!isBusy}
              onBlur={() =>
                setDraftOverride((current) => ({
                  ...current,
                  preReminderMinutes: parseMinutes(String(draft.preReminderMinutes), 60),
                }))
              }
              onChangeText={(value) => {
                setDraftOverride((current) => ({
                  ...current,
                  preReminderMinutes: parseMinutes(value, draft.preReminderMinutes),
                }));
              }}
              keyboardType="number-pad"
              accessibilityLabel="Minutos de antecedência do lembrete"
              accessibilityHint="Defina entre 5 e 1440 minutos antes do atendimento."
              {...inputTheme}
            />
          </Card>

          <View className="gap-3">
            <Button
              label={preferencesQuery.isSaving ? 'Salvando...' : 'Salvar preferências'}
              className="rounded-2xl"
              onPress={() => {
                void savePreferences();
              }}
              disabled={isBusy || !hasChanges}
            />
            <Button
              label="Voltar"
              variant="secondary"
              className="rounded-2xl"
              onPress={() => router.back()}
              disabled={preferencesQuery.isSaving}
            />
          </View>
        </View>
      ) : null}
    </OperationalScreenShell>
  );
}
