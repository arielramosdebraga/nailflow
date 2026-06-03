import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { Calendar } from 'react-native-calendars';

import {
  buildAgendaRange,
  getAgendaPeriodLabel,
  getReferenceDate,
  toIsoDate,
  type AgendaViewMode,
} from '@/utils/dates/agenda-range';

interface AgendaCalendarProps {
  referenceDate: Date;
  mode: AgendaViewMode;
  onChangeReferenceDate: (date: Date) => void;
}

function shiftDate(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export function AgendaCalendar({ referenceDate, mode, onChangeReferenceDate }: AgendaCalendarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const range = buildAgendaRange(referenceDate, mode);
  const selectedIsoDate = toIsoDate(referenceDate);
  const step = mode === 'day' ? 1 : mode === 'week' ? 7 : 30;

  if (mode === 'month') {
    return (
      <View className="gap-3">
        <Text className="text-sm font-medium capitalize text-zinc-700 dark:text-zinc-200">
          {getAgendaPeriodLabel(referenceDate, mode)}
        </Text>

        <Calendar
          current={selectedIsoDate}
          firstDay={1}
          enableSwipeMonths
          onDayPress={(day) => onChangeReferenceDate(getReferenceDate(day.dateString))}
          markedDates={{
            [selectedIsoDate]: {
              selected: true,
              selectedColor: '#ec4899',
            },
          }}
          theme={{
            calendarBackground: isDark ? '#09090b' : '#ffffff',
            dayTextColor: isDark ? '#fafafa' : '#18181b',
            monthTextColor: isDark ? '#fafafa' : '#18181b',
            textDisabledColor: isDark ? '#52525b' : '#a1a1aa',
            arrowColor: '#ec4899',
            todayTextColor: '#10b981',
          }}
        />
      </View>
    );
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Pressable
          className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900"
          onPress={() => onChangeReferenceDate(shiftDate(referenceDate, -step))}
          accessibilityRole="button"
          accessibilityLabel="Voltar periodo"
        >
          <Text className="text-lg font-semibold text-zinc-700 dark:text-zinc-200">{'<'}</Text>
        </Pressable>

        <Text className="text-sm font-medium capitalize text-zinc-700 dark:text-zinc-200">
          {getAgendaPeriodLabel(referenceDate, mode)}
        </Text>

        <Pressable
          className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900"
          onPress={() => onChangeReferenceDate(shiftDate(referenceDate, step))}
          accessibilityRole="button"
          accessibilityLabel="Avancar periodo"
        >
          <Text className="text-lg font-semibold text-zinc-700 dark:text-zinc-200">{'>'}</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {range.map((day) => {
          const isSelected = day.isoDate === selectedIsoDate;
          return (
            <Pressable
              key={day.isoDate}
              className={`min-w-16 rounded-xl border px-3 py-2 ${isSelected ? 'border-primary bg-primary/10' : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'}`}
              onPress={() => onChangeReferenceDate(day.date)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                className={`text-center text-xs font-medium uppercase ${isSelected ? 'text-primary' : 'text-zinc-500 dark:text-zinc-400'}`}
              >
                {day.weekdayLabel}
              </Text>
              <Text
                className={`text-center text-base font-semibold ${isSelected ? 'text-primary' : 'text-zinc-900 dark:text-zinc-100'}`}
              >
                {day.dayLabel}
              </Text>
              {day.isToday ? (
                <Text className="text-center text-[10px] font-medium uppercase text-success">Hoje</Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
