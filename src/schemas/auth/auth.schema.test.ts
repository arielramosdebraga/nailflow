import { describe, expect, it } from 'vitest';

import { LoginFormSchema } from '@/schemas/auth/login-form.schema';
import { RecoverFormSchema } from '@/schemas/auth/recover-form.schema';
import { SignUpFormSchema } from '@/schemas/auth/signup-form.schema';
import { TotpCodeSchema } from '@/schemas/auth/totp.schema';

describe('Auth Schemas', () => {
  it('accepts valid login payload', () => {
    const result = LoginFormSchema.safeParse({
      email: 'nailflow@example.com',
      password: '123456',
    });

    expect(result.success).toBe(true);
  });

  it('rejects signup when passwords differ', () => {
    const result = SignUpFormSchema.safeParse({
      displayName: 'Ariel Braga',
      email: 'ariel@example.com',
      password: '123456',
      confirmPassword: '654321',
      acceptedLegalTerms: true,
    });

    expect(result.success).toBe(false);
  });

  it('rejects signup when legal terms are not accepted', () => {
    const result = SignUpFormSchema.safeParse({
      displayName: 'Ariel Braga',
      email: 'ariel@example.com',
      password: '123456',
      confirmPassword: '123456',
      acceptedLegalTerms: false,
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid recover email', () => {
    const result = RecoverFormSchema.safeParse({
      email: 'email-invalido',
    });

    expect(result.success).toBe(false);
  });

  it('rejects signup when email is invalid', () => {
    const result = SignUpFormSchema.safeParse({
      displayName: 'Ariel Braga',
      email: 'email-invalido',
      password: '123456',
      confirmPassword: '123456',
      acceptedLegalTerms: true,
    });

    expect(result.success).toBe(false);
  });

  it('rejects signup when password exceeds 20 characters', () => {
    const result = SignUpFormSchema.safeParse({
      displayName: 'Ariel Braga',
      email: 'ariel@example.com',
      password: '123456789012345678901',
      confirmPassword: '123456789012345678901',
      acceptedLegalTerms: true,
    });

    expect(result.success).toBe(false);
  });

  it('accepts valid TOTP code', () => {
    const result = TotpCodeSchema.safeParse('123456');

    expect(result.success).toBe(true);
  });

  it('rejects invalid TOTP code format', () => {
    const result = TotpCodeSchema.safeParse('12A45');

    expect(result.success).toBe(false);
  });
});
