import type { ReactNode } from 'react';

import { useRouter, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useAuthSession } from '@/hooks/auth/useAuthSession';

type AdminRoute = 'dashboard' | 'audit-logs';

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
  { key: 'dashboard', label: 'Dashboard', href: '/admin/dashboard' },
  { key: 'audit-logs', label: 'Logs de auditoria', href: '/admin/audit-logs' },
];

export function AdminHeader({ title, subtitle, activeRoute, accessory }: AdminHeaderProps) {
  const router = useRouter();
  const authSession = useAuthSession();

  return (
    <View className="gap-4 pt-10">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-2">
          <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{title}</Text>
          <Text className="text-base text-zinc-600 dark:text-zinc-300">{subtitle}</Text>
        </View>
        {accessory ? <View>{accessory}</View> : null}
      </View>

      <View className="flex-row flex-wrap gap-2">
        {navigationItems.map((item) => {
          const isActive = item.key === activeRoute;
          return (
            <Pressable
              key={item.key}
              className={`rounded-xl px-4 py-2 ${isActive ? 'bg-zinc-900 dark:bg-zinc-100' : 'border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900'}`}
              onPress={() => router.replace(item.href)}
            >
              <Text
                className={`text-sm font-semibold ${isActive ? 'text-zinc-100 dark:text-zinc-900' : 'text-zinc-700 dark:text-zinc-200'}`}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        className="self-start rounded-xl border border-zinc-300 bg-white px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        onPress={async () => {
          await authSession.signOut();
          router.replace(adminLoginRoute);
        }}
      >
        <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {authSession.isLoading ? 'Encerrando sessao...' : 'Sair da area admin'}
        </Text>
      </Pressable>
    </View>
  );
}
