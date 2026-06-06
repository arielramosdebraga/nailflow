import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View, type ScrollViewProps } from 'react-native';

import { ArrowLeft } from 'lucide-react-native';

interface OperationalScreenShellProps extends Omit<ScrollViewProps, 'children'> {
  title: string;
  subtitle?: string;
  children: ReactNode;
  headerAccessory?: ReactNode;
  topSlot?: ReactNode;
  footer?: ReactNode;
  backLabel?: string;
  onBackPress?: () => void;
  contentContainerClassName?: string;
}

export function OperationalScreenShell({
  title,
  subtitle,
  children,
  headerAccessory,
  topSlot,
  footer,
  backLabel = 'Voltar',
  onBackPress,
  contentContainerClassName,
  ...props
}: OperationalScreenShellProps) {
  return (
    <View className="flex-1 bg-zinc-950">
      <View className="absolute -right-16 top-10 h-40 w-40 rounded-full bg-primary/10" />
      <View className="absolute -left-12 top-32 h-28 w-28 rounded-full bg-secondary/10" />

      <ScrollView
        className="flex-1"
        contentContainerClassName={`px-5 pb-28 pt-8 ${contentContainerClassName ?? ''}`}
        {...props}
      >
        <View className="gap-5">
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1 gap-3">
              {onBackPress ? (
                <Pressable
                  onPress={onBackPress}
                  className="flex-row items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-4 py-2"
                  accessibilityRole="button"
                  accessibilityLabel={backLabel}
                >
                  <ArrowLeft size={16} color="#d4d4d8" />
                  <Text className="text-sm font-medium text-zinc-300">{backLabel}</Text>
                </Pressable>
              ) : null}

              <View className="gap-2">
                <Text className="text-3xl font-black text-zinc-50">{title}</Text>
                {subtitle ? <Text className="text-sm leading-6 text-zinc-300">{subtitle}</Text> : null}
              </View>
            </View>

            {headerAccessory ? <View className="pt-0.5">{headerAccessory}</View> : null}
          </View>

          {topSlot}

          {children}
        </View>
      </ScrollView>

      {footer ? <View className="absolute bottom-0 left-0 right-0">{footer}</View> : null}
    </View>
  );
}

interface OperationalBottomNavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  onPress: () => void;
}

interface OperationalBottomNavProps {
  items: OperationalBottomNavItem[];
}

export function OperationalBottomNav({ items }: OperationalBottomNavProps) {
  return (
    <View className="border-t border-white/10 bg-zinc-900/95 px-3 pb-6 pt-3">
      <View className="flex-row items-center justify-between gap-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Pressable
              key={item.key}
              onPress={item.onPress}
              className="flex-1 items-center gap-1 rounded-2xl px-2 py-2 active:opacity-90"
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <View
                className={`rounded-2xl px-3 py-2 ${
                  item.active ? 'bg-primary/15' : 'bg-transparent'
                }`}
              >
                <Icon size={20} color={item.active ? '#f472b6' : '#a1a1aa'} />
              </View>
              <Text
                className={`text-[11px] font-semibold ${
                  item.active ? 'text-primary' : 'text-zinc-400'
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

interface OperationalMetricCardProps {
  label: string;
  value: string;
  helper?: string;
  featured?: boolean;
}

export function OperationalMetricCard({
  label,
  value,
  helper,
  featured = false,
}: OperationalMetricCardProps) {
  return (
    <View
      className={`flex-1 rounded-[20px] border p-4 ${
        featured
          ? 'border-primary/20 bg-primary/20'
          : 'border-white/10 bg-white/5'
      }`}
    >
      <Text className={`text-xs ${featured ? 'text-zinc-100/80' : 'text-zinc-400'}`}>{label}</Text>
      <Text className="pt-2 text-2xl font-black text-zinc-50">{value}</Text>
      {helper ? (
        <Text className={`pt-1 text-xs ${featured ? 'text-zinc-100/80' : 'text-emerald-400'}`}>{helper}</Text>
      ) : null}
    </View>
  );
}

interface OperationalHeroCardProps {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}

export function OperationalHeroCard({ eyebrow, title, children }: OperationalHeroCardProps) {
  return (
    <View className="rounded-[24px] bg-fuchsia-600 px-5 py-5">
      <Text className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-100/80">{eyebrow}</Text>
      <Text className="pt-2 text-3xl font-black text-white">{title}</Text>
      {children ? <View className="pt-4">{children}</View> : null}
    </View>
  );
}
