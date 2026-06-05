import { z } from 'zod';

export const RecoverFormSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.'),
});

export type RecoverFormInput = z.infer<typeof RecoverFormSchema>;
