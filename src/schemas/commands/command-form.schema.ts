import { z } from 'zod';

import {
  CommandPaymentMethodSchema,
  type CommandPaymentMethod,
  type CommandStatus,
  type UpsertCommandInput,
} from '@/schemas/commands/command.schema';

const CommandItemFormSchema = z.object({
  service: z.string().trim().min(2, 'Informe o nome do servico.').max(120),
  price: z.string().trim().min(1, 'Informe o valor do servico.'),
  quantity: z.coerce
    .number()
    .int('Informe uma quantidade inteira.')
    .min(1, 'A quantidade deve ser maior que zero.')
    .max(999, 'Quantidade maxima por item excedida.'),
});

export const CommandFormSchema = z.object({
  appointmentId: z.string().trim().min(1, 'Selecione o atendimento da comanda.'),
  clientId: z.string().trim().min(1, 'Selecione o cliente da comanda.'),
  manicureId: z.string().trim().min(1, 'Selecione a profissional responsavel.'),
  items: z.array(CommandItemFormSchema).min(1, 'Adicione pelo menos um item na comanda.'),
  paymentMethod: CommandPaymentMethodSchema.nullable().default(null),
});

export type CommandFormItemInput = z.infer<typeof CommandItemFormSchema>;
export type CommandFormInput = z.infer<typeof CommandFormSchema>;

interface MapCommandFormOptions {
  status?: CommandStatus;
  closedAt?: Date | null;
}

function parsePriceValue(rawPrice: string): number {
  const normalized = rawPrice.trim().replace(/\s/g, '').replace(',', '.');
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('Valor de item invalido na comanda.');
  }

  return Math.round((parsed + Number.EPSILON) * 100) / 100;
}

function mapFormItem(item: CommandFormItemInput): UpsertCommandInput['items'][number] {
  return {
    service: item.service.trim(),
    price: parsePriceValue(item.price),
    quantity: item.quantity,
  };
}

function resolvePaymentMethod(
  status: CommandStatus,
  paymentMethod: CommandPaymentMethod | null
): CommandPaymentMethod | null {
  if (status === 'open') {
    return null;
  }

  return paymentMethod;
}

function resolveClosedAt(status: CommandStatus, explicitClosedAt: Date | null | undefined): Date | null {
  if (status === 'open') {
    return null;
  }

  return explicitClosedAt ?? new Date();
}

export function mapCommandFormToUpsertInput(
  form: CommandFormInput,
  options?: MapCommandFormOptions
): Omit<UpsertCommandInput, 'salonId'> {
  const status = options?.status ?? 'open';

  return {
    appointmentId: form.appointmentId.trim(),
    clientId: form.clientId.trim(),
    manicureId: form.manicureId.trim(),
    items: form.items.map((item) => mapFormItem(item)),
    paymentMethod: resolvePaymentMethod(status, form.paymentMethod),
    status,
    closedAt: resolveClosedAt(status, options?.closedAt),
  };
}
