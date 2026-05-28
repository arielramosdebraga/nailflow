import { Text, View } from 'react-native';

interface TagProps {
  label: string;
}

export function Tag({ label }: TagProps) {
  return (
    <View className="self-start rounded-full bg-accent/20 px-3 py-1">
      <Text className="text-xs font-semibold uppercase tracking-wide text-amber-700">{label}</Text>
    </View>
  );
}
