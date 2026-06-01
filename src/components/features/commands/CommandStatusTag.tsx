import { Text, View } from 'react-native';

import { type CommandStatus } from '@/schemas/commands/command.schema';
import { formatCommandStatus } from '@/components/features/commands/commandFormatters';

interface CommandStatusTagProps {
  status: CommandStatus;
}

export function CommandStatusTag({ status }: CommandStatusTagProps) {
  const containerClassName =
    status === 'closed' ? 'rounded-full bg-success/20 px-3 py-1' : 'rounded-full bg-accent/20 px-3 py-1';
  const textClassName =
    status === 'closed'
      ? 'text-xs font-semibold uppercase tracking-wide text-green-700'
      : 'text-xs font-semibold uppercase tracking-wide text-amber-700';

  return (
    <View className={containerClassName}>
      <Text className={textClassName}>{formatCommandStatus(status)}</Text>
    </View>
  );
}
