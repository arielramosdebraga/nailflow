import { Pressable, Text, View } from 'react-native';

import { type Appointment, type AppointmentStatus } from '@/schemas/appointments/appointment.schema';
import {
  formatAppointmentCurrencyFromCents,
  formatAppointmentDate,
  formatAppointmentStatus,
  formatAppointmentTimeRange,
  getAppointmentStatusColorClassName,
} from '@/components/features/appointments/appointmentFormatters';

export interface AppointmentCardItem {
  id: string;
  clientId: string;
  clientName: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  priceCents: number;
  notes?: string;
}

interface AppointmentEntityCardProps {
  appointment: Appointment;
  clientName: string;
  manicureName?: string;
  showDate?: boolean;
  onPress?: () => void;
}

interface AppointmentListCardProps {
  appointment: AppointmentCardItem;
  onPress?: (appointmentId: string) => void;
}

type AppointmentCardProps = AppointmentEntityCardProps | AppointmentListCardProps;

function isAppointmentEntityProps(props: AppointmentCardProps): props is AppointmentEntityCardProps {
  return 'clientName' in props;
}

function renderEntityCardContent(props: AppointmentEntityCardProps) {
  const { appointment, clientName, manicureName, showDate = false } = props;
  const statusClassName = getAppointmentStatusColorClassName(appointment.status);

  return (
    <View className="gap-1 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {formatAppointmentTimeRange(appointment.startTime, appointment.endTime)}
        </Text>
        <Text className={`text-xs font-semibold ${statusClassName}`}>{formatAppointmentStatus(appointment.status)}</Text>
      </View>

      {showDate ? (
        <Text className="text-xs text-zinc-500 dark:text-zinc-400">{formatAppointmentDate(appointment.startTime)}</Text>
      ) : null}

      <Text className="text-sm text-zinc-700 dark:text-zinc-200">Cliente: {clientName}</Text>
      {manicureName ? <Text className="text-sm text-zinc-700 dark:text-zinc-200">Profissional: {manicureName}</Text> : null}

      <View className="flex-row items-center justify-between pt-1">
        <Text className="text-xs text-zinc-600 dark:text-zinc-300">Valor</Text>
        <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {formatAppointmentCurrencyFromCents(appointment.priceCents)}
        </Text>
      </View>
    </View>
  );
}

function formatListCardDate(startsAt: string): string {
  const startDate = new Date(startsAt);

  if (Number.isNaN(startDate.getTime())) {
    return 'Data invalida';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    weekday: 'long',
  }).format(startDate);
}

function renderListCardContent({ appointment }: AppointmentListCardProps) {
  const startDate = new Date(appointment.startsAt);
  const endDate = new Date(appointment.endsAt);
  const statusClassName = getAppointmentStatusColorClassName(appointment.status);
  const timeRange =
    Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())
      ? 'Horario indisponivel'
      : formatAppointmentTimeRange(startDate, endDate);

  return (
    <View className="gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{appointment.clientName}</Text>
          <Text className="text-xs capitalize text-zinc-500 dark:text-zinc-400">{formatListCardDate(appointment.startsAt)}</Text>
          <Text className="text-xs text-zinc-500 dark:text-zinc-400">{timeRange}</Text>
          <Text className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
            {formatAppointmentCurrencyFromCents(appointment.priceCents)}
          </Text>
        </View>
        <Text className={`text-xs font-semibold ${statusClassName}`}>{formatAppointmentStatus(appointment.status)}</Text>
      </View>

      {appointment.notes ? (
        <Text className="text-sm text-zinc-600 dark:text-zinc-300">{appointment.notes}</Text>
      ) : null}
    </View>
  );
}

export function AppointmentCard(props: AppointmentCardProps) {
  if (isAppointmentEntityProps(props)) {
    const content = renderEntityCardContent(props);

    if (!props.onPress) {
      return content;
    }

    return (
      <Pressable className="active:opacity-90" onPress={props.onPress}>
        {content}
      </Pressable>
    );
  }

  const content = renderListCardContent(props);

  if (!props.onPress) {
    return content;
  }

  return (
    <Pressable className="active:opacity-90" onPress={() => props.onPress?.(props.appointment.id)}>
      {content}
    </Pressable>
  );
}
