import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useCreateOwnerNailTechnicianMutation } from '@/hooks/users';
import {
  OwnerCreateNailTechnicianFormSchema,
  mapOwnerCreateNailTechnicianFormToInput,
  type OwnerCreateNailTechnicianFormInput,
} from '@/schemas/users/owner-create-nail-technician.schema';
import { type CreateOwnerNailTechnicianResult } from '@/services/users/ownerNailTechnicianService';

const ownerManicuresRoute = '/owner/manicures' as Href;

function resolveSuccessMessage(result: CreateOwnerNailTechnicianResult) {
  if (result.message) {
    return result.message;
  }

  if (result.status === 'created') {
    return 'Conta criada com segurança. Oriente a profissional a usar "Esqueci minha senha" no login para definir a própria senha.';
  }

  return 'O cadastro foi vinculado ao salão. Oriente a profissional a redefinir a senha no login para ativar o acesso.';
}

export default function NewOwnerManicureScreen() {
  const router = useRouter();
  const createMutation = useCreateOwnerNailTechnicianMutation();
  const [successResult, setSuccessResult] = useState<CreateOwnerNailTechnicianResult | null>(null);
  const form = useForm<OwnerCreateNailTechnicianFormInput>({
    defaultValues: {
      displayName: '',
      email: '',
      phone: '',
    },
  });

  async function onSubmit(values: OwnerCreateNailTechnicianFormInput) {
    form.clearErrors();

    const parsed = OwnerCreateNailTechnicianFormSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'displayName' || field === 'email' || field === 'phone') {
          form.setError(field, { message: issue.message });
        }
      }
      return;
    }

    try {
      const result = await createMutation.mutateAsync(mapOwnerCreateNailTechnicianFormToInput(parsed.data));
      setSuccessResult(result);
      form.reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao iniciar o cadastro da profissional.';
      form.setError('root', { message });
      setSuccessResult(null);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
      contentContainerClassName="p-6 pb-10 pt-10"
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-2 pb-5">
        <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Nova profissional</Text>
        <Text className="text-base text-zinc-600 dark:text-zinc-300">
          Inicie um cadastro seguro para adicionar uma nova profissional ao seu salão sem expor credenciais no app.
        </Text>
      </View>

      <View className="gap-4">
        <Card className="gap-2">
          <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Fluxo seguro</Text>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            Esta tela usa uma operacao backend dedicada para criar a conta da profissional sem trocar a sua sessao nem
            expor senha no app do owner.
          </Text>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            Depois da criacao, a profissional deve usar &quot;Esqueci minha senha&quot; no login para definir a
            propria senha com seguranca.
          </Text>
        </Card>

        {successResult ? (
          <Card className="gap-3">
            <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Cadastro iniciado</Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-300">{resolveSuccessMessage(successResult)}</Text>
            <View className="gap-2">
              <Button
                label="Cadastrar outra profissional"
                variant="secondary"
                onPress={() => {
                  setSuccessResult(null);
                  form.reset();
                }}
              />
              <Button
                label="Voltar para equipe"
                variant="ghost"
                onPress={() => router.replace(ownerManicuresRoute)}
              />
            </View>
          </Card>
        ) : (
          <Card className="gap-4">
            <Controller
              control={form.control}
              name="displayName"
              render={({ field, fieldState }) => (
                <Input
                  label="Nome completo"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  autoCapitalize="words"
                  autoCorrect={false}
                  placeholder="Nome da profissional"
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Input
                  label="E-mail profissional"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="nome@profissional.com"
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="phone"
              render={({ field, fieldState }) => (
                <Input
                  label="Telefone ou WhatsApp (opcional)"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  keyboardType="phone-pad"
                  placeholder="(00) 00000-0000"
                  error={fieldState.error?.message}
                />
              )}
            />

            {form.formState.errors.root?.message ? (
              <Text className="text-sm text-error">{form.formState.errors.root.message}</Text>
            ) : null}

            <View className="gap-2">
              <Button
                label={createMutation.isPending ? 'Iniciando cadastro...' : 'Iniciar cadastro seguro'}
                onPress={form.handleSubmit(onSubmit)}
                disabled={createMutation.isPending}
              />
              <Button
                label="Cancelar"
                variant="ghost"
                onPress={() => router.replace(ownerManicuresRoute)}
                disabled={createMutation.isPending}
              />
            </View>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}
