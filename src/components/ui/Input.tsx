import type { ReactNode } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  description?: string;
  containerClassName?: string;
  labelClassName?: string;
  inputWrapperClassName?: string;
  rightAdornment?: ReactNode;
  leftAdornment?: ReactNode;
}

export function Input({
  label,
  error,
  description,
  className,
  containerClassName,
  labelClassName,
  inputWrapperClassName,
  rightAdornment,
  leftAdornment,
  ...props
}: InputProps) {
  return (
    <View className={`w-full gap-2 ${containerClassName ?? ''}`}>
      {label ? (
        <Text className={`text-sm font-medium text-zinc-700 dark:text-zinc-200 ${labelClassName ?? ''}`}>
          {label}
        </Text>
      ) : null}
      {description ? <Text className="text-xs text-zinc-500 dark:text-zinc-400">{description}</Text> : null}
      <View
        className={`min-h-12 flex-row items-center rounded-xl border border-zinc-300 bg-white px-4 dark:border-zinc-700 dark:bg-zinc-900 ${
          error ? 'border-error/80 dark:border-error' : ''
        } ${inputWrapperClassName ?? ''}`}
      >
        {leftAdornment ? <View className="mr-3">{leftAdornment}</View> : null}
        <TextInput
          className={`flex-1 py-3 text-base text-zinc-900 dark:text-zinc-100 ${className ?? ''}`}
          placeholderTextColor="#71717A"
          {...props}
        />
        {rightAdornment ? <View className="ml-3">{rightAdornment}</View> : null}
      </View>
      {error ? <Text className="text-sm text-error">{error}</Text> : null}
    </View>
  );
}
