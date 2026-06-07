import type { PropsWithChildren, ReactNode } from 'react';
import { Link, type Href } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';

interface AuthScreenShellProps extends PropsWithChildren {
  title: string;
  subtitle: string;
  eyebrow?: string;
  backHref?: Href;
  backLabel?: string;
  footer?: ReactNode;
  cardClassName?: string;
}

export function AuthScreenShell({
  title,
  subtitle,
  eyebrow,
  backHref,
  backLabel = 'Voltar',
  footer,
  cardClassName,
  children,
}: AuthScreenShellProps) {
  return (
    <ScrollView
      className="flex-1 bg-zinc-950"
      contentContainerClassName="min-h-full px-6 py-8"
      keyboardShouldPersistTaps="handled"
    >
      <View className="absolute -right-16 top-8 h-48 w-48 rounded-full bg-secondary/15" />
      <View className="absolute -left-12 top-44 h-32 w-32 rounded-full bg-primary/15" />
      <View className="absolute bottom-20 right-0 h-40 w-40 rounded-full bg-accent/10" />

      <View className="gap-6">
        {backHref ? (
          <Link href={backHref} asChild>
            <Pressable
              accessibilityRole="link"
              className="flex-row items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-4 py-2"
            >
              <ArrowLeft size={16} color="#d4d4d8" />
              <Text className="text-sm font-medium text-zinc-300">{backLabel}</Text>
            </Pressable>
          </Link>
        ) : null}

        <View className="gap-5 pt-3">
          <View className="h-20 w-20 items-center justify-center rounded-[28px] bg-primary shadow-lg shadow-primary/20">
            <Text className="text-2xl font-black tracking-[0.18em] text-white">NF</Text>
          </View>

          <View className="self-start rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2">
            <Text className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">NailFlow</Text>
          </View>

          {eyebrow ? (
            <Text className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">{eyebrow}</Text>
          ) : null}

          <View className="gap-3">
            <Text className="text-4xl font-black leading-[44px] text-zinc-50">{title}</Text>
            <Text className="text-base leading-7 text-zinc-300">{subtitle}</Text>
          </View>
        </View>

        <View className={`rounded-[28px] border border-white/10 bg-zinc-900/90 p-5 ${cardClassName ?? ''}`}>
          {children}
        </View>

        {footer ? <View className="pb-4">{footer}</View> : null}
      </View>
    </ScrollView>
  );
}
