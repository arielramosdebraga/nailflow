import { Redirect, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import { AuthScreenShell } from '@/components/features/auth/AuthScreenShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthSession } from '@/hooks/auth/useAuthSession';
import { useTotpAuth } from '@/hooks/auth/useTotpAuth';
import { TotpCodeSchema } from '@/schemas/auth/totp.schema';

interface TotpFormInput {
  code: string;
}

interface TotpChallengeState {
  enabled: boolean;
  enrollmentData: { secret: string; otpauthUri: string } | null;
}

export default function TwoFactorScreen() {
  const router = useRouter();
  const authSession = useAuthSession();
  const {
    isLoading: totpLoading,
    error: totpError,
    clearError,
    getStatus,
    beginEnrollment,
    confirmEnrollment,
    verifyCode,
  } = useTotpAuth();
  const form = useForm<TotpFormInput>({
    defaultValues: {
      code: '',
    },
  });

  const challengeQuery = useQuery<TotpChallengeState>({
    queryKey: ['auth', 'totp-challenge', authSession.status],
    enabled: authSession.isSecondFactorPending,
    retry: false,
    queryFn: async () => {
      clearError();
      form.clearErrors();

      const status = await getStatus();
      if (status.enabled) {
        return { enabled: true, enrollmentData: null };
      }

      const enrollment = await beginEnrollment();
      return {
        enabled: false,
        enrollmentData: {
          secret: enrollment.secret,
          otpauthUri: enrollment.otpauthUri,
        },
      };
    },
  });

  if (authSession.status === 'loading') {
    return null;
  }

  if (authSession.status === 'anonymous') {
    return <Redirect href="/login" />;
  }

  if (authSession.status === 'authenticated') {
    return <Redirect href="/" />;
  }

  const enrollmentData = challengeQuery.data?.enrollmentData ?? null;
  const shouldShowEnrollment = !challengeQuery.data?.enabled && Boolean(enrollmentData);
  const isBootstrapping = challengeQuery.isLoading;
  const queryErrorMessage =
    challengeQuery.error instanceof Error ? challengeQuery.error.message : null;

  async function onSubmit(values: TotpFormInput) {
    const parsed = TotpCodeSchema.safeParse(values.code);
    if (!parsed.success) {
      form.setError('code', { message: parsed.error.issues[0]?.message ?? 'Codigo invalido.' });
      return;
    }

    if (!challengeQuery.data) {
      form.setError('root', { message: 'Nao foi possivel carregar o status de 2FA.' });
      return;
    }

    try {
      if (shouldShowEnrollment) {
        await confirmEnrollment(parsed.data);
      } else {
        const verification = await verifyCode(parsed.data);
        if (!verification.verified) {
          form.setError('root', { message: 'Codigo TOTP invalido. Tente novamente.' });
          return;
        }
      }

      authSession.completeSecondFactor();
      router.replace('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao validar codigo 2FA.';
      form.setError('root', { message });
    }
  }

  return (
    <AuthScreenShell
      title="Verificacao em duas etapas"
      subtitle="Para proteger sua conta, confirme o código TOTP antes de continuar o acesso."
    >
      <View className="gap-4">
        {isBootstrapping ? (
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando configuracao de 2FA...</Text>
        ) : null}

        {shouldShowEnrollment && enrollmentData ? (
          <View className="gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <Text className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Configure o autenticador com os dados abaixo:
            </Text>
            <View className="gap-1">
              <Text className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Secret
              </Text>
              <Text selectable className="text-sm text-zinc-800 dark:text-zinc-100">
                {enrollmentData.secret}
              </Text>
            </View>
            <View className="gap-1">
              <Text className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                otpauthUri
              </Text>
              <Text selectable className="text-sm text-zinc-800 dark:text-zinc-100">
                {enrollmentData.otpauthUri}
              </Text>
            </View>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">
              Copie manualmente no app autenticador e informe o primeiro codigo gerado.
            </Text>
          </View>
        ) : (
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            Digite o codigo de 6 digitos gerado no seu app autenticador.
          </Text>
        )}

        <Controller
          control={form.control}
          name="code"
          render={({ field, fieldState }) => (
            <Input
              autoCapitalize="none"
              autoComplete="one-time-code"
              keyboardType="number-pad"
              label="Codigo TOTP"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="000000"
              value={field.value}
              error={fieldState.error?.message}
            />
          )}
        />

        {form.formState.errors.root?.message ? (
          <Text className="text-sm text-error">{form.formState.errors.root.message}</Text>
        ) : null}

        {queryErrorMessage ? <Text className="text-sm text-error">{queryErrorMessage}</Text> : null}
        {totpError ? <Text className="text-sm text-error">{totpError}</Text> : null}

        <Button
          label={
            totpLoading
              ? 'Validando...'
              : shouldShowEnrollment
                ? 'Confirmar ativacao 2FA'
                : 'Verificar codigo'
          }
          onPress={form.handleSubmit(onSubmit)}
          disabled={totpLoading || isBootstrapping || !challengeQuery.data}
        />

        <Button
          label="Recarregar status"
          variant="ghost"
          onPress={() => {
            void challengeQuery.refetch();
          }}
          disabled={totpLoading}
        />

        <Button
          label="Sair da conta"
          variant="secondary"
          onPress={() => {
            void authSession.signOut();
          }}
          disabled={totpLoading}
        />
      </View>
    </AuthScreenShell>
  );
}
