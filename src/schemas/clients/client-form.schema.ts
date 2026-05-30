import { z } from 'zod';

import type { UpsertClientInput } from '@/schemas/clients/client.schema';

export const ClientFormSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome completo do cliente.').max(120),
  phone: z.string().trim().min(8, 'Informe um telefone valido.').max(20),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.string().email('Informe um e-mail valido.').or(z.literal(''))),
  notes: z.string().max(2000).default(''),
  tags: z.string().default(''),
});

export type ClientFormInput = z.infer<typeof ClientFormSchema>;

function parseTags(rawTags: string): string[] {
  return rawTags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function mapClientFormToUpsertInput(form: ClientFormInput): Omit<UpsertClientInput, 'salonId'> {
  return {
    name: form.name.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    notes: form.notes.trim(),
    tags: parseTags(form.tags),
    birthDate: null,
    lastVisit: null,
  };
}
