import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <View className="w-full gap-2">
      {label ? <Text className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{label}</Text> : null}
      <TextInput
        className={`h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 ${className ?? ''}`}
        placeholderTextColor="#71717A"
        {...props}
      />
      {error ? <Text className="text-sm text-error">{error}</Text> : null}
    </View>
  );
}
