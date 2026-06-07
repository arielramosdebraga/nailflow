import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { AuthScreenShell } from '@/components/features/auth/AuthScreenShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthSession } from '@/hooks/auth/useAuthSession';
import { SignUpFormSchema, type SignUpFormInput } from '@/schemas/auth/signup-form.schema';

export default function SignUpScreen() {
  const router = useRouter();
  const authSession = useAuthSession();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const form = useForm<SignUpFormInput>({
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptedLegalTerms: false,
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
          field === 'confirmPassword' ||
          field === 'acceptedLegalTerms'
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
      eyebrow="Cadastro"
      backHref="/login"
      title="Crie sua conta"
      subtitle="Comece seu acesso ao NailFlow com um cadastro rápido, seguro e pronto para o piloto."
      footer={
        <Pressable onPress={() => router.push('/login')} accessibilityRole="button">
          <Text className="text-center text-sm font-semibold text-sky-300 underline">Já tenho conta</Text>
        </Pressable>
      }
    >
      <View className="gap-5">
        <Controller
          control={form.control}
          name="displayName"
          render={({ field, fieldState }) => (
            <Input
              autoCapitalize="words"
              autoComplete="name"
              label="Nome completo"
              containerClassName="gap-3"
              labelClassName="text-zinc-200"
              inputWrapperClassName="rounded-2xl border-white/10 bg-zinc-950"
              leftAdornment={<UserRound size={18} color="#a1a1aa" />}
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
              containerClassName="gap-3"
              labelClassName="text-zinc-200"
              inputWrapperClassName="rounded-2xl border-white/10 bg-zinc-950"
              leftAdornment={<Mail size={18} color="#a1a1aa" />}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="seu@email.com"
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
              description="Use pelo menos 6 caracteres para acessar sua conta com segurança."
              containerClassName="gap-3"
              labelClassName="text-zinc-200"
              inputWrapperClassName="rounded-2xl border-white/10 bg-zinc-950"
              leftAdornment={<LockKeyhole size={18} color="#a1a1aa" />}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="Crie uma senha forte"
              secureTextEntry={!passwordVisible}
              rightAdornment={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                  onPress={() => setPasswordVisible((current) => !current)}
                >
                  {passwordVisible ? <EyeOff size={18} color="#a1a1aa" /> : <Eye size={18} color="#a1a1aa" />}
                </Pressable>
              }
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
              containerClassName="gap-3"
              labelClassName="text-zinc-200"
              inputWrapperClassName="rounded-2xl border-white/10 bg-zinc-950"
              leftAdornment={<LockKeyhole size={18} color="#a1a1aa" />}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="Digite a senha novamente"
              secureTextEntry={!confirmPasswordVisible}
              rightAdornment={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={confirmPasswordVisible ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                  onPress={() => setConfirmPasswordVisible((current) => !current)}
                >
                  {confirmPasswordVisible ? (
                    <EyeOff size={18} color="#a1a1aa" />
                  ) : (
                    <Eye size={18} color="#a1a1aa" />
                  )}
                </Pressable>
              }
              value={field.value}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={form.control}
          name="acceptedLegalTerms"
          render={({ field, fieldState }) => (
            <View className="gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
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
                  className={`mt-0.5 h-5 w-5 items-center justify-center rounded-md border ${
                    field.value
                      ? 'border-primary bg-primary'
                      : 'border-white/15 bg-zinc-950'
                  }`}
                >
                  {field.value ? <Text className="text-[10px] font-bold text-white">X</Text> : null}
                </View>
                <Text className="flex-1 text-sm leading-6 text-zinc-300">
                  Li e aceito a Política de Privacidade e os Termos e Consentimento para o tratamento dos
                  meus dados conforme a LGPD.
                </Text>
              </Pressable>

              <View className="gap-2">
                <Link href="/privacy-policy" asChild>
                  <Pressable accessibilityRole="link">
                    <Text className="text-sm font-semibold text-sky-300 underline">
                      Ler Política de Privacidade
                    </Text>
                  </Pressable>
                </Link>
                <Link href="/terms-consent" asChild>
                  <Pressable accessibilityRole="link">
                    <Text className="text-sm font-semibold text-sky-300 underline">
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
          <Text className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {form.formState.errors.root.message}
          </Text>
        ) : null}

        <Button
          label={authSession.isLoading ? 'Criando...' : 'Criar conta'}
          className="h-14 rounded-2xl"
          onPress={form.handleSubmit(onSubmit)}
          disabled={authSession.isLoading}
        />
      </View>
    </AuthScreenShell>
  );
}
