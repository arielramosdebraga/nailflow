import { Alert, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';

import {
  AppointmentCard,
  formatAppointmentDate,
  formatAppointmentSyncStatus,
  formatAppointmentTimeRange,
  formatAppointmentStatus,
} from '@/components/features/appointments';
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
      <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
        <Card>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">Carregando atendimento...</Text>
        </Card>
      </View>
    );
  }

  const error = appointmentQuery.error ?? clientQuery.error ?? null;
  if (error || !appointment) {
    return (
      <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
        <Card>
          <Text className="text-sm text-error">
            {error instanceof Error ? error.message : 'Atendimento não encontrado.'}
          </Text>
        </Card>
        <View className="pt-4">
          <Button label="Voltar para a agenda" variant="ghost" onPress={() => router.replace(agendaRoute)} />
        </View>
      </View>
    );
  }

  if (!userId || appointment.manicureId !== userId) {
    return (
      <View className="flex-1 bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
        <Card>
          <Text className="text-sm text-error">Este atendimento não pertence à profissional logada.</Text>
        </Card>
        <View className="pt-4">
          <Button label="Voltar para a agenda" variant="ghost" onPress={() => router.replace(agendaRoute)} />
        </View>
      </View>
    );
  }

  const clientName = clientQuery.data?.name ?? appointment.clientId;
  const isMutating = updateStatusMutation.isPending || deleteAppointmentMutation.isPending;

  return (
    <View className="flex-1 justify-between bg-zinc-50 p-6 pt-10 dark:bg-zinc-950">
      <View className="gap-4">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{clientName}</Text>
          <Text className="text-base text-zinc-600 dark:text-zinc-300">
            {formatAppointmentDate(appointment.startTime)}
          </Text>
        </View>

        <AppointmentCard appointment={appointment} clientName={clientName} />

        <Card className="gap-2">
          <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Resumo</Text>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            Horário: {formatAppointmentTimeRange(appointment.startTime, appointment.endTime)}
          </Text>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            Status atual: {formatAppointmentStatus(appointment.status)}
          </Text>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            Sincronização: {formatAppointmentSyncStatus(appointment.syncStatus)}
          </Text>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            Observações: {appointment.notes || 'Sem observações'}
          </Text>
        </Card>

        <Card className="gap-3">
          <Text className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Atualizar status</Text>
          <View className="flex-row flex-wrap gap-2">
            {statusOptions.map((status) => (
              <Button
                key={status}
                label={formatAppointmentStatus(status)}
                fullWidth={false}
                variant={status === appointment.status ? 'secondary' : 'ghost'}
                onPress={() => void handleUpdateStatus(status)}
                disabled={isMutating || status === appointment.status}
              />
            ))}
          </View>
        </Card>
      </View>

      <View className="gap-2 pt-4">
        <Button
          label="Editar atendimento"
          onPress={() => router.push(getAppointmentEditRoute(appointment.id))}
          disabled={isMutating}
        />
        <Button
          label={deleteAppointmentMutation.isPending ? 'Excluindo...' : 'Excluir atendimento'}
          variant="danger"
          onPress={handleDeleteAppointment}
          disabled={isMutating}
        />
        <Button
          label="Voltar para a agenda"
          variant="ghost"
          onPress={() => router.replace(agendaRoute)}
          disabled={isMutating}
        />
      </View>
    </View>
  );
}
