import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { auth } from '../../services/firebase';
import { getBusiness, updateBusiness } from '../../services/businesses';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { Business } from '../../types/business';
import type { RootStackParamList } from '../../types/navigation';

export default function NotificationPreferencesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const uid = auth.currentUser?.uid;
  const queryClient = useQueryClient();

  const { data: business } = useQuery({
    queryKey: ['business', uid],
    queryFn: () => (uid ? getBusiness(uid) : Promise.resolve(null)),
    enabled: !!uid,
  });

  const [notifyNewBooking, setNotifyNewBooking] = useState(true);
  const [notifyUpcomingReminder, setNotifyUpcomingReminder] = useState(true);

  useEffect(() => {
    setNotifyNewBooking(business?.notifyNewBooking ?? true);
    setNotifyUpcomingReminder(business?.notifyUpcomingReminder ?? true);
  }, [business?.notifyNewBooking, business?.notifyUpcomingReminder]);

  const save = async (data: Partial<Business>) => {
    if (!uid) return;
    try {
      await updateBusiness(uid, data);
      queryClient.invalidateQueries({ queryKey: ['business', uid] });
    } catch (err) {
      console.error('saveNotificationPreferences failed:', err);
    }
  };

  const handleToggleNewBooking = (value: boolean) => {
    setNotifyNewBooking(value);
    save({ notifyNewBooking: value });
  };

  const handleToggleUpcomingReminder = (value: boolean) => {
    setNotifyUpcomingReminder(value);
    save({ notifyUpcomingReminder: value });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('personalSettings.notificationPreferences.label')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{t('notificationPreferences.subtitle')}</Text>
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleRowBody}>
              <Text style={styles.rowLabel}>{t('notificationPreferences.newBooking')}</Text>
              <Text style={styles.rowDescription}>{t('notificationPreferences.newBookingDescription')}</Text>
            </View>
            <Switch
              value={notifyNewBooking}
              onValueChange={handleToggleNewBooking}
              trackColor={{ false: Light.track, true: Colors.tealLight }}
              thumbColor={notifyNewBooking ? Colors.teal : Colors.white}
            />
          </View>
          <View style={[styles.toggleRow, styles.rowLast]}>
            <View style={styles.toggleRowBody}>
              <Text style={styles.rowLabel}>{t('notificationPreferences.upcomingReminders')}</Text>
              <Text style={styles.rowDescription}>{t('notificationPreferences.upcomingRemindersDescription')}</Text>
            </View>
            <Switch
              value={notifyUpcomingReminder}
              onValueChange={handleToggleUpcomingReminder}
              trackColor={{ false: Light.track, true: Colors.tealLight }}
              thumbColor={notifyUpcomingReminder ? Colors.teal : Colors.white}
            />
          </View>
        </View>
      </ScrollView>
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
    flex: 1,
    textAlign: 'center',
    color: Light.textPrimary,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.heading,
  },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['4xl'] },
  subtitle: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
    marginBottom: Spacing.lg,
  },
  card: {
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
  },
  rowLast: { borderBottomWidth: 0 },
  toggleRowBody: { flex: 1, gap: 2 },
  rowLabel: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  rowDescription: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
});
