import { Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { AdminHeader } from '@/components/features/admin';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useReleaseReadiness } from '@/hooks/admin/useReleaseReadiness';

const adminRoutes = {
  dashboard: '/admin/dashboard',
  lgpdExport: '/admin/lgpd-export',
  notifications: '/admin/notifications',
} as const satisfies Record<string, Href>;

function formatStatus(value: boolean) {
  return value ? 'Configurado' : 'Pendente';
}

function formatHealth(value: 'ok' | 'error' | 'not_configured') {
  if (value === 'ok') {
    return 'Saudável';
  }

  if (value === 'error') {
    return 'Falha na checagem';
  }

  return 'Não configurado';
}

export default function AdminSettingsScreen() {
  const router = useRouter();
  const readinessQuery = useReleaseReadiness();
  const snapshot = readinessQuery.data;

  return (
    <View className="flex-1 bg-zinc-950 px-6 pb-8">
      <AdminHeader
        title="Configurações globais"
        subtitle="Checkpoint operacional do piloto com foco em release, integrações e readiness do ambiente."
        activeRoute="settings"
      />

      <View className="gap-4 pt-6">
        {readinessQuery.isLoading ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-zinc-300">Carregando readiness do ambiente...</Text>
          </Card>
        ) : null}

        {readinessQuery.error ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-error">
              {readinessQuery.error instanceof Error ? readinessQuery.error.message : 'Falha ao carregar configurações.'}
            </Text>
          </Card>
        ) : null}

        {snapshot ? (
          <View className="gap-4">
            <Card className="gap-3 rounded-[24px] border-white/10 bg-primary/15">
              <Text className="text-xs uppercase tracking-[0.22em] text-zinc-100/80">Release</Text>
              <Text className="text-2xl font-black text-zinc-50">{snapshot.appVersion}</Text>
              <Text className="text-sm text-zinc-100/85">
                Projeto EAS: {formatStatus(snapshot.easProjectIdConfigured)}
              </Text>
            </Card>

            <Card className="gap-2 rounded-[24px] border-white/10 bg-white/5">
              <Text className="text-base font-semibold text-zinc-50">Identificadores do app</Text>
              <Text className="text-sm text-zinc-300">iOS bundle: {snapshot.iosBundleIdentifier}</Text>
              <Text className="text-sm text-zinc-300">Android package: {snapshot.androidPackage}</Text>
            </Card>

            <Card className="gap-2 rounded-[24px] border-white/10 bg-white/5">
              <Text className="text-base font-semibold text-zinc-50">Integrações</Text>
              <Text className="text-sm text-zinc-300">Firebase público: {formatStatus(snapshot.firebaseConfigured)}</Text>
              <Text className="text-sm text-zinc-300">OAuth Google: {formatStatus(snapshot.googleAuthConfigured)}</Text>
              <Text className="text-sm text-zinc-300">Health endpoint: {formatHealth(snapshot.functionsHealthStatus)}</Text>
              <Text className="text-xs text-zinc-500">
                URL: {snapshot.functionsHealthUrl ?? 'Não configurada'}
              </Text>
            </Card>

            <Card className="gap-2 rounded-[24px] border-white/10 bg-white/5">
              <Text className="text-base font-semibold text-zinc-50">Checklist de ambiente</Text>
              {snapshot.envChecklist.map((item) => (
                <Text key={item.key} className="text-sm text-zinc-300">
                  {item.key}: {item.configured ? 'ok' : item.required ? 'faltando' : 'opcional'}
                </Text>
              ))}
            </Card>

            <View className="gap-3">
              <Button className="h-12 rounded-2xl" label="Abrir exportação LGPD" onPress={() => router.push(adminRoutes.lgpdExport)} />
              <Button
                className="h-12 rounded-2xl"
                label="Abrir notificações administrativas"
                variant="secondary"
                onPress={() => router.push(adminRoutes.notifications)}
              />
            </View>
          </View>
        ) : null}

        <View className="gap-2">
          <Button
            label="Atualizar status"
            variant="secondary"
            className="h-12 rounded-2xl"
            onPress={() => {
              void readinessQuery.refetch();
            }}
          />
          <Button
            label="Voltar ao painel"
            variant="ghost"
            className="h-12 rounded-2xl border-white/10 bg-white/5"
            onPress={() => router.replace(adminRoutes.dashboard)}
          />
        </View>
      </View>
    </View>
  );
}
