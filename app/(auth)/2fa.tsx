import { Redirect, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { ShieldCheck } from 'lucide-react-native';
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
      form.setError('code', { message: parsed.error.issues[0]?.message ?? 'Código inválido.' });
      return;
    }

    if (!challengeQuery.data) {
      form.setError('root', { message: 'Não foi possível carregar o status da verificação em duas etapas.' });
      return;
    }

    try {
      if (shouldShowEnrollment) {
        await confirmEnrollment(parsed.data);
      } else {
        const verification = await verifyCode(parsed.data);
        if (!verification.verified) {
          form.setError('root', { message: 'Código do autenticador inválido. Tente novamente.' });
          return;
        }
      }

      authSession.completeSecondFactor();
      router.replace('/');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha ao validar o código da verificação em duas etapas.';
      form.setError('root', { message });
    }
  }

  return (
    <AuthScreenShell
      eyebrow="Segurança"
      title="Verificação em duas etapas"
      subtitle="Para proteger sua conta, confirme o código do autenticador antes de acessar o NailFlow."
    >
      <View className="gap-5">
        {isBootstrapping ? (
          <Text className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
            Carregando a configuração da verificação em duas etapas...
          </Text>
        ) : null}

        <View className="flex-row items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <View className="mt-0.5 rounded-2xl bg-primary/15 p-3">
            <ShieldCheck size={20} color="#f472b6" />
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-sm font-semibold text-zinc-100">Confirmação de acesso</Text>
            <Text className="text-sm leading-6 text-zinc-300">
              Use o app autenticador vinculado à sua conta para gerar o código de confirmação.
            </Text>
          </View>
        </View>

        {shouldShowEnrollment && enrollmentData ? (
          <View className="gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <Text className="text-sm font-semibold text-zinc-100">Configure o autenticador com os dados abaixo:</Text>
            <View className="gap-1">
              <Text className="text-xs font-medium uppercase tracking-wide text-zinc-500">Chave secreta</Text>
              <Text selectable className="text-sm text-zinc-100">
                {enrollmentData.secret}
              </Text>
            </View>
            <View className="gap-1">
              <Text className="text-xs font-medium uppercase tracking-wide text-zinc-500">Link de configuração</Text>
              <Text selectable className="text-sm text-zinc-100">
                {enrollmentData.otpauthUri}
              </Text>
            </View>
            <Text className="text-xs leading-5 text-zinc-400">
              Copie os dados para o aplicativo autenticador e informe o primeiro código gerado.
            </Text>
          </View>
        ) : (
          <Text className="text-sm leading-6 text-zinc-300">
            Digite o código de 6 dígitos gerado no seu aplicativo autenticador.
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
              label="Código do autenticador"
              containerClassName="gap-3"
              labelClassName="text-zinc-200"
              inputWrapperClassName="rounded-2xl border-white/10 bg-zinc-950"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="000000"
              className="text-center text-xl font-semibold"
              maxLength={6}
              style={{ letterSpacing: 6 }}
              value={field.value}
              error={fieldState.error?.message}
            />
          )}
        />

        {form.formState.errors.root?.message ? (
          <Text className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {form.formState.errors.root.message}
          </Text>
        ) : null}

        {queryErrorMessage ? (
          <Text className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {queryErrorMessage}
          </Text>
        ) : null}
        {totpError ? (
          <Text className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {totpError}
          </Text>
        ) : null}

        <Button
          label={
            totpLoading
              ? 'Validando...'
              : shouldShowEnrollment
                ? 'Ativar verificação em duas etapas'
                : 'Verificar código'
          }
          className="h-14 rounded-2xl"
          onPress={form.handleSubmit(onSubmit)}
          disabled={totpLoading || isBootstrapping || !challengeQuery.data}
        />

        <Button
          label="Recarregar status"
          variant="ghost"
          className="h-14 rounded-2xl border-white/10 bg-white/5"
          onPress={() => {
            void challengeQuery.refetch();
          }}
          disabled={totpLoading}
        />

        <Button
          label="Sair da conta"
          variant="secondary"
          className="h-14 rounded-2xl"
          onPress={() => {
            void authSession.signOut();
          }}
          disabled={totpLoading}
        />
      </View>
    </AuthScreenShell>
  );
}
