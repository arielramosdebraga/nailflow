import { describe, expect, it } from 'vitest';

import { LoginFormSchema } from '@/schemas/auth/login-form.schema';
import { RecoverFormSchema } from '@/schemas/auth/recover-form.schema';
import { SignUpFormSchema } from '@/schemas/auth/signup-form.schema';

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
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid recover email', () => {
    const result = RecoverFormSchema.safeParse({
      email: 'email-invalido',
    });

    expect(result.success).toBe(false);
  });
});
