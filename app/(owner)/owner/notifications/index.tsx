import { useRouter, type Href } from "expo-router";
import {
  Bell,
  CalendarDays,
  LayoutGrid,
  ReceiptText,
  UsersRound,
} from "lucide-react-native";
import { View } from "react-native";

import { NotificationCenter } from "@/components/features/notifications";
import { OperationalBottomNav } from "@/components/features/shared";

const notificationSettingsRoute =
  "/owner/notifications/settings" satisfies Href;

export default function OwnerNotificationsScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-zinc-950 pb-24">
      <NotificationCenter
        title="Notificações"
        subtitle="Central de alertas do salão para agenda, remarcações e sincronização."
        onOpenSettings={() => router.push(notificationSettingsRoute)}
      />

      <View className="absolute bottom-0 left-0 right-0">
        <OperationalBottomNav
          items={[
            {
              key: "dashboard",
              label: "Painel",
              icon: LayoutGrid,
              onPress: () => router.push("/owner/dashboard"),
            },
            {
              key: "agenda",
              label: "Agenda",
              icon: CalendarDays,
              onPress: () => router.push("/owner/agenda"),
            },
            {
              key: "manicures",
              label: "Equipe",
              icon: UsersRound,
              onPress: () => router.push("/owner/manicures"),
            },
            {
              key: "commands",
              label: "Comandas",
              icon: ReceiptText,
              onPress: () => router.push("/owner/commands"),
            },
            {
              key: "notifications",
              label: "Alertas",
              icon: Bell,
              active: true,
              onPress: () => router.replace("/owner/notifications"),
            },
          ]}
        />
      </View>
    </View>
  );
}
