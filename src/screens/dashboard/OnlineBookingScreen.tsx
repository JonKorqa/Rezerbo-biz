import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Modal, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { auth } from '../../services/firebase';
import { getBusiness, updateBusiness } from '../../services/businesses';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { Business } from '../../types/business';
import type { RootStackParamList } from '../../types/navigation';

const LEAD_TIME_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 0, label: 'No minimum' },
  { minutes: 60, label: '1 hour' },
  { minutes: 120, label: '2 hours' },
  { minutes: 1440, label: '1 day' },
];

const WINDOW_OPTIONS: { days: number; label: string }[] = [
  { days: 7, label: '1 week' },
  { days: 14, label: '2 weeks' },
  { days: 30, label: '1 month' },
  { days: 90, label: '3 months' },
];

export default function OnlineBookingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const uid = auth.currentUser?.uid;
  const queryClient = useQueryClient();

  const { data: business } = useQuery({
    queryKey: ['business', uid],
    queryFn: () => (uid ? getBusiness(uid) : Promise.resolve(null)),
    enabled: !!uid,
  });

  const [offersOnlineBooking, setOffersOnlineBooking] = useState(false);
  const [requireBookingApproval, setRequireBookingApproval] = useState(false);
  const [bookingLeadTimeMinutes, setBookingLeadTimeMinutes] = useState(0);
  const [bookingWindowDays, setBookingWindowDays] = useState(30);
  const [leadTimePickerVisible, setLeadTimePickerVisible] = useState(false);
  const [windowPickerVisible, setWindowPickerVisible] = useState(false);

  useEffect(() => {
    setOffersOnlineBooking(business?.offersOnlineBooking ?? false);
    setRequireBookingApproval(business?.requireBookingApproval ?? false);
    setBookingLeadTimeMinutes(business?.bookingLeadTimeMinutes ?? 0);
    setBookingWindowDays(business?.bookingWindowDays ?? 30);
  }, [
    business?.offersOnlineBooking,
    business?.requireBookingApproval,
    business?.bookingLeadTimeMinutes,
    business?.bookingWindowDays,
  ]);

  const save = async (data: Partial<Business>) => {
    if (!uid) return;
    try {
      await updateBusiness(uid, data);
      queryClient.invalidateQueries({ queryKey: ['business', uid] });
    } catch (err) {
      console.error('saveOnlineBookingSettings failed:', err);
    }
  };

  const handleToggleOffers = (value: boolean) => {
    setOffersOnlineBooking(value);
    save({ offersOnlineBooking: value });
  };

  const handleToggleApproval = (value: boolean) => {
    setRequireBookingApproval(value);
    save({ requireBookingApproval: value });
  };

  const handlePickLeadTime = (minutes: number) => {
    setBookingLeadTimeMinutes(minutes);
    setLeadTimePickerVisible(false);
    save({ bookingLeadTimeMinutes: minutes });
  };

  const handlePickWindow = (days: number) => {
    setBookingWindowDays(days);
    setWindowPickerVisible(false);
    save({ bookingWindowDays: days });
  };

  const leadTimeLabel = LEAD_TIME_OPTIONS.find((o) => o.minutes === bookingLeadTimeMinutes)?.label ?? 'No minimum';
  const windowLabel = WINDOW_OPTIONS.find((o) => o.days === bookingWindowDays)?.label ?? '1 month';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Online Booking</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Controls how clients can book with you through Rezervo's consumer app.
        </Text>

        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleRowBody}>
              <Text style={styles.rowLabel}>Enable Online Booking</Text>
              <Text style={styles.rowDescription}>
                When off, clients can't self-book — you'll only be able to add appointments manually here.
              </Text>
            </View>
            <Switch
              value={offersOnlineBooking}
              onValueChange={handleToggleOffers}
              trackColor={{ false: Light.track, true: Colors.tealLight }}
              thumbColor={offersOnlineBooking ? Colors.teal : Colors.white}
            />
          </View>
          <View style={[styles.toggleRow, styles.rowLast]}>
            <View style={styles.toggleRowBody}>
              <Text style={styles.rowLabel}>Require approval for new bookings</Text>
              <Text style={styles.rowDescription}>
                New client-initiated bookings need your confirmation before they're final.
              </Text>
            </View>
            <Switch
              value={requireBookingApproval}
              onValueChange={handleToggleApproval}
              trackColor={{ false: Light.track, true: Colors.tealLight }}
              thumbColor={requireBookingApproval ? Colors.teal : Colors.white}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Timing</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.pickerRow} activeOpacity={0.7} onPress={() => setLeadTimePickerVisible(true)}>
            <View style={styles.toggleRowBody}>
              <Text style={styles.rowLabel}>Booking lead time</Text>
              <Text style={styles.rowDescription}>How far in advance clients must book</Text>
            </View>
            <Text style={styles.pickerValue}>{leadTimeLabel}</Text>
            <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pickerRow, styles.rowLast]}
            activeOpacity={0.7}
            onPress={() => setWindowPickerVisible(true)}
          >
            <View style={styles.toggleRowBody}>
              <Text style={styles.rowLabel}>Booking window</Text>
              <Text style={styles.rowDescription}>How far ahead clients can book</Text>
            </View>
            <Text style={styles.pickerValue}>{windowLabel}</Text>
            <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={leadTimePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLeadTimePickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setLeadTimePickerVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Booking lead time</Text>
              <TouchableOpacity onPress={() => setLeadTimePickerVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={Light.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={LEAD_TIME_OPTIONS}
              keyExtractor={(item) => String(item.minutes)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionRow}
                  activeOpacity={0.7}
                  onPress={() => handlePickLeadTime(item.minutes)}
                >
                  <Text style={styles.optionLabel}>{item.label}</Text>
                  {item.minutes === bookingLeadTimeMinutes && (
                    <Ionicons name="checkmark" size={20} color={Colors.teal} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={windowPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWindowPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setWindowPickerVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Booking window</Text>
              <TouchableOpacity onPress={() => setWindowPickerVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={Light.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={WINDOW_OPTIONS}
              keyExtractor={(item) => String(item.days)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.optionRow} activeOpacity={0.7} onPress={() => handlePickWindow(item.days)}>
                  <Text style={styles.optionLabel}>{item.label}</Text>
                  {item.days === bookingWindowDays && <Ionicons name="checkmark" size={20} color={Colors.teal} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
  sectionTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
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
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
  pickerValue: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  modalBackdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    maxHeight: '70%',
    backgroundColor: Light.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.heading,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
  },
  optionLabel: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
});
