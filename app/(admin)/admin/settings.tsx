import { Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useReleaseReadiness } from '@/hooks/admin/useReleaseReadiness';

const adminRoutes = {
  dashboard: '/admin/dashboard',
  lgpdExport: '/admin/lgpd-export',
} as const satisfies Record<string, Href>;

function formatStatus(value: boolean) {
  return value ? 'Configurado' : 'Pendente';
}

function formatHealth(value: 'ok' | 'error' | 'not_configured') {
  if (value === 'ok') {
    return 'Saudavel';
  }

  if (value === 'error') {
    return 'Falha na checagem';
  }

  return 'Nao configurado';
}

export default function AdminSettingsScreen() {
  const router = useRouter();
  const readinessQuery = useReleaseReadiness();
  const snapshot = readinessQuery.data;

  return (
    <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
      <View className="gap-2 pb-4">
        <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Configuracoes globais</Text>
        <Text className="text-base text-zinc-600 dark:text-zinc-300">
          Checkpoint operacional do piloto com foco em release, integrações e readiness.
        </Text>
      </View>

      {readinessQuery.isLoading ? (
        <Card>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando readiness do ambiente...</Text>
        </Card>
      ) : null}

      {readinessQuery.error ? (
        <Card>
          <Text className="text-sm text-error">
            {readinessQuery.error instanceof Error ? readinessQuery.error.message : 'Falha ao carregar configuracoes.'}
          </Text>
        </Card>
      ) : null}

      {snapshot ? (
        <View className="gap-3">
          <Card className="gap-2">
            <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Release</Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">Versao do app: {snapshot.appVersion}</Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">Bundle iOS: {snapshot.iosBundleIdentifier}</Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">Package Android: {snapshot.androidPackage}</Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">
              EAS Project ID: {formatStatus(snapshot.easProjectIdConfigured)}
            </Text>
          </Card>

          <Card className="gap-2">
            <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Integrações</Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">
              Firebase publico: {formatStatus(snapshot.firebaseConfigured)}
            </Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">
              OAuth Google: {formatStatus(snapshot.googleAuthConfigured)}
            </Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">
              Health endpoint: {formatHealth(snapshot.functionsHealthStatus)}
            </Text>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">
              URL: {snapshot.functionsHealthUrl ?? 'Nao configurada'}
            </Text>
          </Card>

          <Card className="gap-2">
            <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Checklist de ambiente</Text>
            {snapshot.envChecklist.map((item) => (
              <Text key={item.key} className="text-sm text-zinc-600 dark:text-zinc-300">
                {item.key}: {item.configured ? 'ok' : item.required ? 'faltando' : 'opcional'}
              </Text>
            ))}
          </Card>

          <Button label="Abrir exportacao LGPD" onPress={() => router.push(adminRoutes.lgpdExport)} />
        </View>
      ) : null}

      <View className="gap-2 pt-4">
        <Button
          label="Atualizar status"
          variant="secondary"
          onPress={() => {
            void readinessQuery.refetch();
          }}
        />
        <Button label="Voltar ao painel" variant="ghost" onPress={() => router.replace(adminRoutes.dashboard)} />
      </View>
    </View>
  );
}
