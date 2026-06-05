import { z } from 'zod';

import { AppointmentStatusSchema, type UpsertAppointmentInput } from '@/schemas/appointments/appointment.schema';

function toDate(value: unknown): unknown {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return value;
}

function toNumber(value: unknown): unknown {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace(/\./g, '').replace(',', '.');
    if (!normalized) {
      return Number.NaN;
    }

    return Number.parseFloat(normalized);
  }

  return value;
}

export const AppointmentFormSchema = z
  .object({
    clientId: z.string().trim().min(1, 'Selecione uma cliente.'),
    manicureId: z.string().trim().min(1, 'Selecione uma manicure.'),
    startTime: z.preprocess(toDate, z.date({ error: 'Informe um horario inicial valido.' })),
    endTime: z.preprocess(toDate, z.date({ error: 'Informe um horario final valido.' })),
    notes: z.string().max(2000).default(''),
    price: z.preprocess(
      toNumber,
      z.number({ error: 'Informe um valor valido.' }).nonnegative('Informe um valor valido.'),
    ),
    status: AppointmentStatusSchema.default('scheduled'),
  })
  .superRefine((value, ctx) => {
    if (value.endTime <= value.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'O horario final deve ser maior que o horario inicial.',
      });
    }
  });

export type AppointmentFormInput = z.infer<typeof AppointmentFormSchema>;

export function mapAppointmentFormToUpsertInput(
  form: AppointmentFormInput,
): Omit<UpsertAppointmentInput, 'salonId'> {
  return {
    clientId: form.clientId.trim(),
    manicureId: form.manicureId.trim(),
    startTime: form.startTime,
    endTime: form.endTime,
    notes: form.notes.trim(),
    status: form.status,
    priceCents: Math.round(form.price * 100),
  };
}
