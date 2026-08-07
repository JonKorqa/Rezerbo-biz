import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Radius, Spacing, Typography } from '../theme';
import { Light } from '../theme/light';
import { MonthCalendar } from './MonthCalendar';
import { toDateKey } from '../utils/scheduling';

interface DateJumpSheetProps {
  visible: boolean;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}

export function DateJumpSheet({ visible, selectedDate, onSelectDate, onClose }: DateJumpSheetProps) {
  const { t } = useTranslation();
  const [month, setMonth] = useState(selectedDate);

  // Re-anchor the visible month to the currently selected date each time the sheet opens.
  useEffect(() => {
    if (visible) setMonth(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleSelectDate = (_dateKey: string, date: Date) => {
    onSelectDate(date);
    onClose();
  };

  const jumpToToday = () => {
    const today = new Date();
    setMonth(today);
    onSelectDate(today);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('appointments.jumpToDate')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={Light.textPrimary} />
            </TouchableOpacity>
          </View>

          <MonthCalendar
            month={month}
            onMonthChange={setMonth}
            selectedDates={new Set([toDateKey(selectedDate)])}
            onSelectDate={handleSelectDate}
          />

          <TouchableOpacity style={styles.todayLink} activeOpacity={0.7} onPress={jumpToToday}>
            <Text style={styles.todayLinkLabel}>{t('common.today')}</Text>
          </TouchableOpacity>
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
    paddingBottom: Spacing['2xl'],
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
  todayLink: { alignSelf: 'center', marginTop: Spacing.md, padding: Spacing.xs },
  todayLinkLabel: {
    color: Colors.teal,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
});
