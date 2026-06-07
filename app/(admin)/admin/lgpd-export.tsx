import { useMemo, useState } from 'react';
import { ScrollView, Share, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { AdminHeader } from '@/components/features/admin';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { buildLgpdExportPackageAsync, type LgpdExportPackage } from '@/services/admin/lgpdExportService';

const adminSettingsRoute = '/admin/settings' satisfies Href;

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
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao gerar exportação.');
    } finally {
      setLoading(false);
    }
  }

  async function handleShareExport() {
    if (!jsonPreview) {
      return;
    }

    await Share.share({
      title: 'Exportação LGPD - NailFlow',
      message: jsonPreview,
    });
  }

  return (
    <View className="flex-1 bg-zinc-950 px-6 pb-8">
      <AdminHeader
        title="Exportação LGPD"
        subtitle="Gere um pacote administrativo do piloto com dados consolidados para governança e atendimento inicial de solicitações."
        activeRoute="settings"
      />

      <ScrollView className="flex-1 pt-6" contentContainerClassName="gap-4 pb-6">
        <Card className="gap-2 rounded-[24px] border-white/10 bg-white/5">
          <Text className="text-sm text-zinc-300">
            Este pacote é uma exportação administrativa para governança e atendimento inicial de solicitações.
          </Text>
          <Text className="text-sm text-zinc-300">
            Pendências futuras: arquivo dedicado, filtros por titular e automação completa de solicitações LGPD.
          </Text>
        </Card>

        {errorMessage ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-error">{errorMessage}</Text>
          </Card>
        ) : null}

        {exportPackage ? (
          <Card className="gap-2 rounded-[24px] border-white/10 bg-primary/15">
            <Text className="text-base font-semibold text-zinc-50">Resumo</Text>
            <Text className="text-sm text-zinc-100/85">
              Gerado em: {new Date(exportPackage.generatedAt).toLocaleString('pt-BR')}
            </Text>
            <Text className="text-sm text-zinc-100/85">Usuários: {exportPackage.summary.users}</Text>
            <Text className="text-sm text-zinc-100/85">Salões: {exportPackage.summary.salons}</Text>
            <Text className="text-sm text-zinc-100/85">Logs de auditoria: {exportPackage.summary.auditLogs}</Text>
          </Card>
        ) : null}

        {jsonPreview ? (
          <Card className="gap-2 rounded-[24px] border-white/10 bg-white/5">
            <Text className="text-base font-semibold text-zinc-50">Prévia JSON</Text>
            <Text className="font-mono text-xs leading-5 text-zinc-300">{jsonPreview}</Text>
          </Card>
        ) : null}
      </ScrollView>

      <View className="gap-2 pt-2">
        <Button
          label={loading ? 'Gerando exportação...' : 'Gerar exportação'}
          className="h-12 rounded-2xl"
          onPress={() => {
            void handleGenerateExport();
          }}
          disabled={loading}
        />
        <Button
          label="Compartilhar JSON"
          variant="secondary"
          className="h-12 rounded-2xl"
          onPress={() => {
            void handleShareExport();
          }}
          disabled={!jsonPreview || loading}
        />
        <Button
          label="Voltar às configurações"
          variant="ghost"
          className="h-12 rounded-2xl border-white/10 bg-white/5"
          onPress={() => router.replace(adminSettingsRoute)}
        />
      </View>
    </View>
  );
}
