import { Text, View } from 'react-native';

import { type GoogleSyncIndicator } from '@/services/google';

interface GoogleCalendarSyncStatusTagProps {
  status: GoogleSyncIndicator;
}

const STATUS_LABELS: Record<GoogleSyncIndicator, string> = {
  connected: 'Conectado',
  pending: 'Pendente',
  error: 'Erro',
};

const STATUS_CLASSNAMES: Record<GoogleSyncIndicator, string> = {
  connected: 'bg-emerald-100 dark:bg-emerald-500/20',
  pending: 'bg-amber-100 dark:bg-amber-500/20',
  error: 'bg-red-100 dark:bg-red-500/20',
};

const STATUS_TEXT_CLASSNAMES: Record<GoogleSyncIndicator, string> = {
  connected: 'text-emerald-700 dark:text-emerald-300',
  pending: 'text-amber-700 dark:text-amber-300',
  error: 'text-red-700 dark:text-red-300',
};

export function GoogleCalendarSyncStatusTag({ status }: GoogleCalendarSyncStatusTagProps) {
  return (
    <View className={`self-start rounded-full px-3 py-1 ${STATUS_CLASSNAMES[status]}`}>
      <Text className={`text-xs font-semibold uppercase tracking-wide ${STATUS_TEXT_CLASSNAMES[status]}`}>
        {STATUS_LABELS[status]}
      </Text>
    </View>
  );
}
