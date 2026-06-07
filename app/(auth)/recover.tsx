import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Mail } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { AuthScreenShell } from '@/components/features/auth/AuthScreenShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthSession } from '@/hooks/auth/useAuthSession';
import { RecoverFormSchema, type RecoverFormInput } from '@/schemas/auth/recover-form.schema';

export default function RecoverScreen() {
  const router = useRouter();
  const authSession = useAuthSession();
  const form = useForm<RecoverFormInput>({
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: RecoverFormInput) {
    const parsed = RecoverFormSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'email') {
          form.setError(field, { message: issue.message });
        }
      }
      return;
    }

    try {
      await authSession.sendRecoverEmail(parsed.data.email);
      form.reset(parsed.data);
      form.setError('root', { message: 'Se o e-mail existir, enviaremos as instruções de recuperação.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao solicitar recuperação.';
      form.setError('root', { message });
    }
  }

  return (
    <AuthScreenShell
      eyebrow="Recuperação"
      backHref="/login"
      backLabel="Voltar para o login"
      title="Redefina sua senha"
      subtitle="Informe seu e-mail para receber um link seguro de recuperação."
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

        {form.formState.errors.root?.message ? (
          <Text className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-zinc-300">
            {form.formState.errors.root.message}
          </Text>
        ) : null}

        <Button
          label={authSession.isLoading ? 'Enviando...' : 'Enviar link'}
          className="h-14 rounded-2xl"
          onPress={form.handleSubmit(onSubmit)}
          disabled={authSession.isLoading}
        />

        <Pressable onPress={() => router.push('/login')} accessibilityRole="button">
          <Text className="text-center text-sm font-semibold text-sky-300 underline">Voltar para o login</Text>
        </Pressable>
      </View>
    </AuthScreenShell>
  );
}
