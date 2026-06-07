import { Link, useRouter } from 'expo-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';

import { AuthScreenShell } from '@/components/features/auth/AuthScreenShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthSession } from '@/hooks/auth/useAuthSession';
import { SignUpFormSchema, type SignUpFormInput } from '@/schemas/auth/signup-form.schema';

export default function SignUpScreen() {
  const router = useRouter();
  const authSession = useAuthSession();
  const form = useForm<SignUpFormInput>({
    resolver: zodResolver(SignUpFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptedLegalTerms: false,
    },
  });

  async function onSubmit(values: SignUpFormInput) {
    try {
      await authSession.signUp({
        displayName: values.displayName,
        email: values.email,
        password: values.password,
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
      subtitle="Cadastro inicial para profissional de unhas, dono do salão ou superadministrador."
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
              placeholder="Mínimo 6 caracteres"
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

        <Controller
          control={form.control}
          name="acceptedLegalTerms"
          render={({ field, fieldState }) => (
            <View className="gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: field.value }}
                className="flex-row gap-3"
                onPress={() => {
                  const nextValue = !field.value;
                  field.onChange(nextValue);
                  if (nextValue) {
                    form.clearErrors('acceptedLegalTerms');
                  }
                }}
              >
                <View
                  className={`mt-0.5 h-5 w-5 items-center justify-center rounded border ${
                    field.value
                      ? 'border-sky-700 bg-sky-700 dark:border-sky-400 dark:bg-sky-400'
                      : 'border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900'
                  }`}
                >
                  {field.value ? <Text className="text-[10px] font-bold text-white">X</Text> : null}
                </View>
                <Text className="flex-1 text-sm leading-6 text-zinc-700 dark:text-zinc-200">
                  Li e aceito a Política de Privacidade e os Termos e Consentimento para tratamento dos
                  meus dados conforme a LGPD.
                </Text>
              </Pressable>

              <View className="gap-2">
                <Link href="/privacy-policy" asChild>
                  <Pressable accessibilityRole="link">
                    <Text className="text-sm font-semibold text-sky-700 underline dark:text-sky-300">
                      Ler Política de Privacidade
                    </Text>
                  </Pressable>
                </Link>
                <Link href="/terms-consent" asChild>
                  <Pressable accessibilityRole="link">
                    <Text className="text-sm font-semibold text-sky-700 underline dark:text-sky-300">
                      Ler Termos e Consentimento
                    </Text>
                  </Pressable>
                </Link>
              </View>

              {fieldState.error?.message ? <Text className="text-sm text-error">{fieldState.error.message}</Text> : null}
            </View>
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

        <Pressable onPress={() => router.push('/login')} accessibilityRole="button">
          <Text className="text-center text-sm font-semibold text-sky-700 underline dark:text-sky-300">
            Já tenho conta
          </Text>
        </Pressable>
      </View>
    </AuthScreenShell>
  );
}
