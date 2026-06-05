import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
      form.setError('root', { message: 'ID do cliente invalido.' });
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
      <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
        <Card>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando dados do cliente...</Text>
        </Card>
      </View>
    );
  }

  if (clientQuery.error || !clientQuery.data) {
    return (
      <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
        <Card>
          <Text className="text-sm text-error">
            {clientQuery.error instanceof Error ? clientQuery.error.message : 'Falha ao carregar cliente.'}
          </Text>
        </Card>
        <View className="pt-4">
          <Button label="Voltar para clientes" variant="ghost" onPress={() => router.replace(clientsListRoute)} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
      contentContainerClassName="p-6 pb-10 pt-10"
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-2 pb-5">
        <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Editar cliente</Text>
        <Text className="text-base text-zinc-600 dark:text-zinc-300">
          Atualize os dados de contato e observacoes do cliente.
        </Text>
      </View>

      <Card className="gap-4">
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
            />
          )}
        />

        <Controller
          control={form.control}
          name="notes"
          render={({ field, fieldState }) => (
            <Input
              label="Observacoes (opcional)"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Preferencias, alergias ou observacoes importantes"
              error={fieldState.error?.message}
            />
          )}
        />

        {form.formState.errors.root?.message ? (
          <Text className="text-sm text-error">{form.formState.errors.root.message}</Text>
        ) : null}

        <View className="gap-2">
          <Button
            label={updateClientMutation.isPending ? 'Salvando...' : 'Salvar alteracoes'}
            onPress={form.handleSubmit(onSubmit)}
            disabled={updateClientMutation.isPending}
          />
          <Button
            label="Cancelar"
            variant="ghost"
            onPress={() => {
              if (clientId) {
                router.replace(getClientDetailsRoute(clientId));
                return;
              }

              router.replace(clientsListRoute);
            }}
            disabled={updateClientMutation.isPending}
          />
        </View>
      </Card>
    </ScrollView>
  );
}
