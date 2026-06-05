import type { AppointmentStatus } from '@/schemas/appointments/appointment.schema';

export interface AppointmentTimeRange {
  startTime: Date;
  endTime: Date;
}

export interface ConflictCandidate extends AppointmentTimeRange {
  id: string;
  manicureId: string;
  status: AppointmentStatus;
}

export interface FindAppointmentConflictParams extends AppointmentTimeRange {
  appointmentIdToIgnore?: string;
  manicureId: string;
  candidates: ConflictCandidate[];
}

export const BLOCKING_CONFLICT_STATUSES: AppointmentStatus[] = ['scheduled', 'confirmed'];

export function hasAppointmentOverlap(rangeA: AppointmentTimeRange, rangeB: AppointmentTimeRange): boolean {
  return rangeA.startTime < rangeB.endTime && rangeA.endTime > rangeB.startTime;
}

export function findAppointmentConflict(params: FindAppointmentConflictParams): ConflictCandidate | null {
  const blockedStatuses = new Set<AppointmentStatus>(BLOCKING_CONFLICT_STATUSES);

  return (
    params.candidates.find((candidate) => {
      if (params.appointmentIdToIgnore && candidate.id === params.appointmentIdToIgnore) {
        return false;
      }

      if (candidate.manicureId !== params.manicureId) {
        return false;
      }

      if (!blockedStatuses.has(candidate.status)) {
        return false;
      }

      return hasAppointmentOverlap(
        { startTime: params.startTime, endTime: params.endTime },
        { startTime: candidate.startTime, endTime: candidate.endTime },
      );
    }) ?? null
  );
}

export function assertNoAppointmentConflict(params: FindAppointmentConflictParams): void {
  const conflict = findAppointmentConflict(params);
  if (!conflict) {
    return;
  }

  throw new Error('Ja existe um atendimento para esta manicure nesse horario.');
}
