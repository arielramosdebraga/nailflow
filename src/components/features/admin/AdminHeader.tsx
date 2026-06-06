import type { ReactNode } from 'react';

import { useRouter, type Href } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useAuthSession } from '@/hooks/auth/useAuthSession';

type AdminRoute =
  | 'dashboard'
  | 'salons'
  | 'users'
  | 'audit-logs'
  | 'notifications'
  | 'settings';

interface AdminHeaderProps {
  title: string;
  subtitle: string;
  activeRoute: AdminRoute;
  accessory?: ReactNode;
}

interface NavigationItem {
  key: AdminRoute;
  label: string;
  href: Href;
}

const adminLoginRoute = '/login' satisfies Href;

const navigationItems: NavigationItem[] = [
  { key: 'dashboard', label: 'Painel', href: '/admin/dashboard' },
  { key: 'salons', label: 'Salões', href: '/admin/salons' },
  { key: 'users', label: 'Usuários', href: '/admin/users' },
  { key: 'audit-logs', label: 'Logs de auditoria', href: '/admin/audit-logs' },
];

export function AdminHeader({ title, subtitle, activeRoute, accessory }: AdminHeaderProps) {
  const router = useRouter();
  const authSession = useAuthSession();

  return (
    <View className="gap-5 pt-8">
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 gap-3">
          <View className="self-start rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-2">
            <View className="flex-row items-center gap-2">
              <ShieldCheck size={14} color="#fbbf24" />
              <Text className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300">
                Super Admin
              </Text>
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-3xl font-black text-zinc-50">{title}</Text>
            <Text className="text-sm leading-6 text-zinc-300">{subtitle}</Text>
          </View>
        </View>
        {accessory ? <View>{accessory}</View> : null}
      </View>

      <View className="flex-row flex-wrap gap-2">
        {navigationItems.map((item) => {
          const isActive = item.key === activeRoute;
          return (
            <Pressable
              key={item.key}
              className={`rounded-2xl px-4 py-3 ${
                isActive ? 'bg-primary/15' : 'border border-white/10 bg-white/5'
              }`}
              onPress={() => router.replace(item.href)}
            >
              <Text
                className={`text-sm font-semibold ${
                  isActive ? 'text-primary' : 'text-zinc-300'
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        className="self-start rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
        onPress={async () => {
          await authSession.signOut();
          router.replace(adminLoginRoute);
        }}
      >
        <Text className="text-sm font-semibold text-zinc-200">
          {authSession.isLoading ? 'Encerrando sessão...' : 'Sair da área admin'}
        </Text>
      </Pressable>
    </View>
  );
}
