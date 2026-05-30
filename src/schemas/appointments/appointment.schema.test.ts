import { describe, expect, it } from 'vitest';

import { AppointmentSchema, UpsertAppointmentSchema } from '@/schemas/appointments/appointment.schema';

describe('appointment schemas', () => {
  it('deve aceitar payload valido de appointment', () => {
    const result = AppointmentSchema.safeParse({
      id: 'apt-001',
      salonId: 'salon-001',
      manicureId: 'user-123',
      clientId: 'client-456',
      status: 'scheduled',
      startTime: new Date('2026-06-02T12:00:00.000Z'),
      endTime: new Date('2026-06-02T13:00:00.000Z'),
      notes: 'Cliente prefere esmalte claro.',
      priceCents: 9500,
      createdAt: new Date('2026-05-01T10:00:00.000Z'),
      updatedAt: new Date('2026-05-10T10:00:00.000Z'),
    });

    expect(result.success).toBe(true);
  });

  it('deve rejeitar intervalos invalidos no upsert', () => {
    const result = UpsertAppointmentSchema.safeParse({
      salonId: 'salon-001',
      manicureId: 'user-123',
      clientId: 'client-456',
      status: 'confirmed',
      startTime: new Date('2026-06-02T14:00:00.000Z'),
      endTime: new Date('2026-06-02T13:00:00.000Z'),
      notes: '',
      priceCents: 12000,
    });

    expect(result.success).toBe(false);
  });
});
