import { z } from 'zod';

export const OwnerCreateNailTechnicianFormSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(3, 'Informe o nome completo da profissional.')
    .max(120, 'O nome deve ter no máximo 120 caracteres.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.string().email('Informe um e-mail valido.')),
  phone: z
    .string()
    .trim()
    .pipe(
      z
        .string()
        .max(20, 'O telefone deve ter no máximo 20 caracteres.')
        .refine((value) => value === '' || value.length >= 8, 'Informe um telefone valido.')
    ),
});

export type OwnerCreateNailTechnicianFormInput = z.infer<typeof OwnerCreateNailTechnicianFormSchema>;

export interface CreateOwnerNailTechnicianInput {
  displayName: string;
  email: string;
  phone: string | null;
}

export function mapOwnerCreateNailTechnicianFormToInput(
  form: OwnerCreateNailTechnicianFormInput
): CreateOwnerNailTechnicianInput {
  const phone = form.phone.trim();

  return {
    displayName: form.displayName.trim(),
    email: form.email.trim().toLowerCase(),
    phone: phone ? phone : null,
  };
}
