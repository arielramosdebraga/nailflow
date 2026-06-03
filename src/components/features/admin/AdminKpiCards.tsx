import { Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { type GlobalDashboardSummary } from '@/services/admin';

interface AdminKpiCardsProps {
  summary: GlobalDashboardSummary;
  generatedAt: string;
}

interface KpiItem {
  key: keyof GlobalDashboardSummary;
  label: string;
}

const kpiItems: KpiItem[] = [
  { key: 'totalSalons', label: 'Saloes totais' },
  { key: 'activeSalons', label: 'Saloes ativos' },
  { key: 'totalUsers', label: 'Usuarios totais' },
  { key: 'superAdmins', label: 'Superadmins' },
  { key: 'salonOwners', label: 'Donos de salao' },
  { key: 'nailTechnicians', label: 'Profissionais' },
  { key: 'totalClients', label: 'Clientes' },
  { key: 'totalAppointments', label: 'Agendamentos' },
];

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function formatDateTime(value: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return 'Data indisponivel';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(parsed));
}

export function AdminKpiCards({ summary, generatedAt }: AdminKpiCardsProps) {
  return (
    <View className="gap-3">
      <Text className="text-sm text-zinc-500 dark:text-zinc-400">
        Ultima atualizacao: {formatDateTime(generatedAt)}
      </Text>

      <View className="flex-row flex-wrap gap-3">
        {kpiItems.map((item) => (
          <Card key={item.key} className="min-w-[48%] flex-1 gap-1">
            <Text className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {item.label}
            </Text>
            <Text className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {formatNumber(summary[item.key])}
            </Text>
          </Card>
        ))}
      </View>
    </View>
  );
}
