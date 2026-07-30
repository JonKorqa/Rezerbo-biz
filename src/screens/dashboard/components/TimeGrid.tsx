import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../../theme';
import { Light } from '../../../theme/light';
import type { Appointment } from '../../../types/appointment';

const GRID_START_HOUR = 7;
const GRID_END_HOUR = 21;
const HOUR_HEIGHT = 64;
const HOURS = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR + 1 }, (_, i) => GRID_START_HOUR + i);

function formatHour(hour: number) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:00 ${period}`;
}

function minutesFromGridStart(date: Date) {
  return (date.getHours() - GRID_START_HOUR) * 60 + date.getMinutes();
}

interface TimeGridProps {
  appointments: Appointment[];
}

export function TimeGrid({ appointments }: TimeGridProps) {
  const gridHeight = (GRID_END_HOUR - GRID_START_HOUR) * HOUR_HEIGHT;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: Spacing['3xl'] }}>
      <View style={[styles.grid, { height: gridHeight }]}>
        {HOURS.map((hour, i) => (
          <View key={hour} style={[styles.hourRow, { top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }]}>
            <Text style={styles.hourLabel}>{formatHour(hour)}</Text>
            <View style={styles.hourLines}>
              <View style={styles.hourLine} />
              <View style={styles.quarterLine} />
              <View style={styles.quarterLine} />
              <View style={styles.quarterLine} />
            </View>
          </View>
        ))}

        {appointments.map((appt) => {
          const top = (minutesFromGridStart(appt.start) / 60) * HOUR_HEIGHT;
          const durationMinutes = Math.max((appt.end.getTime() - appt.start.getTime()) / 60000, 15);
          const height = (durationMinutes / 60) * HOUR_HEIGHT;
          if (top < 0 || top >= gridHeight) return null;

          return (
            <View
              key={appt.id}
              style={[
                styles.appointmentBlock,
                { top, height: Math.max(height, 28), backgroundColor: appt.color ?? Colors.teal },
              ]}
            >
              <Text style={styles.appointmentTime} numberOfLines={1}>
                {appt.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} –{' '}
                {appt.end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </Text>
              <Text style={styles.appointmentLabel} numberOfLines={1}>
                {appt.serviceLabel}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const HOUR_LABEL_WIDTH = 64;

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  grid: { position: 'relative', paddingHorizontal: Spacing.md },
  hourRow: { position: 'absolute', left: 0, right: 0, flexDirection: 'row' },
  hourLabel: {
    width: HOUR_LABEL_WIDTH,
    color: Light.textMuted,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    marginTop: -6,
  },
  hourLines: { flex: 1, justifyContent: 'space-between' },
  hourLine: { height: 1, backgroundColor: Light.border },
  quarterLine: { height: 1, backgroundColor: Light.fieldBg },
  appointmentBlock: {
    position: 'absolute',
    left: HOUR_LABEL_WIDTH + Spacing.sm,
    right: Spacing.md,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    justifyContent: 'center',
    gap: 2,
  },
  appointmentTime: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
  },
  appointmentLabel: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
});
