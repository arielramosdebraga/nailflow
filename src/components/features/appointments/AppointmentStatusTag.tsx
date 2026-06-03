import { Text, View } from 'react-native';

import type { AppointmentStatus as AppointmentStatusValue } from '@/schemas/appointments/appointment.schema';

export type AppointmentStatus = AppointmentStatusValue;

interface AppointmentStatusTagProps {
  status: AppointmentStatus;
}

const statusConfig: Record<AppointmentStatus, { label: string; containerClassName: string; textClassName: string }> = {
  scheduled: {
    label: 'Agendado',
    containerClassName: 'bg-accent/20',
    textClassName: 'text-amber-700',
  },
  confirmed: {
    label: 'Confirmado',
    containerClassName: 'bg-primary/20',
    textClassName: 'text-primary',
  },
  completed: {
    label: 'Concluido',
    containerClassName: 'bg-success/20',
    textClassName: 'text-emerald-700',
  },
  cancelled: {
    label: 'Cancelado',
    containerClassName: 'bg-error/20',
    textClassName: 'text-red-700',
  },
};

export function getAppointmentStatusLabel(status: AppointmentStatus): string {
  return statusConfig[status].label;
}

export function AppointmentStatusTag({ status }: AppointmentStatusTagProps) {
  const config = statusConfig[status];

  return (
    <View className={`self-start rounded-full px-3 py-1 ${config.containerClassName}`}>
      <Text className={`text-xs font-semibold uppercase tracking-wide ${config.textClassName}`}>{config.label}</Text>
    </View>
  );
}
