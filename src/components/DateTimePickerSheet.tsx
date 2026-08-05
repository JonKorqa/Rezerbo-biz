import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Radius, Spacing, Typography } from '../theme';
import { Light } from '../theme/light';
import { buildDayOptions, buildTimeSlots, formatDayChip, isSameDay } from '../utils/scheduling';
import { localeTag } from '../utils/locale';

const DAY_OPTIONS = buildDayOptions();
const TIME_SLOTS = buildTimeSlots();

interface DateTimePickerSheetProps {
  visible: boolean;
  mode?: 'datetime' | 'date';
  title: string;
  pickerDay: Date;
  onSelectDay: (day: Date) => void;
  activeTime?: Date | null;
  onSelectTime?: (hour: number, minute: number) => void;
  onClose: () => void;
  daysAhead?: number;
}

export function DateTimePickerSheet({
  visible,
  mode = 'datetime',
  title,
  pickerDay,
  onSelectDay,
  activeTime = null,
  onSelectTime,
  onClose,
  daysAhead,
}: DateTimePickerSheetProps) {
  const { t, i18n } = useTranslation();
  const locale = localeTag(i18n.language);
  const dayOptions = daysAhead ? buildDayOptions(daysAhead) : DAY_OPTIONS;

  const handleSelectDay = (day: Date) => {
    onSelectDay(day);
    if (mode === 'date') onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={Light.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dayRow}
            contentContainerStyle={styles.dayRowContent}
          >
            {dayOptions.map((day) => {
              const selected = isSameDay(day, pickerDay);
              return (
                <TouchableOpacity
                  key={day.toISOString()}
                  style={[styles.dayChip, selected && styles.dayChipSelected]}
                  onPress={() => handleSelectDay(day)}
                >
                  <Text style={[styles.dayChipLabel, selected && styles.dayChipLabelSelected]}>
                    {formatDayChip(day, locale, t('common.today'), t('common.tomorrow'))}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {mode === 'datetime' && (
            <ScrollView style={styles.timeList} contentContainerStyle={styles.timeListContent}>
              {TIME_SLOTS.map(({ hour, minute }) => {
                const active =
                  !!activeTime &&
                  isSameDay(activeTime, pickerDay) &&
                  activeTime.getHours() === hour &&
                  activeTime.getMinutes() === minute;
                const slotDate = new Date(pickerDay);
                slotDate.setHours(hour, minute, 0, 0);
                return (
                  <TouchableOpacity
                    key={`${hour}-${minute}`}
                    style={[styles.timeSlotRow, active && styles.timeSlotRowActive]}
                    onPress={() => onSelectTime?.(hour, minute)}
                  >
                    <Text style={[styles.timeSlotLabel, active && styles.timeSlotLabelActive]}>
                      {slotDate.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}
                    </Text>
                    {active && <Ionicons name="checkmark" size={18} color={Colors.teal} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Light.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.heading,
  },
  dayRow: { flexGrow: 0, marginBottom: Spacing.md },
  dayRowContent: { gap: Spacing.sm, paddingRight: Spacing.xl },
  dayChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Light.fieldBg,
    borderWidth: 1.5,
    borderColor: Light.border,
  },
  dayChipSelected: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  dayChipLabel: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  dayChipLabelSelected: { color: Colors.white, fontFamily: Typography.fontFamily.bold },
  timeList: { marginBottom: Spacing.xl },
  timeListContent: { paddingBottom: Spacing.xl },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
  },
  timeSlotRowActive: { backgroundColor: Light.fieldBgFocused },
  timeSlotLabel: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  timeSlotLabelActive: { color: Colors.teal, fontFamily: Typography.fontFamily.bold },
});
