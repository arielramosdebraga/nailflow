import { type Appointment, type AppointmentStatus, type AppointmentSyncStatus } from '@/schemas/appointments/appointment.schema';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Concluido',
  cancelled: 'Cancelado',
};

const appointmentStatusColorClassNames: Record<AppointmentStatus, string> = {
  scheduled: 'text-zinc-600 dark:text-zinc-300',
  confirmed: 'text-secondary dark:text-secondary',
  completed: 'text-primary dark:text-primary',
  cancelled: 'text-error dark:text-error',
};

const appointmentSyncStatusLabels: Record<AppointmentSyncStatus, string> = {
  pending: 'Pendente',
  synced: 'Sincronizado',
  error: 'Erro',
  disabled: 'Desativado',
};

const appointmentTimelineColors: Record<AppointmentStatus, string> = {
  scheduled: '#0EA5E9',
  confirmed: '#2563EB',
  completed: '#16A34A',
  cancelled: '#DC2626',
};

export function formatAppointmentStatus(status: AppointmentStatus): string {
  return appointmentStatusLabels[status];
}

export function getAppointmentStatusColorClassName(status: AppointmentStatus): string {
  return appointmentStatusColorClassNames[status];
}

export function formatAppointmentSyncStatus(status: AppointmentSyncStatus): string {
  return appointmentSyncStatusLabels[status];
}

export function formatAppointmentCurrencyFromCents(valueInCents: number): string {
  if (!Number.isFinite(valueInCents)) {
    return currencyFormatter.format(0);
  }

  return currencyFormatter.format(valueInCents / 100);
}

export function formatAppointmentDate(value: Date): string {
  return value.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatAppointmentTime(value: Date): string {
  return value.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatAppointmentTimeRange(start: Date, end: Date): string {
  return `${formatAppointmentTime(start)} - ${formatAppointmentTime(end)}`;
}

export function toCalendarDateString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function getTimelineColorByStatus(status: AppointmentStatus): string {
  return appointmentTimelineColors[status];
}

export function getAppointmentSummary(appointment: Appointment): string {
  return `${formatAppointmentTimeRange(appointment.startTime, appointment.endTime)} • ${formatAppointmentStatus(appointment.status)}`;
}
