import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useAuthSession } from '@/hooks/auth/useAuthSession';

export default function NailTechnicianAgendaScreen() {
  const router = useRouter();
  const authSession = useAuthSession();

  return (
    <View className="flex-1 justify-between bg-zinc-50 p-6 dark:bg-zinc-950">
      <View className="gap-2 pt-10">
        <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Agenda da Profissional de Unhas</Text>
        <Text className="text-base text-zinc-600 dark:text-zinc-300">
          Estrutura inicial pronta para evoluir na Sprint 3 (atendimentos + calendário).
        </Text>
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
