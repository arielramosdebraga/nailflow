import { z } from 'zod';

export const TotpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Informe o codigo TOTP com 6 digitos.');

export const TotpCodePayloadSchema = z.object({
  code: TotpCodeSchema,
});

export const TotpStatusResponseSchema = z.object({
  enabled: z.boolean(),
});

export const TotpEnrollmentResponseSchema = z.object({
  secret: z.string().min(1, 'Secret TOTP nao retornado.'),
  otpauthUri: z.string().min(1, 'URI de configuracao TOTP nao retornada.'),
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
