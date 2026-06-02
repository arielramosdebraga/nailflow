import { useCallback, useMemo, useState } from 'react';

import {
  beginTotpEnrollment,
  confirmTotpEnrollment,
  getTotpStatus,
  verifyTotpCode,
} from '@/services/auth/authService';
import { TotpCodeSchema } from '@/schemas/auth/totp.schema';

export function useTotpAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const run = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    setError(null);
    try {
      return await operation();
    } catch (operationError) {
      const message = operationError instanceof Error ? operationError.message : 'Falha no fluxo de 2FA.';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const parseCode = useCallback((rawCode: string): string => {
    const parsed = TotpCodeSchema.safeParse(rawCode);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Codigo TOTP invalido.';
      setError(message);
      throw new Error(message);
    }

    return parsed.data;
  }, []);

  const getStatusAction = useCallback(() => run(() => getTotpStatus()), [run]);
  const beginEnrollmentAction = useCallback(() => run(() => beginTotpEnrollment()), [run]);
  const confirmEnrollmentAction = useCallback(
    async (rawCode: string) => {
      const code = parseCode(rawCode);
      return run(() => confirmTotpEnrollment({ code }));
    },
    [parseCode, run]
  );
  const verifyCodeAction = useCallback(
    async (rawCode: string) => {
      const code = parseCode(rawCode);
      return run(() => verifyTotpCode({ code }));
    },
    [parseCode, run]
  );

  return useMemo(
    () => ({
      isLoading,
      error,
      clearError,
      getStatus: getStatusAction,
      beginEnrollment: beginEnrollmentAction,
      confirmEnrollment: confirmEnrollmentAction,
      verifyCode: verifyCodeAction,
    }),
    [
      beginEnrollmentAction,
      clearError,
      confirmEnrollmentAction,
      error,
      getStatusAction,
      isLoading,
      verifyCodeAction,
    ]
  );
}
