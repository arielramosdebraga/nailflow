import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
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
    <AuthScreenShell title="Recuperar senha" subtitle="Informe seu e-mail para receber o link de redefinição.">
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

        {form.formState.errors.root?.message ? (
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">{form.formState.errors.root.message}</Text>
        ) : null}

        <Button
          label={authSession.isLoading ? 'Enviando...' : 'Enviar link'}
          onPress={form.handleSubmit(onSubmit)}
          disabled={authSession.isLoading}
        />

        <Pressable onPress={() => router.push('/login')} accessibilityRole="button">
          <Text className="text-center text-sm font-semibold text-sky-700 underline dark:text-sky-300">
            Voltar para login
          </Text>
        </Pressable>
      </View>
    </AuthScreenShell>
  );
}
