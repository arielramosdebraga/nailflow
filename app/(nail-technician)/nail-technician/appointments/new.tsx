import { Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { AppointmentForm } from '@/components/features/appointments';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useCreateAppointmentMutation } from '@/hooks/appointments';
import { useClients } from '@/hooks/clients/useClients';
import { type UpsertAppointmentInput } from '@/schemas/appointments/appointment.schema';
import { useSessionStore } from '@/stores/sessionStore';

const agendaRoute = '/nail-technician/agenda' satisfies Href;

const getAppointmentDetailsRoute = (appointmentId: string): Href => ({
  pathname: '/nail-technician/appointments/[appointmentId]',
  params: { appointmentId },
});

export default function NailTechnicianNewAppointmentScreen() {
  const router = useRouter();
  const userId = useSessionStore((state) => state.userId);

  const clientsQuery = useClients({ limitCount: 250 });
  const createAppointmentMutation = useCreateAppointmentMutation();

  async function handleSubmit(data: Omit<UpsertAppointmentInput, 'salonId'>) {
    const appointmentId = await createAppointmentMutation.mutateAsync(data);
    router.replace(getAppointmentDetailsRoute(appointmentId));
  }

  if (!userId) {
    return (
      <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
        <Card>
          <Text className="text-sm text-error">Nao foi possivel identificar a profissional logada.</Text>
        </Card>
        <View className="pt-4">
          <Button label="Voltar para agenda" variant="ghost" onPress={() => router.replace(agendaRoute)} />
        </View>
      </View>
    );
  }

  if (clientsQuery.isLoading) {
    return (
      <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
        <Card>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando clientes...</Text>
        </Card>
      </View>
    );
  }

  if (clientsQuery.error) {
    return (
      <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
        <Card>
          <Text className="text-sm text-error">
            {clientsQuery.error instanceof Error ? clientsQuery.error.message : 'Falha ao carregar clientes.'}
          </Text>
        </Card>
        <View className="pt-4">
          <Button label="Voltar para agenda" variant="ghost" onPress={() => router.replace(agendaRoute)} />
        </View>
      </View>
    );
  }

  return (
    <AppointmentForm
      title="Novo atendimento"
      description="Crie um novo atendimento na sua agenda."
      submitLabel="Salvar atendimento"
      manicureId={userId}
      clients={clientsQuery.data ?? []}
      isSubmitting={createAppointmentMutation.isPending}
      onSubmit={handleSubmit}
      onCancel={() => router.replace(agendaRoute)}
    />
  );
}
