import { Pressable, Text, View } from 'react-native';

import type { AgendaViewMode } from '@/utils/dates/agenda-range';

interface AgendaViewToggleProps {
  mode: AgendaViewMode;
  onChangeMode: (mode: AgendaViewMode) => void;
}

const options: { mode: AgendaViewMode; label: string }[] = [
  { mode: 'day', label: 'Dia' },
  { mode: 'week', label: 'Semana' },
  { mode: 'month', label: 'Mes' },
];

export function AgendaViewToggle({ mode, onChangeMode }: AgendaViewToggleProps) {
  return (
    <View className="flex-row gap-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900">
      {options.map((option) => {
        const isActive = option.mode === mode;
        return (
          <Pressable
            key={option.mode}
            className={`flex-1 rounded-lg px-3 py-2 ${isActive ? 'bg-white dark:bg-zinc-800' : 'bg-transparent'}`}
            onPress={() => onChangeMode(option.mode)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              className={`text-center text-sm font-semibold ${isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-300'}`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
