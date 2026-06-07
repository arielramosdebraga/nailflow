import { Image } from 'expo-image';
import { useRouter, Redirect, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { BrandLogo } from '@/components/ui/BrandLogo';
import { useSessionStore } from '@/stores/sessionStore';

export default function IndexScreen() {
  const router = useRouter();
  const status = useSessionStore((state) => state.status);
  const role = useSessionStore((state) => state.role);
  const twoFactorHref = '/2fa' as Href;

  if (status === 'loading') {
    return null;
  }

  if (status === 'pending_2fa') {
    return <Redirect href={twoFactorHref} />;
  }

  if (status === 'authenticated' && role === 'super_admin') {
    return <Redirect href="/admin/dashboard" />;
  }

  if (status === 'authenticated' && role === 'salon_owner') {
    return <Redirect href="/owner/dashboard" />;
  }

  if (status === 'authenticated') {
    return <Redirect href="/nail-technician/agenda" />;
  }

  return (
    <View className="flex-1 bg-[#070709]">
      <View className="absolute -left-16 top-28 h-48 w-48 rounded-full bg-[#A21CAF]/20" />
      <View className="absolute -right-16 top-20 h-56 w-56 rounded-full bg-[#EC4899]/10" />
      <View className="absolute bottom-24 left-10 h-40 w-40 rounded-full bg-[#F59E0B]/10" />

      <View className="flex-1 justify-center px-8 pb-12 pt-16">
        <View className="items-center">
          <View className="rounded-[2rem] bg-[#C13DB0]/15 p-3 shadow-lg shadow-[#EC4899]/20">
            <Image
              source={require('../assets/icon_art_square/nailflow_icon_512.png')}
              style={{ width: 88, height: 88, borderRadius: 24 }}
              contentFit="cover"
            />
          </View>

          <BrandLogo className="mt-6" width={220} height={56} variant="splash" tone="dark" />

          <View className="mt-9 max-w-[320px] items-center gap-4">
            <Text className="text-center text-4xl font-bold leading-[44px] text-white">
              Bem-vinda ao seu salão digital
            </Text>
            <Text className="text-center text-lg leading-8 text-zinc-400">
              Gerencie agendamentos, equipe e clientes em um só lugar.
            </Text>
          </View>
        </View>

        <View className="mt-14 gap-4">
          <Pressable
            onPress={() => router.push('/signup')}
            accessibilityRole="button"
            className="h-14 items-center justify-center rounded-2xl bg-primary px-6 active:opacity-90"
          >
            <Text className="text-lg font-semibold text-white">Criar conta do salão</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/login')}
            accessibilityRole="button"
            className="h-14 items-center justify-center rounded-2xl border border-zinc-800 bg-transparent px-6 active:opacity-90"
          >
            <Text className="text-lg font-semibold text-white">Já tenho conta</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
