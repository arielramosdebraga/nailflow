import { z } from 'zod';

export const TotpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Informe o código do autenticador com 6 dígitos.');

export const TotpCodePayloadSchema = z.object({
  code: TotpCodeSchema,
});

export const TotpStatusResponseSchema = z.object({
  enabled: z.boolean(),
});

export const TotpEnrollmentResponseSchema = z.object({
  secret: z.string().min(1, 'A chave secreta do autenticador não foi retornada.'),
  otpauthUri: z.string().min(1, 'O link de configuração do autenticador não foi retornado.'),
});

export const TotpEnrollmentConfirmationResponseSchema = z.object({
  enabled: z.literal(true),
});

export const TotpVerificationResponseSchema = z.object({
  verified: z.boolean(),
});

export type TotpCodeInput = z.infer<typeof TotpCodeSchema>;
export type TotpCodePayloadInput = z.infer<typeof TotpCodePayloadSchema>;
export type TotpStatusResponse = z.infer<typeof TotpStatusResponseSchema>;
export type TotpEnrollmentResponse = z.infer<typeof TotpEnrollmentResponseSchema>;
export type TotpEnrollmentConfirmationResponse = z.infer<
  typeof TotpEnrollmentConfirmationResponseSchema
>;
export type TotpVerificationResponse = z.infer<typeof TotpVerificationResponseSchema>;
