import { useMemo, useState } from 'react';
import { Search } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { AdminHeader } from '@/components/features/admin';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useSalons } from '@/hooks/salons/useSalons';

type StatusFilter = 'all' | 'active' | 'inactive';

export default function AdminSalonsScreen() {
  const salonsQuery = useSalons({ limitCount: 250 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const salons = useMemo(() => {
    const base = salonsQuery.data ?? [];
    const normalized = searchTerm.trim().toLowerCase();

    return base.filter((salon) => {
      const matchesStatus =
        statusFilter === 'all' ? true : statusFilter === 'active' ? salon.active : !salon.active;

      const matchesSearch =
        !normalized ||
        salon.name.toLowerCase().includes(normalized) ||
        salon.id.toLowerCase().includes(normalized) ||
        (salon.ownerId ?? '').toLowerCase().includes(normalized) ||
        salon.timezone.toLowerCase().includes(normalized);

      return matchesStatus && matchesSearch;
    });
  }, [salonsQuery.data, searchTerm, statusFilter]);

  const activeCount = (salonsQuery.data ?? []).filter((item) => item.active).length;
  const inactiveCount = (salonsQuery.data ?? []).filter((item) => !item.active).length;

  return (
    <View className="flex-1 bg-zinc-950 px-6 pb-8">
      <AdminHeader
        title="Salões"
        subtitle="Filtre a base por status, localização operacional e vínculo de owner sem criar queries novas."
        activeRoute="salons"
      />

      <View className="gap-4 pt-6">
        <View className="flex-row gap-3">
          <Card className="flex-1 rounded-[24px] border-white/10 bg-primary/15">
            <Text className="text-xs uppercase tracking-[0.22em] text-zinc-100/80">Ativos</Text>
            <Text className="pt-2 text-2xl font-black text-zinc-50">{activeCount}</Text>
          </Card>
          <Card className="flex-1 rounded-[24px] border-white/10 bg-white/5">
            <Text className="text-xs uppercase tracking-[0.22em] text-zinc-400">Inativos</Text>
            <Text className="pt-2 text-2xl font-black text-zinc-50">{inactiveCount}</Text>
          </Card>
        </View>

        <Input
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Buscar por nome, ID, owner ou timezone"
          returnKeyType="search"
          leftAdornment={<Search size={18} color="#a1a1aa" />}
          inputWrapperClassName="rounded-2xl border-white/10 bg-white/5"
        />

        <View className="flex-row flex-wrap gap-2">
          <Button
            label="Todos"
            fullWidth={false}
            variant={statusFilter === 'all' ? 'primary' : 'ghost'}
            className={statusFilter === 'all' ? 'rounded-2xl' : 'rounded-2xl border-white/10 bg-white/5'}
            onPress={() => setStatusFilter('all')}
          />
          <Button
            label="Ativos"
            fullWidth={false}
            variant={statusFilter === 'active' ? 'primary' : 'ghost'}
            className={statusFilter === 'active' ? 'rounded-2xl' : 'rounded-2xl border-white/10 bg-white/5'}
            onPress={() => setStatusFilter('active')}
          />
          <Button
            label="Inativos"
            fullWidth={false}
            variant={statusFilter === 'inactive' ? 'primary' : 'ghost'}
            className={statusFilter === 'inactive' ? 'rounded-2xl' : 'rounded-2xl border-white/10 bg-white/5'}
            onPress={() => setStatusFilter('inactive')}
          />
        </View>

        {salonsQuery.isLoading ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-zinc-300">Carregando salões...</Text>
          </Card>
        ) : null}

        {salonsQuery.error ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-error">
              {salonsQuery.error instanceof Error ? salonsQuery.error.message : 'Falha ao carregar salões.'}
            </Text>
          </Card>
        ) : null}

        {!salonsQuery.isLoading && !salonsQuery.error && salons.length === 0 ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-zinc-300">Nenhum salão encontrado para os filtros informados.</Text>
          </Card>
        ) : null}

        {!salonsQuery.isLoading && !salonsQuery.error && salons.length > 0 ? (
          <View className="gap-3">
            {salons.map((item) => (
              <Card key={item.id} className="gap-3 rounded-[24px] border-white/10 bg-white/5">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1 gap-1">
                    <Text className="text-base font-semibold text-zinc-50">{item.name}</Text>
                    <Text className="text-xs text-zinc-400">ID: {item.id}</Text>
                  </View>
                  <View
                    className={`rounded-full px-3 py-1 ${
                      item.active ? 'bg-emerald-400/15' : 'bg-amber-400/15'
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-semibold uppercase tracking-wide ${
                        item.active ? 'text-emerald-300' : 'text-amber-300'
                      }`}
                    >
                      {item.active ? 'Ativo' : 'Inativo'}
                    </Text>
                  </View>
                </View>

                <Text className="text-sm text-zinc-300">
                  Owner: <Text className="font-semibold text-zinc-100">{item.ownerId ?? 'Não vinculado'}</Text>
                </Text>
                <Text className="text-sm text-zinc-300">
                  Timezone: <Text className="font-semibold text-zinc-100">{item.timezone}</Text>
                </Text>
                <Text className="text-sm text-zinc-300">
                  Moeda: <Text className="font-semibold text-zinc-100">{item.currency}</Text>
                </Text>
              </Card>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
