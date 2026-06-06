import { Controller, useForm } from 'react-hook-form';
import { useRouter, type Href } from 'expo-router';
import { Text, View } from 'react-native';

import { OperationalScreenShell } from '@/components/features/shared';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useCreateClientMutation } from '@/hooks/clients/useClientMutations';
import {
  ClientFormSchema,
  mapClientFormToUpsertInput,
  type ClientFormInput,
} from '@/schemas/clients/client-form.schema';

const clientsListRoute = '/nail-technician/clients' satisfies Href;

const getClientDetailsRoute = (clientId: string): Href => ({
  pathname: '/nail-technician/clients/[clientId]',
  params: { clientId },
});

export default function NewClientScreen() {
  const router = useRouter();
  const createClientMutation = useCreateClientMutation();
  const form = useForm<ClientFormInput>({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      notes: '',
      tags: '',
    },
  });

  async function onSubmit(values: ClientFormInput) {
    const parsed = ClientFormSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'name' || field === 'phone' || field === 'email' || field === 'notes' || field === 'tags') {
          form.setError(field, { message: issue.message });
        }
      }
      return;
    }

    try {
      const clientId = await createClientMutation.mutateAsync(mapClientFormToUpsertInput(parsed.data));
      router.replace(getClientDetailsRoute(clientId));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao criar cliente.';
      form.setError('root', { message });
    }
  }

  return (
    <OperationalScreenShell
      title="Novo cliente"
      subtitle="Preencha os dados principais para cadastrar um novo cliente no salão."
    >
      <Card className="gap-4 border-white/10 bg-white/5">
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Input
              label="Nome completo"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              autoCapitalize="words"
              placeholder="Nome do cliente"
              error={fieldState.error?.message}
              inputWrapperClassName="rounded-2xl border-white/10 bg-zinc-900"
            />
          )}
        />

        <Controller
          control={form.control}
          name="phone"
          render={({ field, fieldState }) => (
            <Input
              label="Telefone"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              keyboardType="phone-pad"
              placeholder="(00) 00000-0000"
              error={fieldState.error?.message}
              inputWrapperClassName="rounded-2xl border-white/10 bg-zinc-900"
            />
          )}
        />

        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Input
              label="E-mail (opcional)"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="nome@cliente.com"
              error={fieldState.error?.message}
              inputWrapperClassName="rounded-2xl border-white/10 bg-zinc-900"
            />
          )}
        />

        <Controller
          control={form.control}
          name="tags"
          render={({ field, fieldState }) => (
            <Input
              label="Tags (opcional)"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="vip, alergia, recorrente"
              error={fieldState.error?.message}
              inputWrapperClassName="rounded-2xl border-white/10 bg-zinc-900"
            />
          )}
        />

        <Controller
          control={form.control}
          name="notes"
          render={({ field, fieldState }) => (
            <Input
              label="Observações (opcional)"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Preferências, alergias ou observações importantes"
              error={fieldState.error?.message}
              inputWrapperClassName="rounded-2xl border-white/10 bg-zinc-900"
            />
          )}
        />

        {form.formState.errors.root?.message ? (
          <Text className="text-sm text-error">{form.formState.errors.root.message}</Text>
        ) : null}

        <View className="gap-2">
          <Button
            label={createClientMutation.isPending ? 'Salvando...' : 'Salvar cliente'}
            className="h-12 rounded-2xl"
            onPress={form.handleSubmit(onSubmit)}
            disabled={createClientMutation.isPending}
          />
          <Button
            label="Cancelar"
            variant="ghost"
            className="h-12 rounded-2xl border-white/10 bg-white/5"
            onPress={() => router.replace(clientsListRoute)}
            disabled={createClientMutation.isPending}
          />
        </View>
      </Card>
    </OperationalScreenShell>
  );
}
