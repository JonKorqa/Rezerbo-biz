import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { auth } from '../../services/firebase';
import { useAppointments } from '../../hooks/useAppointments';
import { useNotifications } from '../../hooks/useNotifications';
import { getBusiness } from '../../services/businesses';
import { createUpcomingReminders } from '../../services/notifications';
import { WeekStrip } from './components/WeekStrip';
import { TimeGrid } from './components/TimeGrid';
import { AgendaList } from './components/AgendaList';
import { Button } from '../../components/ui';
import { EmptyState } from '../../components/EmptyState';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import { DEFAULT_BUSINESS_HOURS, dayOfWeekFor, findTimeOffForDate } from '../../constants/businessHours';
import { localeTag } from '../../utils/locale';
import type { RootStackParamList } from '../../types/navigation';

// Placeholder until the business profile stores real opening hours.
const BUSINESS_HOURS = '10:00 - 19:00';

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatHeaderDate(date: Date, locale: string, todayLabel: string) {
  const today = new Date();
  if (isSameDay(date, today)) return todayLabel;
  return date.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function AppointmentsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showCalendarSettings, setShowCalendarSettings] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const uid = auth.currentUser?.uid;

  const { data: appointments = [] } = useAppointments();
  const { data: notifications = [] } = useNotifications();
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const { data: business } = useQuery({
    queryKey: ['business', uid],
    queryFn: () => (uid ? getBusiness(uid) : Promise.resolve(null)),
    enabled: !!uid,
  });

  // Checks appointments starting within the next hour and writes an "upcoming" reminder
  // notification for any that don't already have one — runs whenever the appointment
  // list changes (e.g. on mount, or after a new booking is saved).
  useEffect(() => {
    if (!uid || appointments.length === 0) return;
    createUpcomingReminders(uid, appointments)
      .then(() => queryClient.invalidateQueries({ queryKey: ['notifications', uid] }))
      .catch((err) => console.error('createUpcomingReminders failed:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, appointments]);

  const businessHours = { ...DEFAULT_BUSINESS_HOURS, ...business?.hours };
  const timeOff = business?.timeOff ?? [];

  const dayAppointments = useMemo(
    () => appointments.filter((appt) => isSameDay(appt.startTime, selectedDate)),
    [appointments, selectedDate],
  );

  const timeOffEntry = findTimeOffForDate(selectedDate, timeOff);
  const isDayOff = businessHours[dayOfWeekFor(selectedDate)].closed || !!timeOffEntry;

  const openAddSheet = () => setShowAddSheet(true);
  const closeAddSheet = () => setShowAddSheet(false);

  const openCalendarSettings = () => setShowCalendarSettings(true);
  const closeCalendarSettings = () => setShowCalendarSettings(false);

  const toggleViewMode = () => setViewMode((mode) => (mode === 'grid' ? 'list' : 'grid'));

  const goToScheduleManagement = () => {
    closeCalendarSettings();
    navigation.navigate('ScheduleManagement');
  };

  const goToCalendarColorSettings = () => {
    closeCalendarSettings();
    navigation.navigate('CalendarColorSettings');
  };

  const goToCalendarImport = () => {
    closeCalendarSettings();
    navigation.navigate('CalendarImport');
  };

  const handleNewAppointment = () => {
    closeAddSheet();
    navigation.navigate('NewAppointment');
  };

  const handleAddReservation = () => {
    closeAddSheet();
    navigation.navigate('AddReservation');
  };

  const handleAddTimeOff = () => {
    closeAddSheet();
    navigation.navigate('AddTimeOff');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity hitSlop={10} onPress={() => navigation.navigate('Notifications')}>
          <View>
            <Ionicons name="notifications-outline" size={22} color={Light.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeLabel}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerDateRow}>
            <Text style={styles.headerDate}>{formatHeaderDate(selectedDate, localeTag(i18n.language), t('appointments.today'))}</Text>
            <Ionicons name="chevron-down" size={16} color={Light.textSecondary} />
          </View>
          <Text style={styles.headerHours}>{BUSINESS_HOURS}</Text>
        </View>

        <TouchableOpacity hitSlop={10} onPress={openCalendarSettings}>
          <Ionicons name="ellipsis-horizontal" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
      </View>

      {viewMode === 'grid' ? (
        <>
          <WeekStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          {isDayOff ? (
            <EmptyState
              variant="closed"
              message={t('appointments.dayOffUnavailable', { label: timeOffEntry?.label ?? t('appointments.dayOff') })}
            />
          ) : (
            <TimeGrid appointments={dayAppointments} defaultColor={business?.calendarColor} />
          )}
        </>
      ) : (
        <AgendaList
          appointments={appointments}
          hours={businessHours}
          timeOff={timeOff}
          defaultColor={business?.calendarColor}
          onEditHours={goToScheduleManagement}
        />
      )}

      <TouchableOpacity style={styles.viewToggleButton} activeOpacity={0.85} onPress={toggleViewMode}>
        <Ionicons name={viewMode === 'grid' ? 'list-outline' : 'calendar-outline'} size={20} color={Light.textPrimary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={openAddSheet}>
        <Ionicons name="add" size={26} color={Colors.white} />
      </TouchableOpacity>

      <Modal visible={showAddSheet} transparent animationType="fade" onRequestClose={closeAddSheet}>
        <Pressable style={styles.sheetBackdrop} onPress={closeAddSheet}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t('appointments.addSheet.title')}</Text>
              <TouchableOpacity onPress={closeAddSheet} hitSlop={12}>
                <Ionicons name="close" size={22} color={Light.textPrimary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.sheetRow} activeOpacity={0.7} onPress={handleNewAppointment}>
              <View style={styles.sheetIconWrap}>
                <Ionicons name="person-add-outline" size={20} color={Colors.teal} />
              </View>
              <Text style={styles.sheetRowLabel}>{t('appointments.addSheet.newAppointment')}</Text>
              <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetRow}
              activeOpacity={0.7}
              onPress={handleAddReservation}
            >
              <View style={styles.sheetIconWrap}>
                <Ionicons name="time-outline" size={20} color={Colors.teal} />
              </View>
              <Text style={styles.sheetRowLabel}>{t('appointments.addSheet.addReservation')}</Text>
              <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetRow}
              activeOpacity={0.7}
              onPress={handleAddTimeOff}
            >
              <View style={styles.sheetIconWrap}>
                <Ionicons name="airplane-outline" size={20} color={Colors.teal} />
              </View>
              <Text style={styles.sheetRowLabel}>{t('appointments.addSheet.addTimeOff')}</Text>
              <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showCalendarSettings}
        transparent
        animationType="fade"
        onRequestClose={closeCalendarSettings}
      >
        <Pressable style={styles.sheetBackdrop} onPress={closeCalendarSettings}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t('appointments.calendarSettings.title')}</Text>
              <TouchableOpacity onPress={closeCalendarSettings} hitSlop={12}>
                <Text style={styles.sheetDoneLink}>{t('appointments.calendarSettings.done')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.sheetRow} activeOpacity={0.7} onPress={goToCalendarColorSettings}>
              <Text style={styles.sheetRowLabel}>{t('appointments.calendarSettings.colorScheme')}</Text>
              <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetRow} activeOpacity={0.7} onPress={goToCalendarImport}>
              <Text style={styles.sheetRowLabel}>{t('appointments.calendarSettings.calendarImport')}</Text>
              <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
            </TouchableOpacity>

            <Button
              label={t('appointments.calendarSettings.scheduleManagement')}
              variant="secondary"
              onPress={goToScheduleManagement}
              style={styles.scheduleButton}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Light.background },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: Radius.full,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeLabel: {
    color: Colors.white,
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
  },
  headerCenter: { alignItems: 'center', gap: 2 },
  headerDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerDate: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.heading,
  },
  headerHours: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
  },
  viewToggleButton: {
    position: 'absolute',
    left: Spacing.xl,
    bottom: Spacing.xl,
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Light.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Light.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.heading,
  },
  sheetDoneLink: {
    color: Colors.teal,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  scheduleButton: { marginTop: Spacing.md },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  sheetIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Light.fieldBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetRowLabel: {
    flex: 1,
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
});
