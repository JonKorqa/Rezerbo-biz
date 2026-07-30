import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth } from '../../services/firebase';
import { getBusinessAppointments } from '../../services/appointments';
import { WeekStrip } from './components/WeekStrip';
import { TimeGrid } from './components/TimeGrid';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';

// Placeholder until the business profile stores real opening hours.
const BUSINESS_HOURS = '10:00 - 19:00';

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatHeaderDate(date: Date) {
  const today = new Date();
  if (isSameDay(date, today)) return 'Today';
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function AppointmentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [showAddSheet, setShowAddSheet] = useState(false);
  const uid = auth.currentUser?.uid;

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments', uid],
    queryFn: () => (uid ? getBusinessAppointments(uid).catch(() => []) : Promise.resolve([])),
    enabled: !!uid,
  });

  const dayAppointments = useMemo(
    () => appointments.filter((appt) => isSameDay(appt.start, selectedDate)),
    [appointments, selectedDate],
  );

  const openAddSheet = () => setShowAddSheet(true);
  const closeAddSheet = () => setShowAddSheet(false);

  const handleNewAppointment = () => {
    closeAddSheet();
    navigation.navigate('NewAppointment');
  };

  const handleStub = (label: string) => {
    closeAddSheet();
    console.log(`${label} tapped — not built yet.`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity hitSlop={10}>
          <Ionicons name="notifications-outline" size={22} color={Light.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerDateRow}>
            <Text style={styles.headerDate}>{formatHeaderDate(selectedDate)}</Text>
            <Ionicons name="chevron-down" size={16} color={Light.textSecondary} />
          </View>
          <Text style={styles.headerHours}>{BUSINESS_HOURS}</Text>
        </View>

        <TouchableOpacity hitSlop={10}>
          <Ionicons name="ellipsis-horizontal" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
      </View>

      <WeekStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <TimeGrid appointments={dayAppointments} />

      <TouchableOpacity
        style={styles.checklistButton}
        activeOpacity={0.85}
        onPress={() => {
          // TODO: wire up daily checklist / task-list flow.
          Alert.alert('Coming soon', 'Daily checklist is not built yet.');
        }}
      >
        <Ionicons name="clipboard-outline" size={20} color={Light.textPrimary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={openAddSheet}>
        <Ionicons name="add" size={26} color={Colors.white} />
      </TouchableOpacity>

      <Modal visible={showAddSheet} transparent animationType="fade" onRequestClose={closeAddSheet}>
        <Pressable style={styles.sheetBackdrop} onPress={closeAddSheet}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Add new</Text>
              <TouchableOpacity onPress={closeAddSheet} hitSlop={12}>
                <Ionicons name="close" size={22} color={Light.textPrimary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.sheetRow} activeOpacity={0.7} onPress={handleNewAppointment}>
              <View style={styles.sheetIconWrap}>
                <Ionicons name="person-add-outline" size={20} color={Colors.teal} />
              </View>
              <Text style={styles.sheetRowLabel}>New Appointment</Text>
              <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetRow}
              activeOpacity={0.7}
              onPress={() => handleStub('Add Time Reservation')}
            >
              <View style={styles.sheetIconWrap}>
                <Ionicons name="time-outline" size={20} color={Colors.teal} />
              </View>
              <Text style={styles.sheetRowLabel}>Add Time Reservation</Text>
              <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetRow}
              activeOpacity={0.7}
              onPress={() => handleStub('Add Time Off')}
            >
              <View style={styles.sheetIconWrap}>
                <Ionicons name="airplane-outline" size={20} color={Colors.teal} />
              </View>
              <Text style={styles.sheetRowLabel}>Add Time Off</Text>
              <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
            </TouchableOpacity>
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
  checklistButton: {
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
