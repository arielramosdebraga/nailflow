import { z } from 'zod';

export const SignUpFormSchema = z
  .object({
    displayName: z.string().trim().min(2, 'Informe seu nome.'),
    email: z
      .string()
      .trim()
      .min(1, 'Informe seu e-mail.')
      .email('Informe um e-mail válido.'),
    password: z
      .string()
      .min(6, 'A senha deve ter no mínimo 6 caracteres.')
      .max(20, 'A senha deve ter no máximo 20 caracteres.'),
    confirmPassword: z
      .string()
      .min(6, 'Confirme a senha com pelo menos 6 caracteres.')
      .max(20, 'A confirmação da senha deve ter no máximo 20 caracteres.'),
    acceptedLegalTerms: z.boolean().refine((value) => value, {
      message: 'Você precisa aceitar a política e os termos para continuar.',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas precisam ser iguais.',
    path: ['confirmPassword'],
  });

export type SignUpFormInput = z.infer<typeof SignUpFormSchema>;
