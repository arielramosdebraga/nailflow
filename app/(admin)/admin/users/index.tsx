import { useMemo, useState } from 'react';
import { Search } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { AdminHeader } from '@/components/features/admin';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Tag } from '@/components/ui/Tag';
import { useAdminUsers } from '@/hooks/users';

const roleLabels: Record<string, string> = {
  super_admin: 'Superadministrador',
  salon_owner: 'Dono de salão',
  nail_technician: 'Profissional',
};

type RoleFilter = 'all' | 'super_admin' | 'salon_owner' | 'nail_technician';

export default function AdminUsersScreen() {
  const usersQuery = useAdminUsers({ limitCount: 300 });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const users = useMemo(() => {
    const base = usersQuery.data ?? [];
    const normalized = searchTerm.trim().toLowerCase();

    return base.filter((item) => {
      const matchesRole = roleFilter === 'all' ? true : item.role === roleFilter;
      const matchesSearch =
        !normalized ||
        item.displayName.toLowerCase().includes(normalized) ||
        item.email.toLowerCase().includes(normalized) ||
        item.uid.toLowerCase().includes(normalized) ||
        (item.salonId ?? '').toLowerCase().includes(normalized);

      return matchesRole && matchesSearch;
    });
  }, [roleFilter, searchTerm, usersQuery.data]);

  const totalAdmins = (usersQuery.data ?? []).filter((item) => item.role === 'super_admin').length;
  const totalOwners = (usersQuery.data ?? []).filter((item) => item.role === 'salon_owner').length;

  return (
    <View className="flex-1 bg-zinc-950 px-6 pb-8">
      <AdminHeader
        title="Usuários"
        subtitle="Consulte papéis, vínculo de salão e status de acesso da base administrativa do NailFlow."
        activeRoute="users"
      />

      <View className="gap-4 pt-6">
        <View className="flex-row gap-3">
          <Card className="flex-1 rounded-[24px] border-white/10 bg-primary/15">
            <Text className="text-xs uppercase tracking-[0.22em] text-zinc-100/80">Super Admins</Text>
            <Text className="pt-2 text-2xl font-black text-zinc-50">{totalAdmins}</Text>
          </Card>
          <Card className="flex-1 rounded-[24px] border-white/10 bg-white/5">
            <Text className="text-xs uppercase tracking-[0.22em] text-zinc-400">Owners</Text>
            <Text className="pt-2 text-2xl font-black text-zinc-50">{totalOwners}</Text>
          </Card>
        </View>

        <Input
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Buscar por nome, e-mail, UID ou salão"
          returnKeyType="search"
          leftAdornment={<Search size={18} color="#a1a1aa" />}
          inputWrapperClassName="rounded-2xl border-white/10 bg-white/5"
        />

        <View className="flex-row flex-wrap gap-2">
          <Button
            label="Todos"
            fullWidth={false}
            variant={roleFilter === 'all' ? 'primary' : 'ghost'}
            className={roleFilter === 'all' ? 'rounded-2xl' : 'rounded-2xl border-white/10 bg-white/5'}
            onPress={() => setRoleFilter('all')}
          />
          <Button
            label="Super Admin"
            fullWidth={false}
            variant={roleFilter === 'super_admin' ? 'primary' : 'ghost'}
            className={roleFilter === 'super_admin' ? 'rounded-2xl' : 'rounded-2xl border-white/10 bg-white/5'}
            onPress={() => setRoleFilter('super_admin')}
          />
          <Button
            label="Owners"
            fullWidth={false}
            variant={roleFilter === 'salon_owner' ? 'primary' : 'ghost'}
            className={roleFilter === 'salon_owner' ? 'rounded-2xl' : 'rounded-2xl border-white/10 bg-white/5'}
            onPress={() => setRoleFilter('salon_owner')}
          />
          <Button
            label="Profissionais"
            fullWidth={false}
            variant={roleFilter === 'nail_technician' ? 'primary' : 'ghost'}
            className={roleFilter === 'nail_technician' ? 'rounded-2xl' : 'rounded-2xl border-white/10 bg-white/5'}
            onPress={() => setRoleFilter('nail_technician')}
          />
        </View>

        {usersQuery.isLoading ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-zinc-300">Carregando usuários...</Text>
          </Card>
        ) : null}

        {usersQuery.error ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-error">
              {usersQuery.error instanceof Error ? usersQuery.error.message : 'Falha ao carregar usuários.'}
            </Text>
          </Card>
        ) : null}

        {!usersQuery.isLoading && !usersQuery.error && users.length === 0 ? (
          <Card className="border-white/10 bg-white/5">
            <Text className="text-sm text-zinc-300">Nenhum usuário encontrado para os filtros informados.</Text>
          </Card>
        ) : null}

        {!usersQuery.isLoading && !usersQuery.error && users.length > 0 ? (
          <View className="gap-3">
            {users.map((item) => (
              <Card key={item.uid} className="gap-3 rounded-[24px] border-white/10 bg-white/5">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1 gap-1">
                    <Text className="text-base font-semibold text-zinc-50">{item.displayName}</Text>
                    <Text className="text-sm text-zinc-300">{item.email}</Text>
                  </View>
                  <Tag label={roleLabels[item.role] ?? item.role} />
                </View>

                <Text className="text-sm text-zinc-300">
                  UID: <Text className="font-semibold text-zinc-100">{item.uid}</Text>
                </Text>
                <Text className="text-sm text-zinc-300">
                  Salão: <Text className="font-semibold text-zinc-100">{item.salonId ?? 'Sem vinculação'}</Text>
                </Text>
                <Text className="text-sm text-zinc-300">
                  Status: <Text className="font-semibold text-zinc-100">{item.active ? 'Ativo' : 'Inativo'}</Text>
                </Text>
                <Text className="text-sm text-zinc-300">
                  Criado em:{' '}
                  <Text className="font-semibold text-zinc-100">
                    {item.createdAt ? item.createdAt.toLocaleString('pt-BR') : 'Não informado'}
                  </Text>
                </Text>
              </Card>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
