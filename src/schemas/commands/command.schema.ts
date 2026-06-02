import { z } from 'zod';

const MonetaryValueSchema = z
  .number()
  .min(0)
  .refine((value) => Number.isFinite(value), 'Valor monetario invalido.');

const QuantitySchema = z.number().int().min(1).max(999);

export const CommandPaymentMethodSchema = z.enum(['cash', 'pix', 'credit', 'debit']);
export const CommandStatusSchema = z.enum(['open', 'closed']);

export const CommandItemSchema = z.object({
  service: z.string().trim().min(1).max(120),
  price: MonetaryValueSchema,
  quantity: QuantitySchema,
});

export const CommandSchema = z.object({
  id: z.string().min(1),
  salonId: z.string().min(1),
  appointmentId: z.string().min(1),
  clientId: z.string().min(1),
  manicureId: z.string().min(1),
  items: z.array(CommandItemSchema).min(1).max(100),
  total: MonetaryValueSchema,
  paymentMethod: CommandPaymentMethodSchema.nullable(),
  status: CommandStatusSchema,
  closedAt: z.date().nullable(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});

export const UpsertCommandSchema = z
  .object({
    salonId: z.string().min(1),
    appointmentId: z.string().min(1),
    clientId: z.string().min(1),
    manicureId: z.string().min(1),
    items: z.array(CommandItemSchema).min(1).max(100),
    paymentMethod: CommandPaymentMethodSchema.nullable().default(null),
    status: CommandStatusSchema.default('open'),
    closedAt: z.date().nullable().default(null),
  })
  .superRefine((value, context) => {
    if (value.status === 'closed' && !value.paymentMethod) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paymentMethod'],
        message: 'Comanda fechada requer metodo de pagamento.',
      });
    }

    if (value.status === 'closed' && !value.closedAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['closedAt'],
        message: 'Comanda fechada requer data de fechamento.',
      });
    }

    if (value.status === 'open' && value.closedAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['closedAt'],
        message: 'Comanda aberta nao deve ter data de fechamento.',
      });
    }
  });

export type CommandPaymentMethod = z.infer<typeof CommandPaymentMethodSchema>;
export type CommandStatus = z.infer<typeof CommandStatusSchema>;
export type CommandItem = z.infer<typeof CommandItemSchema>;
export type Command = z.infer<typeof CommandSchema>;
export type UpsertCommandInput = z.infer<typeof UpsertCommandSchema>;
