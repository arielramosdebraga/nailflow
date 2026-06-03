import { describe, expect, it } from 'vitest';

import {
  assertNoAppointmentConflict,
  findAppointmentConflict,
  hasAppointmentOverlap,
  type ConflictCandidate,
} from '@/services/appointments/conflictValidation';

const buildCandidate = (
  overrides: Partial<ConflictCandidate> = {},
): ConflictCandidate => ({
  id: 'appointment-1',
  manicureId: 'technician-1',
  status: 'scheduled',
  startTime: new Date('2026-06-02T10:00:00.000Z'),
  endTime: new Date('2026-06-02T11:00:00.000Z'),
  ...overrides,
});

describe('conflictValidation', () => {
  it('identifica sobreposicao de horarios', () => {
    expect(
      hasAppointmentOverlap(
        {
          startTime: new Date('2026-06-02T10:15:00.000Z'),
          endTime: new Date('2026-06-02T10:45:00.000Z'),
        },
        buildCandidate(),
      ),
    ).toBe(true);
  });

  it('permite horario adjacente sem sobreposicao', () => {
    expect(
      hasAppointmentOverlap(
        {
          startTime: new Date('2026-06-02T11:00:00.000Z'),
          endTime: new Date('2026-06-02T12:00:00.000Z'),
        },
        buildCandidate(),
      ),
    ).toBe(false);
  });

  it('retorna conflito para o mesmo profissional com status bloqueante', () => {
    const conflict = findAppointmentConflict({
      manicureId: 'technician-1',
      startTime: new Date('2026-06-02T10:30:00.000Z'),
      endTime: new Date('2026-06-02T11:30:00.000Z'),
      candidates: [buildCandidate()],
    });

    expect(conflict?.id).toBe('appointment-1');
  });

  it('ignora atendimentos de outro profissional', () => {
    const conflict = findAppointmentConflict({
      manicureId: 'technician-2',
      startTime: new Date('2026-06-02T10:30:00.000Z'),
      endTime: new Date('2026-06-02T11:30:00.000Z'),
      candidates: [buildCandidate()],
    });

    expect(conflict).toBeNull();
  });

  it('ignora status nao bloqueantes', () => {
    const conflict = findAppointmentConflict({
      manicureId: 'technician-1',
      startTime: new Date('2026-06-02T10:30:00.000Z'),
      endTime: new Date('2026-06-02T11:30:00.000Z'),
      candidates: [buildCandidate({ status: 'completed' })],
    });

    expect(conflict).toBeNull();
  });

  it('ignora o proprio atendimento em edicao', () => {
    expect(() =>
      assertNoAppointmentConflict({
        appointmentIdToIgnore: 'appointment-1',
        manicureId: 'technician-1',
        startTime: new Date('2026-06-02T10:30:00.000Z'),
        endTime: new Date('2026-06-02T11:30:00.000Z'),
        candidates: [buildCandidate()],
      }),
    ).not.toThrow();
  });

  it('bloqueia conflito de horario do mesmo profissional', () => {
    expect(() =>
      assertNoAppointmentConflict({
        manicureId: 'technician-1',
        startTime: new Date('2026-06-02T10:15:00.000Z'),
        endTime: new Date('2026-06-02T10:45:00.000Z'),
        candidates: [buildCandidate()],
      }),
    ).toThrow(/atendimento/i);
  });
});
