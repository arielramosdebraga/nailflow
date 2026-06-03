import { useMemo, useState } from 'react';
import { ScrollView, Share, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { buildLgpdExportPackageAsync, type LgpdExportPackage } from '@/services/admin/lgpdExportService';

export default function AdminLgpdExportScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exportPackage, setExportPackage] = useState<LgpdExportPackage | null>(null);

  const jsonPreview = useMemo(() => {
    if (!exportPackage) {
      return null;
    }

    return JSON.stringify(exportPackage, null, 2);
  }, [exportPackage]);

  async function handleGenerateExport() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const payload = await buildLgpdExportPackageAsync();
      setExportPackage(payload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao gerar exportacao.');
    } finally {
      setLoading(false);
    }
  }

  async function handleShareExport() {
    if (!jsonPreview) {
      return;
    }

    await Share.share({
      title: 'Exportacao LGPD - NailFlow',
      message: jsonPreview,
    });
  }

  return (
    <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
      <ScrollView className="flex-1" contentContainerClassName="gap-3 pb-6">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Exportacao LGPD</Text>
          <Text className="text-base text-zinc-600 dark:text-zinc-300">
            Gere um pacote JSON com saloes, usuarios e trilha de auditoria para uso operacional no piloto.
          </Text>
        </View>

        <Card className="gap-2">
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            Este pacote e uma exportacao administrativa para governanca e atendimento inicial de solicitacoes.
          </Text>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            Pendencias futuras: arquivo dedicado, filtros por titular e automacao completa de solicitacoes LGPD.
          </Text>
        </Card>

        {errorMessage ? (
          <Card>
            <Text className="text-sm text-error">{errorMessage}</Text>
          </Card>
        ) : null}

        {exportPackage ? (
          <Card className="gap-2">
            <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Resumo</Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">
              Gerado em: {new Date(exportPackage.generatedAt).toLocaleString('pt-BR')}
            </Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">
              Usuarios: {exportPackage.summary.users}
            </Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">
              Saloes: {exportPackage.summary.salons}
            </Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">
              Logs de auditoria: {exportPackage.summary.auditLogs}
            </Text>
          </Card>
        ) : null}

        {jsonPreview ? (
          <Card className="gap-2">
            <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Preview JSON</Text>
            <Text className="font-mono text-xs leading-5 text-zinc-600 dark:text-zinc-300">{jsonPreview}</Text>
          </Card>
        ) : null}
      </ScrollView>

      <View className="gap-2 pt-2">
        <Button
          label={loading ? 'Gerando exportacao...' : 'Gerar exportacao'}
          onPress={() => {
            void handleGenerateExport();
          }}
          disabled={loading}
        />
        <Button
          label="Compartilhar JSON"
          variant="secondary"
          onPress={() => {
            void handleShareExport();
          }}
          disabled={!jsonPreview || loading}
        />
        <Button label="Voltar as configuracoes" variant="ghost" onPress={() => router.replace('./settings')} />
      </View>
    </View>
  );
}
