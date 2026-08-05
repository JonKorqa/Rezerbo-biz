import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppointments } from '../../hooks/useAppointments';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';
import type { Appointment } from '../../types/appointment';

type Props = NativeStackScreenProps<RootStackParamList, 'CalendarImport'>;

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildScheduleText(appointments: Appointment[], rangeLabel: string): string {
  const sorted = appointments.slice().sort((a, b) => a.start.getTime() - b.start.getTime());
  if (sorted.length === 0) return `No appointments scheduled for ${rangeLabel}.`;

  const lines = sorted.map((appt) => {
    const time = appt.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const who = appt.type === 'reservation' ? appt.label || 'Reservation' : appt.clientName || 'Walk-in';
    return `${time} - ${who} - ${appt.serviceLabel}`;
  });

  return `Schedule for ${rangeLabel}:\n\n${lines.join('\n')}`;
}

export default function CalendarImportScreen({ navigation }: Props) {
  const { data: appointments = [] } = useAppointments();
  const [sharing, setSharing] = useState<'today' | 'week' | null>(null);

  const shareSchedule = async (range: 'today' | 'week') => {
    setSharing(range);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const filtered =
        range === 'today'
          ? appointments.filter((appt) => isSameDay(appt.start, today))
          : appointments.filter((appt) => {
              const daysAhead = Math.floor((appt.start.getTime() - today.getTime()) / 86400000);
              return daysAhead >= 0 && daysAhead < 7;
            });

      const rangeLabel = range === 'today' ? 'Today' : 'This Week';
      const message = buildScheduleText(filtered, rangeLabel);

      await Share.share(Platform.OS === 'ios' ? { message } : { message, title: `Schedule - ${rangeLabel}` });
    } catch (err) {
      console.error('Share schedule failed:', err);
    } finally {
      setSharing(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar Import</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Share your schedule as a text summary you can send to yourself or paste into any
          calendar app.
        </Text>

        <TouchableOpacity
          style={styles.optionRow}
          activeOpacity={0.7}
          disabled={sharing !== null}
          onPress={() => shareSchedule('today')}
        >
          <View style={styles.optionIconWrap}>
            <Ionicons name="today-outline" size={20} color={Colors.teal} />
          </View>
          <View style={styles.optionBody}>
            <Text style={styles.optionTitle}>Share Today's Schedule</Text>
            <Text style={styles.optionSubtitle}>Send today's appointments via the share sheet</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionRow}
          activeOpacity={0.7}
          disabled={sharing !== null}
          onPress={() => shareSchedule('week')}
        >
          <View style={styles.optionIconWrap}>
            <Ionicons name="calendar-outline" size={20} color={Colors.teal} />
          </View>
          <View style={styles.optionBody}>
            <Text style={styles.optionTitle}>Share This Week's Schedule</Text>
            <Text style={styles.optionSubtitle}>Send the next 7 days of appointments</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
        </TouchableOpacity>

        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={16} color={Light.textMuted} />
          <Text style={styles.noteText}>
            Import from Google, Outlook, and other external calendars is coming soon. For now you
            can export your schedule using the options above.
          </Text>
        </View>
      </View>
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
    marginHorizontal: Spacing.sm,
  },
  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, gap: Spacing.md },
  description: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: Typography.fontSize.sm * 1.5,
    marginBottom: Spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1.5,
    borderColor: Light.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  optionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Light.fieldBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBody: { flex: 1, gap: 2 },
  optionTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  optionSubtitle: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
  },
  noteBox: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  noteText: {
    flex: 1,
    color: Light.textMuted,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: Typography.fontSize.xs * 1.5,
  },
});
