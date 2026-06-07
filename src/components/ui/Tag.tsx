import { Text, View } from 'react-native';

interface TagProps {
  label: string;
}

export function Tag({ label }: TagProps) {
  return (
    <View className="self-start rounded-full border border-amber-400/25 bg-amber-400/15 px-3 py-1">
      <Text className="text-xs font-semibold uppercase tracking-wide text-amber-200">{label}</Text>
    </View>
  );
}
