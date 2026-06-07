import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react-native';
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
  const [passwordVisible, setPasswordVisible] = useState(false);
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
      eyebrow="Entrar"
      title="Acesse sua conta"
      subtitle="Bom te ver de novo. Entre para continuar com sua agenda, seus clientes e a gestão do salão."
      footer={
        <View className="gap-3">
          <View className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <Text className="text-sm leading-6 text-zinc-300">
              Ao continuar, você confirma que leu a Política de Privacidade e os Termos e Consentimento do
              NailFlow.
            </Text>
            <View className="mt-3 gap-2">
              <Link href="/privacy-policy" asChild>
                <Pressable accessibilityRole="link">
                  <Text className="text-sm font-semibold text-sky-300 underline">Ler Política de Privacidade</Text>
                </Pressable>
              </Link>
              <Link href="/terms-consent" asChild>
                <Pressable accessibilityRole="link">
                  <Text className="text-sm font-semibold text-sky-300 underline">Ler Termos e Consentimento</Text>
                </Pressable>
              </Link>
            </View>
          </View>

          <View className="gap-2">
            <Pressable onPress={() => router.push('/recover')} accessibilityRole="button">
              <Text className="text-center text-sm font-semibold text-sky-300 underline">Esqueci minha senha</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/signup')} accessibilityRole="button">
              <Text className="text-center text-sm font-semibold text-sky-300 underline">Criar conta</Text>
            </Pressable>
          </View>
        </View>
      }
    >
      <View className="gap-5">
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
              autoComplete="password"
              label="Senha"
              containerClassName="gap-3"
              labelClassName="text-zinc-200"
              inputWrapperClassName="rounded-2xl border-white/10 bg-zinc-950"
              leftAdornment={<LockKeyhole size={18} color="#a1a1aa" />}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="Sua senha"
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

        {form.formState.errors.root?.message ? (
          <Text className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {form.formState.errors.root.message}
          </Text>
        ) : null}

        <Button
          label={authSession.isLoading ? 'Entrando...' : 'Entrar'}
          className="mt-1 h-14 rounded-2xl"
          onPress={form.handleSubmit(onSubmit)}
          disabled={authSession.isLoading}
        />

        <View className="flex-row items-center gap-3">
          <View className="h-px flex-1 bg-white/10" />
          <Text className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">ou continue com</Text>
          <View className="h-px flex-1 bg-white/10" />
        </View>

        <Button
          label={googleAuth.googleLoading ? 'Conectando com Google...' : 'Entrar com Google'}
          variant="ghost"
          className="h-14 rounded-2xl border-white/10 bg-white/5"
          disabled={!googleAuth.canSignInWithGoogle || !googleAuth.googleRequestReady || googleAuth.googleLoading}
          onPress={() => {
            void googleAuth.promptGoogleSignIn();
          }}
        />

        {googleAuth.googleError ? (
          <Text className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {googleAuth.googleError}
          </Text>
        ) : null}
      </View>
    </AuthScreenShell>
  );
}
