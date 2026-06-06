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
  { key: 'totalSalons', label: 'Salões totais' },
  { key: 'activeSalons', label: 'Salões ativos' },
  { key: 'totalUsers', label: 'Usuários totais' },
  { key: 'superAdmins', label: 'Superadmins' },
  { key: 'salonOwners', label: 'Donos de salão' },
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
    return 'Data indisponível';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(parsed));
}

export function AdminKpiCards({ summary, generatedAt }: AdminKpiCardsProps) {
  return (
    <View className="gap-3">
      <Text className="text-sm text-zinc-400">
        Última atualização: {formatDateTime(generatedAt)}
      </Text>

      <View className="flex-row flex-wrap gap-3">
        {kpiItems.map((item, index) => (
          <Card
            key={item.key}
            className={`min-w-[48%] flex-1 gap-2 rounded-[24px] border ${
              index === 0 || index === 1
                ? 'border-primary/20 bg-primary/15'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <Text className="text-xs uppercase tracking-[0.22em] text-zinc-400">
              {item.label}
            </Text>
            <Text className="text-2xl font-black text-zinc-50">
              {formatNumber(summary[item.key])}
            </Text>
          </Card>
        ))}
      </View>
    </View>
  );
}
