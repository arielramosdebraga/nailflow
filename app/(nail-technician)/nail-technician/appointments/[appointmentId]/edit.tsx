import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppointmentForm } from '@/components/features/appointments';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppointment, useUpdateAppointmentMutation } from '@/hooks/appointments';
import { useClients } from '@/hooks/clients/useClients';
import { type UpsertAppointmentInput } from '@/schemas/appointments/appointment.schema';
import { useSessionStore } from '@/stores/sessionStore';

export default function NailTechnicianEditAppointmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ appointmentId?: string }>();
  const appointmentId = params.appointmentId;
  const userId = useSessionStore((state) => state.userId);

  const appointmentQuery = useAppointment(appointmentId);
  const clientsQuery = useClients({ limitCount: 250 });
  const updateAppointmentMutation = useUpdateAppointmentMutation();

  async function handleSubmit(data: Omit<UpsertAppointmentInput, 'salonId'>) {
    if (!appointmentId) {
      throw new Error('ID do atendimento invalido.');
    }

    await updateAppointmentMutation.mutateAsync({
      appointmentId,
      data,
    });

    router.replace('../');
  }

  if (appointmentQuery.isLoading || clientsQuery.isLoading) {
    return (
      <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
        <Card>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando atendimento...</Text>
        </Card>
      </View>
    );
  }

  const error = appointmentQuery.error ?? clientsQuery.error ?? null;
  const appointment = appointmentQuery.data;
  if (error || !appointment) {
    return (
      <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
        <Card>
          <Text className="text-sm text-error">
            {error instanceof Error ? error.message : 'Atendimento nao encontrado.'}
          </Text>
        </Card>
        <View className="pt-4">
          <Button label="Voltar para agenda" variant="ghost" onPress={() => router.replace('../../../agenda')} />
        </View>
      </View>
    );
  }

  if (!userId || appointment.manicureId !== userId) {
    return (
      <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
        <Card>
          <Text className="text-sm text-error">Este atendimento nao pertence a profissional logada.</Text>
        </Card>
        <View className="pt-4">
          <Button label="Voltar para agenda" variant="ghost" onPress={() => router.replace('../../../agenda')} />
        </View>
      </View>
    );
  }

  return (
    <AppointmentForm
      title="Editar atendimento"
      description="Atualize data, horario, cliente e status do atendimento."
      submitLabel="Salvar alteracoes"
      manicureId={userId}
      clients={clientsQuery.data ?? []}
      isSubmitting={updateAppointmentMutation.isPending}
      initialAppointment={appointment}
      onSubmit={handleSubmit}
      onCancel={() => router.replace('../')}
    />
  );
}
