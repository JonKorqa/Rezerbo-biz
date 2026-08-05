import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { auth } from '../../services/firebase';
import { useNotifications } from '../../hooks/useNotifications';
import { markNotificationRead } from '../../services/notifications';
import { EmptyState } from '../../components/EmptyState';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import { localeTag } from '../../utils/locale';
import type { RootStackParamList } from '../../types/navigation';
import type { AppNotification, NotificationType } from '../../types/notification';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

const ICONS_BY_TYPE: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  new_booking: 'calendar-outline',
  upcoming_reminder: 'alarm-outline',
};

function formatRelativeTime(
  date: Date,
  locale: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 60) return t('notifications.justNow');
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return t('notifications.minutesAgo', { count: diffMin });
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return t('notifications.hoursAgo', { count: diffHour });
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 7) return t('notifications.daysAgo', { count: diffDay });
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

export default function NotificationsScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const locale = localeTag(i18n.language);
  const uid = auth.currentUser?.uid;
  const queryClient = useQueryClient();
  const { data: notifications = [] } = useNotifications();

  const handlePress = (notification: AppNotification) => {
    if (!uid || notification.read) return;
    queryClient.setQueryData<AppNotification[]>(['notifications', uid], (prev) =>
      (prev ?? []).map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
    );
    markNotificationRead(uid, notification.id)
      .catch((err) => console.error('markNotificationRead failed:', err))
      .finally(() => queryClient.invalidateQueries({ queryKey: ['notifications', uid] }));
  };

  const renderItem = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity
      style={[styles.row, !item.read && styles.rowUnread]}
      activeOpacity={0.7}
      onPress={() => handlePress(item)}
    >
      <View style={[styles.iconWrap, !item.read && styles.iconWrapUnread]}>
        <Ionicons
          name={ICONS_BY_TYPE[item.type]}
          size={18}
          color={item.read ? Light.textMuted : Colors.teal}
        />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTitleLine}>
          <Text style={[styles.rowTitle, !item.read && styles.rowTitleUnread]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.rowTime}>{formatRelativeTime(item.createdAt, locale, t)}</Text>
        </View>
        <Text style={styles.rowMessage} numberOfLines={2}>
          {item.message}
        </Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
        <TouchableOpacity hitSlop={10}>
          <Ionicons name="filter-outline" size={20} color={Light.textPrimary} />
        </TouchableOpacity>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.content}>
          <EmptyState variant="cards" icon="notifications-outline" message={t('notifications.emptyMessage')} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Light.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.heading,
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['2xl'], gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Light.border,
    backgroundColor: Light.background,
  },
  rowUnread: {
    borderColor: Colors.tealLight,
    backgroundColor: Light.fieldBgFocused,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Light.fieldBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapUnread: { backgroundColor: Colors.white },
  rowBody: { flex: 1, gap: 2 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  rowTitle: {
    flex: 1,
    color: Light.textSecondary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  rowTitleUnread: {
    color: Light.textPrimary,
    fontFamily: Typography.fontFamily.bold,
  },
  rowTime: {
    color: Light.textMuted,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
  },
  rowMessage: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.teal,
    marginTop: 6,
  },
});
