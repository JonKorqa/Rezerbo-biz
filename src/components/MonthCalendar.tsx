import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Radius, Spacing, Typography } from '../theme';
import { Light } from '../theme/light';
import { localeTag } from '../utils/locale';
import { toDateKey } from '../utils/scheduling';

interface MonthCalendarCell {
  date: Date;
  dateKey: string;
  inCurrentMonth: boolean;
}

function buildMonthGrid(month: Date): MonthCalendarCell[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, monthIndex, 0).getDate();

  const cells: MonthCalendarCell[] = [];

  for (let i = firstWeekday - 1; i >= 0; i--) {
    const date = new Date(year, monthIndex - 1, daysInPrevMonth - i);
    cells.push({ date, dateKey: toDateKey(date), inCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, monthIndex, d);
    cells.push({ date, dateKey: toDateKey(date), inCurrentMonth: true });
  }
  let trailing = 1;
  while (cells.length % 7 !== 0) {
    const date = new Date(year, monthIndex + 1, trailing);
    cells.push({ date, dateKey: toDateKey(date), inCurrentMonth: false });
    trailing += 1;
  }
  return cells;
}

function weekdayHeaders(locale: string): string[] {
  // Fixed reference week (Sun 4 Jan 1970) — locale-aware short labels, Sunday-first
  // to match WeekStrip elsewhere in the app.
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(1970, 0, 4 + i);
    return d.toLocaleDateString(locale, { weekday: 'short' }).slice(0, 2);
  });
}

interface MonthCalendarProps {
  month: Date;
  onMonthChange: (month: Date) => void;
  selectedDates?: Set<string>;
  onSelectDate: (dateKey: string, date: Date) => void;
  markedDates?: Set<string>;
  minDateKey?: string;
}

export function MonthCalendar({
  month,
  onMonthChange,
  selectedDates = new Set(),
  onSelectDate,
  markedDates,
  minDateKey,
}: MonthCalendarProps) {
  const { i18n } = useTranslation();
  const locale = localeTag(i18n.language);
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(today), [today]);
  const cells = useMemo(() => buildMonthGrid(month), [month]);
  const headers = useMemo(() => weekdayHeaders(locale), [locale]);

  const goToMonth = (delta: number) => {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  };

  return (
    <View>
      <View style={styles.header}>
        <TouchableOpacity hitSlop={10} onPress={() => goToMonth(-1)}>
          <Ionicons name="chevron-back" size={20} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerLabel}>
          {month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity hitSlop={10} onPress={() => goToMonth(1)}>
          <Ionicons name="chevron-forward" size={20} color={Light.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekdayRow}>
        {headers.map((label, i) => (
          <Text key={i} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell) => {
          const disabled = !cell.inCurrentMonth || (!!minDateKey && cell.dateKey < minDateKey);
          const selected = cell.inCurrentMonth && selectedDates.has(cell.dateKey);
          const isToday = cell.dateKey === todayKey;
          const marked = cell.inCurrentMonth && markedDates?.has(cell.dateKey);
          return (
            <TouchableOpacity
              key={cell.dateKey}
              style={styles.cell}
              activeOpacity={0.7}
              disabled={disabled}
              onPress={() => onSelectDate(cell.dateKey, cell.date)}
            >
              <View style={[styles.cellCircle, selected && styles.cellCircleSelected, isToday && !selected && styles.cellCircleToday]}>
                <Text
                  style={[
                    styles.cellLabel,
                    !cell.inCurrentMonth && styles.cellLabelDim,
                    disabled && cell.inCurrentMonth && styles.cellLabelDisabled,
                    selected && styles.cellLabelSelected,
                    isToday && !selected && styles.cellLabelToday,
                  ]}
                >
                  {cell.date.getDate()}
                </Text>
              </View>
              {marked && !selected && <View style={styles.markedDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const CELL_SIZE = `${100 / 7}%`;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.md,
  },
  headerLabel: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    textTransform: 'capitalize',
  },
  weekdayRow: { flexDirection: 'row' },
  weekdayLabel: {
    width: CELL_SIZE,
    textAlign: 'center',
    color: Light.textMuted,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    textTransform: 'uppercase',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL_SIZE, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  cellCircle: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellCircleSelected: { backgroundColor: Colors.teal },
  cellCircleToday: { borderWidth: 1.5, borderColor: Colors.teal },
  cellLabel: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  cellLabelDim: { color: Light.textMuted, opacity: 0.4 },
  cellLabelDisabled: { color: Light.textMuted },
  cellLabelSelected: { color: Colors.white, fontFamily: Typography.fontFamily.bold },
  cellLabelToday: { color: Colors.teal, fontFamily: Typography.fontFamily.bold },
  markedDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.teal,
  },
});
