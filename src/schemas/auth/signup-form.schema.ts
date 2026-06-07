import { z } from 'zod';

export const SignUpFormSchema = z
  .object({
    displayName: z.string().trim().min(2, 'Informe seu nome.'),
    email: z.string().trim().email('Informe um e-mail válido.'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
    confirmPassword: z.string().min(6, 'Confirme a senha.'),
    acceptedLegalTerms: z.boolean().refine((value) => value, {
      message: 'Você precisa aceitar a Política de Privacidade e os Termos e Consentimento para continuar.',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas precisam ser iguais.',
    path: ['confirmPassword'],
  });

export type SignUpFormInput = z.infer<typeof SignUpFormSchema>;
