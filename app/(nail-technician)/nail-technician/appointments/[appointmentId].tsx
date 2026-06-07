import { Alert, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';

import {
  AppointmentCard,
  formatAppointmentDate,
  formatAppointmentStatus,
  formatAppointmentSyncStatus,
  formatAppointmentTimeRange,
} from '@/components/features/appointments';
import { OperationalScreenShell } from '@/components/features/shared';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppointment, useDeleteAppointmentMutation, useUpdateAppointmentStatusMutation } from '@/hooks/appointments';
import { useClient } from '@/hooks/clients/useClient';
import { type AppointmentStatus } from '@/schemas/appointments/appointment.schema';
import { useSessionStore } from '@/stores/sessionStore';

const statusOptions: AppointmentStatus[] = ['scheduled', 'confirmed', 'completed', 'cancelled'];
const agendaRoute = '/nail-technician/agenda' satisfies Href;

const getAppointmentEditRoute = (appointmentId: string): Href => ({
  pathname: '/nail-technician/appointments/[appointmentId]/edit',
  params: { appointmentId },
});

export default function NailTechnicianAppointmentDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ appointmentId?: string }>();
  const appointmentId = params.appointmentId;
  const userId = useSessionStore((state) => state.userId);

  const appointmentQuery = useAppointment(appointmentId);
  const appointment = appointmentQuery.data;
  const clientQuery = useClient(appointment?.clientId);
  const updateStatusMutation = useUpdateAppointmentStatusMutation();
  const deleteAppointmentMutation = useDeleteAppointmentMutation();

  async function handleUpdateStatus(status: AppointmentStatus) {
    if (!appointmentId) {
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        appointmentId,
        status,
      });
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao atualizar status.');
    }
  }

  function handleDeleteAppointment() {
    if (!appointmentId) {
      return;
    }

    Alert.alert('Excluir atendimento', 'Tem certeza que deseja excluir este atendimento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAppointmentMutation.mutateAsync(appointmentId);
            router.replace(agendaRoute);
          } catch (error) {
            Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao excluir atendimento.');
          }
        },
      },
    ]);
  }

  if (appointmentQuery.isLoading || clientQuery.isLoading) {
    return (
      <OperationalScreenShell
        title="Atendimento"
        subtitle="Carregando os detalhes operacionais do atendimento."
        onBackPress={() => router.replace(agendaRoute)}
        backLabel="Voltar para agenda"
        contentContainerClassName="pb-10"
      >
        <Card className="border-white/10 bg-white/5">
          <Text className="text-sm text-zinc-300">Carregando atendimento...</Text>
        </Card>
      </OperationalScreenShell>
    );
  }

  const error = appointmentQuery.error ?? clientQuery.error ?? null;
  if (error || !appointment) {
    return (
      <OperationalScreenShell
        title="Atendimento"
        subtitle="Não foi possível abrir os detalhes deste atendimento."
        onBackPress={() => router.replace(agendaRoute)}
        backLabel="Voltar para agenda"
        contentContainerClassName="pb-10"
      >
        <Card className="border-white/10 bg-white/5">
          <Text className="text-sm text-error">
            {error instanceof Error ? error.message : 'Atendimento não encontrado.'}
          </Text>
        </Card>
      </OperationalScreenShell>
    );
  }

  if (!userId || appointment.manicureId !== userId) {
    return (
      <OperationalScreenShell
        title="Atendimento"
        subtitle="Este registro não está disponível para a profissional atual."
        onBackPress={() => router.replace(agendaRoute)}
        backLabel="Voltar para agenda"
        contentContainerClassName="pb-10"
      >
        <Card className="border-white/10 bg-white/5">
          <Text className="text-sm text-error">Este atendimento não pertence à profissional logada.</Text>
        </Card>
      </OperationalScreenShell>
    );
  }

  const clientName = clientQuery.data?.name ?? appointment.clientId;
  const isMutating = updateStatusMutation.isPending || deleteAppointmentMutation.isPending;

  return (
    <OperationalScreenShell
      title={clientName}
      subtitle={formatAppointmentDate(appointment.startTime)}
      onBackPress={() => router.replace(agendaRoute)}
      backLabel="Voltar para agenda"
      contentContainerClassName="pb-10"
      topSlot={<AppointmentCard appointment={appointment} clientName={clientName} />}
    >
      <View className="gap-4">
        <Card className="gap-3 border-white/10 bg-white/5">
          <Text className="text-sm font-semibold text-zinc-100">Resumo</Text>
          <Text className="text-sm text-zinc-300">
            Horário: {formatAppointmentTimeRange(appointment.startTime, appointment.endTime)}
          </Text>
          <Text className="text-sm text-zinc-300">
            Status atual: {formatAppointmentStatus(appointment.status)}
          </Text>
          <Text className="text-sm text-zinc-300">
            Sincronização: {formatAppointmentSyncStatus(appointment.syncStatus)}
          </Text>
          <Text className="text-sm text-zinc-300">
            Observações: {appointment.notes || 'Sem observações'}
          </Text>
        </Card>

        <Card className="gap-3 border-white/10 bg-white/5">
          <Text className="text-sm font-semibold text-zinc-100">Atualizar status</Text>
          <View className="flex-row flex-wrap gap-2">
            {statusOptions.map((status) => {
              const isSelected = status === appointment.status;

              return (
                <Pressable
                  key={status}
                  onPress={() => void handleUpdateStatus(status)}
                  disabled={isMutating || isSelected}
                  className={`rounded-full border px-4 py-2 ${
                    isSelected ? 'border-primary bg-primary/15' : 'border-white/10 bg-black/20'
                  } ${isMutating || isSelected ? 'opacity-60' : 'active:opacity-90'}`}
                >
                  <Text className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-zinc-200'}`}>
                    {formatAppointmentStatus(status)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <View className="gap-3">
          <Button
            label="Editar atendimento"
            className="rounded-2xl"
            onPress={() => router.push(getAppointmentEditRoute(appointment.id))}
            disabled={isMutating}
          />
          <Button
            label={deleteAppointmentMutation.isPending ? 'Excluindo...' : 'Excluir atendimento'}
            variant="danger"
            className="rounded-2xl"
            onPress={handleDeleteAppointment}
            disabled={isMutating}
          />
          <Button
            label="Voltar para agenda"
            variant="secondary"
            className="rounded-2xl"
            onPress={() => router.replace(agendaRoute)}
            disabled={isMutating}
          />
        </View>
      </View>
    </OperationalScreenShell>
  );
}
