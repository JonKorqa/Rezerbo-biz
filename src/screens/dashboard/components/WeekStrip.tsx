import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, Radius, Spacing, Typography } from '../../../theme';
import { Light } from '../../../theme/light';
import { localeTag } from '../../../utils/locale';

interface WeekStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function WeekStrip({ selectedDate, onSelectDate }: WeekStripProps) {
  const { i18n } = useTranslation();
  const today = useMemo(() => new Date(), []);

  const weekDates = useMemo(() => {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [today]);

  return (
    <View style={styles.row}>
      {weekDates.map((date) => {
        const selected = isSameDay(date, selectedDate);
        const isToday = isSameDay(date, today);
        return (
          <TouchableOpacity
            key={date.toISOString()}
            style={styles.dayColumn}
            onPress={() => onSelectDate(date)}
            activeOpacity={0.7}
          >
            <Text style={styles.dayLabel}>
              {date.toLocaleDateString(localeTag(i18n.language), { weekday: 'short' }).toUpperCase()}
            </Text>
            <View style={[styles.dateCircle, selected && styles.dateCircleSelected]}>
              <Text
                style={[
                  styles.dateNumber,
                  selected && styles.dateNumberSelected,
                  isToday && !selected && styles.dateNumberToday,
                ]}
              >
                {date.getDate()}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
  },
  dayColumn: { alignItems: 'center', gap: 6, width: 40 },
  dayLabel: {
    color: Light.textMuted,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
  },
  dateCircle: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleSelected: { backgroundColor: Colors.teal },
  dateNumber: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  dateNumberSelected: { color: Colors.white, fontFamily: Typography.fontFamily.bold },
  dateNumberToday: { color: Colors.teal, fontFamily: Typography.fontFamily.bold },
});
