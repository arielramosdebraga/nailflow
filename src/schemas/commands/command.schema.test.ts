import { describe, expect, it } from 'vitest';

import { CommandFormSchema, mapCommandFormToUpsertInput } from '@/schemas/commands/command-form.schema';
import { UpsertCommandSchema } from '@/schemas/commands/command.schema';

describe('command schemas', () => {
  it('deve transformar formulario em payload de upsert com status aberto', () => {
    const parsedForm = CommandFormSchema.parse({
      appointmentId: '  appointment-001 ',
      clientId: '  client-001 ',
      manicureId: '  technician-001 ',
      items: [
        { service: ' Cutilagem ', price: ' 89,90 ', quantity: 1 },
        { service: ' Esmaltacao ', price: '35.5', quantity: 2 },
      ],
      paymentMethod: 'pix',
    });

    const payload = mapCommandFormToUpsertInput(parsedForm);

    expect(payload).toEqual({
      appointmentId: 'appointment-001',
      clientId: 'client-001',
      manicureId: 'technician-001',
      items: [
        { service: 'Cutilagem', price: 89.9, quantity: 1 },
        { service: 'Esmaltacao', price: 35.5, quantity: 2 },
      ],
      paymentMethod: null,
      status: 'open',
      closedAt: null,
    });
  });

  it('deve exigir pagamento e data para comanda fechada', () => {
    const parsedForm = CommandFormSchema.parse({
      appointmentId: 'appointment-001',
      clientId: 'client-001',
      manicureId: 'technician-001',
      items: [{ service: 'Banho de gel', price: '120', quantity: 1 }],
      paymentMethod: null,
    });

    const payload = mapCommandFormToUpsertInput(parsedForm, {
      status: 'closed',
      closedAt: null,
    });

    const result = UpsertCommandSchema.safeParse({
      salonId: 'salon-001',
      ...payload,
    });

    expect(result.success).toBe(false);
  });

  it('deve aceitar comanda fechada quando pagamento e fechamento forem informados', () => {
    const parsedForm = CommandFormSchema.parse({
      appointmentId: 'appointment-001',
      clientId: 'client-001',
      manicureId: 'technician-001',
      items: [{ service: 'Banho de gel', price: '120', quantity: 1 }],
      paymentMethod: 'credit',
    });

    const closedAt = new Date('2026-05-30T10:15:00.000Z');
    const payload = mapCommandFormToUpsertInput(parsedForm, {
      status: 'closed',
      closedAt,
    });

    const result = UpsertCommandSchema.safeParse({
      salonId: 'salon-001',
      ...payload,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.closedAt).toEqual(closedAt);
      expect(result.data.paymentMethod).toBe('credit');
    }
  });
});
