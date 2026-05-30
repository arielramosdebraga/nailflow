import { z } from 'zod';

export const AppointmentStatusSchema = z.enum(['scheduled', 'confirmed', 'completed', 'cancelled']);

type AppointmentTimeFields = {
  startTime: Date;
  endTime: Date;
};

function validateTimeRange(
  value: AppointmentTimeFields,
  ctx: z.RefinementCtx,
) {
  if (value.endTime <= value.startTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endTime'],
      message: 'O horario final deve ser maior que o horario inicial.',
    });
  }
}

export const AppointmentSchema = z
  .object({
    id: z.string().min(1),
    salonId: z.string().min(1),
    manicureId: z.string().min(1),
    clientId: z.string().min(1),
    status: AppointmentStatusSchema,
    startTime: z.date(),
    endTime: z.date(),
    notes: z.string().max(2000),
    priceCents: z.number().int().nonnegative(),
    createdAt: z.date().nullable(),
    updatedAt: z.date().nullable(),
  })
  .superRefine(validateTimeRange);

export const UpsertAppointmentSchema = z
  .object({
    salonId: z.string().min(1),
    manicureId: z.string().min(1),
    clientId: z.string().min(1),
    status: AppointmentStatusSchema.default('scheduled'),
    startTime: z.date(),
    endTime: z.date(),
    notes: z.string().max(2000).default(''),
    priceCents: z.number().int().nonnegative(),
  })
  .superRefine(validateTimeRange);

export const ListAppointmentsIntervalSchema = z
  .object({
    start: z.date(),
    end: z.date(),
  })
  .superRefine((value, ctx) => {
    if (value.end <= value.start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end'],
        message: 'O fim do intervalo deve ser maior que o inicio.',
      });
    }
  });

export const UpdateAppointmentStatusSchema = z.object({
  status: AppointmentStatusSchema,
});

export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;
export type Appointment = z.infer<typeof AppointmentSchema>;
export type UpsertAppointmentInput = z.infer<typeof UpsertAppointmentSchema>;
export type ListAppointmentsInterval = z.infer<typeof ListAppointmentsIntervalSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof UpdateAppointmentStatusSchema>;
