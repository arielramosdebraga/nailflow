import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';

import { AuthScreenShell } from '@/components/features/auth/AuthScreenShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthSession } from '@/hooks/auth/useAuthSession';
import { SignUpFormSchema, type SignUpFormInput } from '@/schemas/auth/signup-form.schema';

export default function SignUpScreen() {
  const router = useRouter();
  const authSession = useAuthSession();
  const form = useForm<SignUpFormInput>({
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: SignUpFormInput) {
    const parsed = SignUpFormSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (
          field === 'displayName' ||
          field === 'email' ||
          field === 'password' ||
          field === 'confirmPassword'
        ) {
          form.setError(field, { message: issue.message });
        }
      }
      return;
    }

    try {
      await authSession.signUp({
        displayName: parsed.data.displayName,
        email: parsed.data.email,
        password: parsed.data.password,
      });
      router.replace('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao criar conta.';
      form.setError('root', { message });
    }
  }

  return (
    <AuthScreenShell
      title="Criar nova conta"
      subtitle="Cadastro inicial para manicure, dono do salao ou super admin."
    >
      <View className="gap-4">
        <Controller
          control={form.control}
          name="displayName"
          render={({ field, fieldState }) => (
            <Input
              autoCapitalize="words"
              autoComplete="name"
              label="Nome completo"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="Seu nome"
              value={field.value}
              error={fieldState.error?.message}
            />
          )}
        />

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
              autoComplete="password-new"
              label="Senha"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="Minimo 6 caracteres"
              secureTextEntry
              value={field.value}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={form.control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <Input
              autoCapitalize="none"
              autoComplete="password-new"
              label="Confirmar senha"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="Digite a senha novamente"
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
          label={authSession.isLoading ? 'Criando...' : 'Criar conta'}
          onPress={form.handleSubmit(onSubmit)}
          disabled={authSession.isLoading}
        />

        <Link href="/login" className="text-center text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Ja tenho conta
        </Link>
      </View>
    </AuthScreenShell>
  );
}
