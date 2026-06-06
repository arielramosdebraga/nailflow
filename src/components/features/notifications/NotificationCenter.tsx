import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  SectionList,
  Text,
  View,
  type PanResponderGestureState,
} from 'react-native';

import { Bell, Clock3, Settings2 } from 'lucide-react-native';

import { useNotificationsFeed } from '@/hooks/notifications';
import { useUnreadNotificationsCount } from '@/hooks/notifications/useUnreadNotificationsCount';
import { type AppNotification } from '@/services/notifications';
import { Card } from '@/components/ui/Card';

const TYPE_LABELS: Record<string, string> = {
  new_appointment: 'Novo agendamento',
  appointment_canceled: 'Atendimento cancelado',
  appointment_rescheduled: 'Atendimento remarcado',
  pre_reminder: 'Lembrete',
  sync_error: 'Erro de sincronização',
  google_expired: 'Conexão com Google expirada',
};

const SWIPE_ACTION_WIDTH = 108;
const SWIPE_TRIGGER_DISTANCE = 68;

interface NotificationSection {
  key: string;
  title: string;
  data: AppNotification[];
}

const STATE_MESSAGES = {
  loading: 'Carregando notificações...',
  empty: 'Nenhuma notificação encontrada nos últimos dias.',
  feedError: 'Não foi possível carregar a lista de notificações.',
  unreadError: 'Não foi possível atualizar o total de notificações não lidas.',
};

function formatDateTime(date: Date | null): string {
  if (!date) {
    return 'Agora';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatDateLabel(date: Date | null): string {
  if (!date) {
    return 'Sem data';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const baseDate = new Date(date);
  baseDate.setHours(0, 0, 0, 0);

  if (baseDate.getTime() === today.getTime()) {
    return 'Hoje';
  }

  if (baseDate.getTime() === yesterday.getTime()) {
    return 'Ontem';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

function getSectionKey(date: Date | null): string {
  if (!date) {
    return 'unknown';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function shouldOpenSwipe(
  canSwipe: boolean,
  gestureState: PanResponderGestureState
): boolean {
  if (!canSwipe) {
    return false;
  }

  return gestureState.dx < -8 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
}

interface SwipeToReadContainerProps {
  canSwipe: boolean;
  onSwipeRead: () => void;
  children: ReactNode;
}

function SwipeToReadContainer({
  canSwipe,
  onSwipeRead,
  children,
}: SwipeToReadContainerProps) {
  const [translateX] = useState(() => new Animated.Value(0));

  const animateBack = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start();
  }, [translateX]);

  const animateRead = useCallback(() => {
    Animated.timing(translateX, {
      toValue: -SWIPE_ACTION_WIDTH,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      onSwipeRead();
      Animated.timing(translateX, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }).start();
    });
  }, [onSwipeRead, translateX]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          shouldOpenSwipe(canSwipe, gestureState),
        onPanResponderMove: (_, gestureState) => {
          if (!canSwipe) {
            return;
          }

          const nextTranslate = Math.max(
            -SWIPE_ACTION_WIDTH,
            Math.min(0, gestureState.dx)
          );
          translateX.setValue(nextTranslate);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (!canSwipe) {
            animateBack();
            return;
          }

          if (Math.abs(gestureState.dx) >= SWIPE_TRIGGER_DISTANCE) {
            animateRead();
            return;
          }

          animateBack();
        },
        onPanResponderTerminate: animateBack,
      }),
    [animateBack, animateRead, canSwipe, translateX]
  );

  return (
    <View className="relative overflow-hidden rounded-2xl">
      {canSwipe ? (
        <View className="absolute inset-y-0 right-0 items-center justify-center bg-primary px-4">
          <Text className="text-xs font-semibold uppercase text-white">Marcar lida</Text>
        </View>
      ) : null}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...(canSwipe ? panResponder.panHandlers : {})}
      >
        {children}
      </Animated.View>
    </View>
  );
}

interface NotificationCenterProps {
  title: string;
  subtitle: string;
  onOpenSettings: () => void;
}

export function NotificationCenter({
  title,
  subtitle,
  onOpenSettings,
}: NotificationCenterProps) {
  const feed = useNotificationsFeed({ limitCount: 100 });
  const unread = useUnreadNotificationsCount();

  const sections = useMemo(
    () =>
      [...feed.notifications]
        .sort((left, right) => {
          const leftTime = left.createdAt?.getTime() ?? 0;
          const rightTime = right.createdAt?.getTime() ?? 0;
          return rightTime - leftTime;
        })
        .reduce<NotificationSection[]>((groups, notification) => {
          const key = getSectionKey(notification.createdAt);
          const title = formatDateLabel(notification.createdAt);
          const currentGroup = groups.find((group) => group.key === key);

          if (currentGroup) {
            currentGroup.data.push(notification);
            return groups;
          }

          groups.push({
            key,
            title,
            data: [notification],
          });

          return groups;
        }, []),
    [feed.notifications]
  );

  const hasNotifications = sections.some((section) => section.data.length > 0);

  return (
    <View className="flex-1 gap-4 bg-zinc-950 p-6 pb-4 pt-10">
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-3xl font-black text-zinc-50">{title}</Text>
            <Text className="text-base leading-6 text-zinc-300">{subtitle}</Text>
          </View>
          <Pressable
            onPress={onOpenSettings}
            className="h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 active:opacity-90"
            accessibilityRole="button"
            accessibilityLabel="Abrir configurações de notificação"
            accessibilityHint="Abre a tela para ajustar tipos de alerta e horários."
          >
            <Settings2 size={18} color="#e4e4e7" />
          </Pressable>
        </View>

        <View
          className="rounded-[24px] border border-white/10 bg-white/5 p-4"
          accessible
          accessibilityLabel={`Total de notificações não lidas: ${unread.unreadCount}.`}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-zinc-200">Não lidas</Text>
            <Text className="text-lg font-black text-zinc-50" accessibilityLiveRegion="polite">
              {unread.unreadCount}
            </Text>
          </View>
          {unread.errorMessage ? (
            <Text className="pt-2 text-sm text-error" accessibilityLiveRegion="polite">
              {`${STATE_MESSAGES.unreadError} ${unread.errorMessage}`}
            </Text>
          ) : null}
          {unread.unreadCount > 0 ? (
            <Pressable
              onPress={() => void feed.markAllAsRead()}
              className="mt-3 h-11 items-center justify-center rounded-2xl bg-primary px-4 active:opacity-90"
              accessibilityRole="button"
              accessibilityLabel="Marcar todas as notificações como lidas"
              accessibilityHint="Define todas as notificações da lista como lidas."
              accessibilityState={{ disabled: feed.isLoading }}
            >
              <Text className="text-sm font-semibold text-white">Marcar todas como lidas</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {feed.errorMessage ? (
        <Card>
          <Text className="text-sm text-error" accessibilityLiveRegion="polite">
            {`${STATE_MESSAGES.feedError} ${feed.errorMessage}`}
          </Text>
        </Card>
      ) : null}

      {feed.isLoading || unread.isLoading ? (
        <Card accessible accessibilityLabel={STATE_MESSAGES.loading}>
          <Text
            className="text-sm text-zinc-300"
            accessibilityLiveRegion="polite"
          >
            {STATE_MESSAGES.loading}
          </Text>
        </Card>
      ) : null}

      {!feed.isLoading && !unread.isLoading && !hasNotifications ? (
        <Card className="items-center gap-2" accessible accessibilityLabel={STATE_MESSAGES.empty}>
          <Bell size={20} color="#a1a1aa" />
          <Text className="text-sm text-zinc-300">{STATE_MESSAGES.empty}</Text>
        </Card>
      ) : null}

      {!feed.isLoading && !unread.isLoading && hasNotifications ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
          accessibilityLabel="Lista de notificações"
          renderSectionHeader={({ section }) => (
            <Text
              className="pt-2 text-xs font-semibold uppercase tracking-wider text-zinc-500"
              accessibilityRole="header"
            >
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => {
            const typeLabel = TYPE_LABELS[item.type] ?? 'Atualizacao';

            return (
              <SwipeToReadContainer
                canSwipe={!item.read}
                onSwipeRead={() => void feed.markOneAsRead(item.id)}
              >
                <View
                  className={`gap-3 rounded-2xl border p-4 ${
                    item.read
                      ? 'border-white/10 bg-white/5'
                      : 'border-primary/30 bg-primary/10'
                  }`}
                  accessible
                  accessibilityLabel={`${item.title}. ${item.body}. Tipo: ${typeLabel}. ${item.read ? 'Notificação lida' : 'Notificação não lida'}.`}
                  accessibilityHint={
                    item.read
                      ? undefined
                      : 'Deslize para a esquerda ou use o botão para marcar como lida.'
                  }
                >
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="flex-1 text-sm font-semibold text-zinc-100">
                      {item.title}
                    </Text>
                    <Text className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase text-zinc-200">
                      {typeLabel}
                    </Text>
                  </View>
                  <Text className="text-sm leading-6 text-zinc-300">{item.body}</Text>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1">
                      <Clock3 size={14} color="#71717a" />
                      <Text className="text-xs text-zinc-500">
                        {formatDateTime(item.createdAt)}
                      </Text>
                    </View>
                    {!item.read ? (
                      <Pressable
                        onPress={() => void feed.markOneAsRead(item.id)}
                        className="rounded-xl border border-white/10 px-3 py-1.5 active:opacity-80"
                        accessibilityRole="button"
                        accessibilityLabel="Marcar notificação como lida"
                        accessibilityHint="Atualiza somente esta notificação para o status de lida."
                      >
                        <Text className="text-xs font-semibold text-zinc-100">
                          Marcar lida
                        </Text>
                      </Pressable>
                    ) : (
                      <Text className="text-xs font-medium text-zinc-500">
                        Lida
                      </Text>
                    )}
                  </View>
                </View>
              </SwipeToReadContainer>
            );
          }}
        />
      ) : null}
    </View>
  );
}
