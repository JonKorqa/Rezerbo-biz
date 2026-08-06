import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Radius, Spacing, Typography } from '../../../theme';
import { Light } from '../../../theme/light';
import { DEFAULT_BUSINESS_HOURS, dayOfWeekFor, findTimeOffForDate } from '../../../constants/businessHours';
import { localeTag } from '../../../utils/locale';
import type { Appointment } from '../../../types/appointment';
import type { BusinessHours, TimeOffEntry } from '../../../types/business';
import { EmptyState } from '../../../components/EmptyState';

const DAYS_AHEAD = 14;

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDateLabel(date: Date, today: Date, locale: string, todayLabel: string) {
  if (isSameDay(date, today)) return todayLabel;
  const weekday = date.toLocaleDateString(locale, { weekday: 'short' });
  const month = date.toLocaleDateString(locale, { month: 'short' });
  return `${weekday}, ${date.getDate()} ${month}`;
}

interface AgendaListProps {
  appointments: Appointment[];
  hours?: BusinessHours;
  timeOff?: TimeOffEntry[];
  defaultColor?: string;
  onEditHours: () => void;
}

export function AgendaList({
  appointments,
  hours = DEFAULT_BUSINESS_HOURS,
  timeOff = [],
  defaultColor = Colors.teal,
  onEditHours,
}: AgendaListProps) {
  const { t, i18n } = useTranslation();
  const locale = localeTag(i18n.language);
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: DAYS_AHEAD }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, []);

  const today = days[0];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {days.map((date) => {
        const dayHours = hours[dayOfWeekFor(date)];
        const dayTimeOff = findTimeOffForDate(date, timeOff);
        const isClosed = dayHours.closed || !!dayTimeOff;
        const dayAppointments = appointments
          .filter((appt) => isSameDay(appt.startTime, date))
          .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

        return (
          <View key={date.toISOString()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.dateLabel}>{formatDateLabel(date, today, locale, t('appointments.today'))}</Text>
              <TouchableOpacity style={styles.hoursPill} activeOpacity={0.7} onPress={onEditHours}>
                <Text style={[styles.hoursPillText, isClosed && styles.hoursPillTextClosed]}>
                  {isClosed ? t('appointments.dayOffUppercase') : `${dayHours.start} - ${dayHours.end}`}
                </Text>
                <Ionicons name="pencil" size={12} color={Light.textMuted} />
              </TouchableOpacity>
            </View>

            {isClosed ? (
              <EmptyState
                variant="closed"
                message={t('appointments.dayOffUnavailable', { label: dayTimeOff?.label ?? t('appointments.dayOff') })}
                compact
              />
            ) : dayAppointments.length === 0 ? (
              <EmptyState variant="cards" icon="calendar-outline" message={t('appointments.noUpcoming')} compact />
            ) : (
              <View style={styles.apptList}>
                {dayAppointments.map((appt) => {
                  const isReservation = appt.type === 'reservation';
                  return (
                    <View key={appt.id} style={styles.apptRow}>
                      <View
                        style={[
                          styles.apptColorDot,
                          { backgroundColor: isReservation ? Light.textMuted : appt.color ?? defaultColor },
                        ]}
                      />
                      <View style={styles.apptInfo}>
                        <Text style={styles.apptService} numberOfLines={1}>
                          {isReservation ? appt.label || t('appointments.reserved') : appt.serviceName}
                        </Text>
                        {!isReservation && (
                          <Text style={styles.apptClient} numberOfLines={1}>
                            {appt.clientName}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.apptTime}>
                        {appt.startTime.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'] },
  section: { paddingTop: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  dateLabel: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  hoursPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  hoursPillText: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
  },
  hoursPillTextClosed: { color: Light.textMuted },
  apptList: { gap: Spacing.sm, paddingBottom: Spacing.sm },
  apptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Light.fieldBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  apptColorDot: { width: 8, height: 8, borderRadius: Radius.full },
  apptInfo: { flex: 1, gap: 2 },
  apptService: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  apptClient: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
  },
  apptTime: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
  },
});
