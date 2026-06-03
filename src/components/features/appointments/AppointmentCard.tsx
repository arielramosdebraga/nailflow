import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import type { AppointmentStatus } from '@/schemas/appointments/appointment.schema';

import { AppointmentStatusTag } from './AppointmentStatusTag';

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

interface AppointmentCardProps {
  appointment: AppointmentCardItem;
  onPress?: (appointmentId: string) => void;
}

function formatTimeRange(startsAt: string, endsAt: string): string {
  const startDate = new Date(startsAt);
  const endDate = new Date(endsAt);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 'Horario indisponivel';
  }

  const formatter = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}

function formatPriceLabel(priceCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(priceCents / 100);
}

function formatDateLabel(startsAt: string): string {
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

function AppointmentCardContent({ appointment }: { appointment: AppointmentCardItem }) {
  return (
    <Card className="gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{appointment.clientName}</Text>
          <Text className="text-xs capitalize text-zinc-500 dark:text-zinc-400">{formatDateLabel(appointment.startsAt)}</Text>
          <Text className="text-xs text-zinc-500 dark:text-zinc-400">
            {formatTimeRange(appointment.startsAt, appointment.endsAt)}
          </Text>
          <Text className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
            {formatPriceLabel(appointment.priceCents)}
          </Text>
        </View>
        <AppointmentStatusTag status={appointment.status} />
      </View>

      {appointment.notes ? (
        <Text className="text-sm text-zinc-600 dark:text-zinc-300">{appointment.notes}</Text>
      ) : null}
    </Card>
  );
}

export function AppointmentCard({ appointment, onPress }: AppointmentCardProps) {
  if (!onPress) {
    return <AppointmentCardContent appointment={appointment} />;
  }

  return (
    <Pressable onPress={() => onPress(appointment.id)} accessibilityRole="button">
      <AppointmentCardContent appointment={appointment} />
    </Pressable>
  );
}
