import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { OperationalScreenShell } from '@/components/features/shared';
import { Input } from '@/components/ui/Input';
import { useClient } from '@/hooks/clients/useClient';
import { useUpdateClientMutation } from '@/hooks/clients/useClientMutations';
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

export default function EditClientScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ clientId?: string }>();
  const clientId = params.clientId;
  const clientQuery = useClient(clientId);
  const updateClientMutation = useUpdateClientMutation();
  const form = useForm<ClientFormInput>({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      notes: '',
      tags: '',
    },
  });

  useEffect(() => {
    const client = clientQuery.data;
    if (!client) {
      return;
    }

    form.reset({
      name: client.name,
      phone: client.phone,
      email: client.email ?? '',
      notes: client.notes,
      tags: client.tags.join(', '),
    });
  }, [clientQuery.data, form]);

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

    if (!clientId) {
      form.setError('root', { message: 'ID do cliente inválido.' });
      return;
    }

    try {
      await updateClientMutation.mutateAsync({
        clientId,
        data: mapClientFormToUpsertInput(parsed.data),
      });
      router.replace(getClientDetailsRoute(clientId));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao atualizar cliente.';
      form.setError('root', { message });
    }
  }

  if (clientQuery.isLoading) {
    return (
      <OperationalScreenShell
        title="Editar cliente"
        subtitle="Carregando os dados da cliente."
        backLabel="Voltar para clientes"
        onBackPress={() => router.replace(clientsListRoute)}
        contentContainerClassName="pb-10"
      >
        <Card className="border-white/10 bg-white/5">
          <Text className="text-sm text-zinc-300">Carregando dados da cliente...</Text>
        </Card>
      </OperationalScreenShell>
    );
  }

  if (clientQuery.error || !clientQuery.data) {
    return (
      <OperationalScreenShell
        title="Editar cliente"
        subtitle="Não foi possível carregar os dados da cliente."
        backLabel="Voltar para clientes"
        onBackPress={() => router.replace(clientsListRoute)}
        contentContainerClassName="pb-10"
      >
        <Card className="border-white/10 bg-white/5">
          <Text className="text-sm text-error">
            {clientQuery.error instanceof Error ? clientQuery.error.message : 'Falha ao carregar cliente.'}
          </Text>
        </Card>
      </OperationalScreenShell>
    );
  }

  return (
    <OperationalScreenShell
      title="Editar cliente"
      subtitle="Atualize os dados de contato e observações da cliente."
      backLabel="Voltar para detalhes"
      onBackPress={() => {
        if (clientId) {
          router.replace(getClientDetailsRoute(clientId));
          return;
        }

        router.replace(clientsListRoute);
      }}
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="pb-10"
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

        <Button
          label={updateClientMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
          className="h-12 rounded-2xl"
          onPress={form.handleSubmit(onSubmit)}
          disabled={updateClientMutation.isPending}
        />
        <Button
          label="Cancelar"
          variant="ghost"
          className="h-12 rounded-2xl border-white/10 bg-white/5"
          onPress={() => {
            if (clientId) {
              router.replace(getClientDetailsRoute(clientId));
              return;
            }

            router.replace(clientsListRoute);
          }}
          disabled={updateClientMutation.isPending}
        />
      </Card>
    </OperationalScreenShell>
  );
}
