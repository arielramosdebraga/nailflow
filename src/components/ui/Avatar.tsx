import { Text, View } from 'react-native';

interface AvatarProps {
  name: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function Avatar({ name }: AvatarProps) {
  return (
    <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/20">
      <Text className="text-sm font-semibold text-primary">{getInitials(name)}</Text>
    </View>
  );
}
