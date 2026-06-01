import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { type Command } from '@/schemas/commands/command.schema';
import { CommandStatusTag } from '@/components/features/commands/CommandStatusTag';
import { formatCurrency, formatDateTime } from '@/components/features/commands/commandFormatters';

interface CommandCardProps {
  command: Command;
  clientName?: string;
  manicureName?: string;
  appointmentStartTime?: Date | null;
  onPress?: () => void;
}

export function CommandCard({
  command,
  clientName,
  manicureName,
  appointmentStartTime,
  onPress,
}: CommandCardProps) {
  const content = (
    <Card className="gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {clientName ?? command.clientId}
          </Text>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            Profissional: {manicureName ?? command.manicureId}
          </Text>
        </View>
        <CommandStatusTag status={command.status} />
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-zinc-600 dark:text-zinc-300">Total</Text>
        <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {formatCurrency(command.total)}
        </Text>
      </View>

      <View className="gap-1">
        <Text className="text-sm text-zinc-600 dark:text-zinc-300">Itens: {command.items.length}</Text>
        <Text className="text-sm text-zinc-600 dark:text-zinc-300">
          Atendimento: {formatDateTime(appointmentStartTime ?? null)}
        </Text>
      </View>
    </Card>
  );

  if (!onPress) {
    return content;
  }

  return <Pressable onPress={onPress}>{content}</Pressable>;
}
