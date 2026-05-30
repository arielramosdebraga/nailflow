import type { PropsWithChildren } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';

interface AuthScreenShellProps extends PropsWithChildren {
  title: string;
  subtitle: string;
}

export function AuthScreenShell({ title, subtitle, children }: AuthScreenShellProps) {
  return (
    <ScrollView
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
      contentContainerClassName="min-h-full justify-center p-6"
      keyboardShouldPersistTaps="handled"
    >
      <View className="mb-5 gap-3">
        <Tag label="NailFlow" />
        <Text className="text-3xl font-bold leading-tight text-zinc-900 dark:text-zinc-100">{title}</Text>
        <Text className="text-base text-zinc-600 dark:text-zinc-300">{subtitle}</Text>
      </View>
      <Card className="gap-4">{children}</Card>
    </ScrollView>
  );
}
