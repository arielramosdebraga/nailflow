import { Pressable, Text, View } from 'react-native';

import {
  formatAppointmentCurrencyFromCents,
  formatAppointmentDate,
  formatAppointmentStatus,
  formatAppointmentTimeRange,
  getAppointmentStatusColorClassName,
} from '@/components/features/appointments/appointmentFormatters';
import { type Appointment } from '@/schemas/appointments/appointment.schema';

export interface AppointmentCardItem {
  id: string;
  clientId: string;
  clientName: string;
  startsAt: string;
  endsAt: string;
  status: Appointment['status'];
  priceCents: number;
  notes?: string;
}

type AppointmentCardData = Appointment | AppointmentCardItem;

interface AppointmentCardProps {
  appointment: AppointmentCardData;
  clientName?: string;
  manicureName?: string;
  showDate?: boolean;
  onPress?: (appointmentId: string) => void;
}

function isPersistedAppointment(value: AppointmentCardData): value is Appointment {
  return "startTime" in value && "endTime" in value;
}

function getStartDate(appointment: AppointmentCardData): Date {
  return isPersistedAppointment(appointment) ? appointment.startTime : new Date(appointment.startsAt);
}

function getEndDate(appointment: AppointmentCardData): Date {
  return isPersistedAppointment(appointment) ? appointment.endTime : new Date(appointment.endsAt);
}

function getClientLabel(appointment: AppointmentCardData, clientName?: string): string {
  if (clientName) {
    return clientName;
  }

  return isPersistedAppointment(appointment) ? appointment.clientId : appointment.clientName;
}

function getNotes(appointment: AppointmentCardData): string {
  return appointment.notes ?? '';
}

export function AppointmentCard({
  appointment,
  clientName,
  manicureName,
  showDate = false,
  onPress,
}: AppointmentCardProps) {
  const statusClassName = getAppointmentStatusColorClassName(appointment.status);
  const startDate = getStartDate(appointment);
  const endDate = getEndDate(appointment);
  const notes = getNotes(appointment);
  const content = (
    <View className="gap-1 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {formatAppointmentTimeRange(startDate, endDate)}
        </Text>
        <Text className={`text-xs font-semibold ${statusClassName}`}>{formatAppointmentStatus(appointment.status)}</Text>
      </View>

      {showDate ? (
        <Text className="text-xs text-zinc-500 dark:text-zinc-400">{formatAppointmentDate(startDate)}</Text>
      ) : null}

      <Text className="text-sm text-zinc-700 dark:text-zinc-200">Cliente: {getClientLabel(appointment, clientName)}</Text>
      {manicureName ? <Text className="text-sm text-zinc-700 dark:text-zinc-200">Profissional: {manicureName}</Text> : null}

      <View className="flex-row items-center justify-between pt-1">
        <Text className="text-xs text-zinc-600 dark:text-zinc-300">Valor</Text>
        <Text className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {formatAppointmentCurrencyFromCents(appointment.priceCents)}
        </Text>
      </View>

      {notes ? <Text className="pt-1 text-xs text-zinc-600 dark:text-zinc-300">{notes}</Text> : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable className="active:opacity-90" onPress={() => onPress(appointment.id)}>
      {content}
    </Pressable>
  );
}
