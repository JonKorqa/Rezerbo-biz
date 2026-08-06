import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAppointments } from '../../hooks/useAppointments';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import { localeTag } from '../../utils/locale';
import type { RootStackParamList } from '../../types/navigation';
import type { Appointment } from '../../types/appointment';

type Props = NativeStackScreenProps<RootStackParamList, 'CalendarImport'>;

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildScheduleText(
  appointments: Appointment[],
  rangeLabel: string,
  locale: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const sorted = appointments.slice().sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  if (sorted.length === 0) return t('calendarImport.noAppointments', { range: rangeLabel });

  const lines = sorted.map((appt) => {
    const time = appt.startTime.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
    const who = appt.type === 'reservation' ? appt.label || t('calendarImport.reservation') : appt.clientName || t('newAppointment.walkIn');
    return `${time} - ${who} - ${appt.serviceName}`;
  });

  return t('calendarImport.scheduleFor', { range: rangeLabel }) + `\n\n${lines.join('\n')}`;
}

export default function CalendarImportScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const locale = localeTag(i18n.language);
  const { data: appointments = [] } = useAppointments();
  const [sharing, setSharing] = useState<'today' | 'week' | null>(null);

  const shareSchedule = async (range: 'today' | 'week') => {
    setSharing(range);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const filtered =
        range === 'today'
          ? appointments.filter((appt) => isSameDay(appt.startTime, today))
          : appointments.filter((appt) => {
              const daysAhead = Math.floor((appt.startTime.getTime() - today.getTime()) / 86400000);
              return daysAhead >= 0 && daysAhead < 7;
            });

      const rangeLabel = range === 'today' ? t('common.today') : t('calendarImport.thisWeek');
      const message = buildScheduleText(filtered, rangeLabel, locale, t);

      await Share.share(Platform.OS === 'ios' ? { message } : { message, title: `${t('calendarImport.title')} - ${rangeLabel}` });
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
        <Text style={styles.headerTitle}>{t('calendarImport.title')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          {t('calendarImport.description')}
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
            <Text style={styles.optionTitle}>{t('calendarImport.shareToday')}</Text>
            <Text style={styles.optionSubtitle}>{t('calendarImport.shareTodaySubtitle')}</Text>
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
            <Text style={styles.optionTitle}>{t('calendarImport.shareWeek')}</Text>
            <Text style={styles.optionSubtitle}>{t('calendarImport.shareWeekSubtitle')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
        </TouchableOpacity>

        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={16} color={Light.textMuted} />
          <Text style={styles.noteText}>
            {t('calendarImport.note')}
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
