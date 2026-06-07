import { Link, useRouter } from 'expo-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';

import { AuthScreenShell } from '@/components/features/auth/AuthScreenShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useGoogleAuth } from '@/hooks/auth/useGoogleAuth';
import { useAuthSession } from '@/hooks/auth/useAuthSession';
import { LoginFormSchema, type LoginFormInput } from '@/schemas/auth/login-form.schema';

export default function LoginScreen() {
  const router = useRouter();
  const authSession = useAuthSession();
  const googleAuth = useGoogleAuth();
  const form = useForm<LoginFormInput>({
    resolver: zodResolver(LoginFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginFormInput) {
    try {
      await authSession.signIn(values);
      router.replace('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao entrar.';
      form.setError('root', { message });
    }
  }

  return (
    <AuthScreenShell
      title="Entrar na conta"
      subtitle="Acesse sua agenda, seus clientes e o painel do salão em um só lugar."
    >
      <View className="gap-4">
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Input
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              label="E-mail"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="nome@empresa.com"
              value={field.value}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Input
              autoCapitalize="none"
              autoComplete="password"
              label="Senha"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="Sua senha"
              secureTextEntry
              value={field.value}
              error={fieldState.error?.message}
            />
          )}
        />

        {form.formState.errors.root?.message ? (
          <Text className="text-sm text-error">{form.formState.errors.root.message}</Text>
        ) : null}

        <Button
          label={authSession.isLoading ? 'Entrando...' : 'Entrar'}
          onPress={form.handleSubmit(onSubmit)}
          disabled={authSession.isLoading}
        />

        <Button
          label={googleAuth.googleLoading ? 'Conectando Google...' : 'Entrar com Google'}
          variant="secondary"
          disabled={!googleAuth.canSignInWithGoogle || !googleAuth.googleRequestReady || googleAuth.googleLoading}
          onPress={() => {
            void googleAuth.promptGoogleSignIn();
          }}
        />

        {googleAuth.googleError ? <Text className="text-sm text-error">{googleAuth.googleError}</Text> : null}

        <View className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <Text className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Ao continuar, voce declara que leu nossa Politica de Privacidade e os Termos e Consentimento
            para uso e tratamento de dados.
          </Text>
          <View className="mt-3 gap-2">
            <Link href="/privacy-policy" asChild>
              <Pressable accessibilityRole="link">
                <Text className="text-sm font-semibold text-sky-700 underline dark:text-sky-300">
                  Abrir Politica de Privacidade
                </Text>
              </Pressable>
            </Link>
            <Link href="/terms-consent" asChild>
              <Pressable accessibilityRole="link">
                <Text className="text-sm font-semibold text-sky-700 underline dark:text-sky-300">
                  Abrir Termos e Consentimento
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>

        <View className="gap-2">
          <Pressable onPress={() => router.push('/recover')} accessibilityRole="button">
            <Text className="text-center text-sm font-semibold text-sky-700 underline dark:text-sky-300">
              Esqueci minha senha
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push('/signup')} accessibilityRole="button">
            <Text className="text-center text-sm font-semibold text-sky-700 underline dark:text-sky-300">
              Criar conta
            </Text>
          </Pressable>
        </View>
      </View>
    </AuthScreenShell>
  );
}
