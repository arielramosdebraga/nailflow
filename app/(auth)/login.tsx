import { useRouter } from 'expo-router';
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
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginFormInput) {
    const parsed = LoginFormSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'email' || field === 'password') {
          form.setError(field, { message: issue.message });
        }
      }
      return;
    }

    try {
      await authSession.signIn(parsed.data);
      router.replace('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao entrar.';
      form.setError('root', { message });
    }
  }

  return (
    <AuthScreenShell
      title="Entrar na conta"
      subtitle="Acesse sua agenda, clientes e o painel do salão no NailFlow."
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
