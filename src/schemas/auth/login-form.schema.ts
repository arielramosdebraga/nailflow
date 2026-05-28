import { z } from 'zod';

export const LoginFormSchema = z.object({
  email: z.string().trim().email('Informe um e-mail valido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

export type LoginFormInput = z.infer<typeof LoginFormSchema>;
