import { Pressable, Text, type PressableProps } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variantClassNames: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  ghost: 'bg-transparent border border-zinc-300 dark:border-zinc-700',
  danger: 'bg-error',
};

const textVariantClassNames: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-white',
  ghost: 'text-zinc-900 dark:text-zinc-100',
  danger: 'text-white',
};

interface ButtonProps extends PressableProps {
  label: string;
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  fullWidth = true,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const widthClassName = fullWidth ? 'w-full' : '';

  return (
    <Pressable
      className={`h-12 items-center justify-center rounded-xl px-4 active:opacity-90 ${widthClassName} ${variantClassNames[variant]} ${disabled ? 'opacity-60' : ''} ${className ?? ''}`}
      disabled={disabled}
      {...props}
    >
      <Text className={`text-base font-semibold ${textVariantClassNames[variant]}`}>{label}</Text>
    </Pressable>
  );
}
