import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { GoogleCalendarSyncStatusTag } from '@/components/features/google';
import { Button } from '@/components/ui/Button';
import { useAuthSession } from '@/hooks/auth/useAuthSession';
import { useGoogleCalendarConnection } from '@/hooks/google';

export default function NailTechnicianAgendaScreen() {
  const router = useRouter();
  const authSession = useAuthSession();
  const googleConnection = useGoogleCalendarConnection();

  return (
    <View className="flex-1 justify-between bg-zinc-50 p-6 dark:bg-zinc-950">
      <View className="gap-2 pt-10">
        <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Agenda da Profissional de Unhas</Text>
        <Text className="text-base text-zinc-600 dark:text-zinc-300">
          Estrutura inicial pronta para evoluir na Sprint 3 (atendimentos + calendário).
        </Text>
        <View className="gap-2 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Sincronização Google Agenda</Text>
            <GoogleCalendarSyncStatusTag status={googleConnection.syncIndicator} />
          </View>
          <Text className="text-sm text-zinc-600 dark:text-zinc-300">
            {googleConnection.syncIndicator === 'connected'
              ? 'Conta conectada e pronta para sincronizar.'
              : googleConnection.syncIndicator === 'error'
                ? 'Erro de sincronização. Revise a conexão para continuar.'
                : 'Conexão pendente. Finalize o OAuth para ativar a sincronização.'}
          </Text>
          {googleConnection.errorMessage ? <Text className="text-sm text-error">{googleConnection.errorMessage}</Text> : null}
        </View>
        <View className="pt-2">
          <Button label="Acessar clientes" onPress={() => router.push('./clients')} />
        </View>
        <Button label="Conectar Google Agenda" variant="secondary" onPress={() => router.push('./google-calendar')} />
      </View>

      <Button
        label={authSession.isLoading ? 'Saindo...' : 'Sair'}
        variant="ghost"
        onPress={async () => {
          await authSession.signOut();
          router.replace('/login');
        }}
      />
    </View>
  );
}
