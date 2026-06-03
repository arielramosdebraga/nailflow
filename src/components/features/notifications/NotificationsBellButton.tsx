import { Pressable, Text, View } from 'react-native';

import { Bell } from 'lucide-react-native';

interface NotificationsBellButtonProps {
  unreadCount: number;
  onPress: () => void;
}

function formatUnreadCount(value: number): string {
  if (value > 99) {
    return '99+';
  }

  return String(value);
}

export function NotificationsBellButton({
  unreadCount,
  onPress,
}: NotificationsBellButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="relative h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white active:opacity-90 dark:border-zinc-800 dark:bg-zinc-900"
      accessibilityRole="button"
      accessibilityLabel="Abrir central de notificacoes"
    >
      <Bell size={20} color="#27272a" />
      {unreadCount > 0 ? (
        <View className="absolute -right-1 -top-1 min-h-5 min-w-5 items-center justify-center rounded-full bg-error px-1">
          <Text className="text-[10px] font-bold text-white">{formatUnreadCount(unreadCount)}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
