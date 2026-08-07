import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { auth } from '../../services/firebase';
import { addTimeOff, getBusiness, saveHoursOverride } from '../../services/businesses';
import { Button } from '../../components/ui';
import { MonthCalendar } from '../../components/MonthCalendar';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import { localeTag } from '../../utils/locale';
import { toDateKey } from '../../utils/scheduling';
import type { RootStackParamList } from '../../types/navigation';
import type { DayHours } from '../../types/business';

type Props = NativeStackScreenProps<RootStackParamList, 'OpeningCalendar'>;

function buildTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 6; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return slots;
}

const TIME_SLOTS = buildTimeSlots();
const DEFAULT_CUSTOM_HOURS: DayHours = { closed: false, start: '09:00', end: '18:00' };

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatTime(hhmm: string, locale: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
}

function formatDateLabel(dateKey: string, locale: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function OpeningCalendarScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const locale = localeTag(i18n.language);
  const uid = auth.currentUser?.uid;
  const queryClient = useQueryClient();
  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const { data: business } = useQuery({
    queryKey: ['business', uid],
    queryFn: () => (uid ? getBusiness(uid) : Promise.resolve(null)),
    enabled: !!uid,
  });

  const [month, setMonth] = useState(() => new Date());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [showHoursSheet, setShowHoursSheet] = useState(false);
  const [draftHours, setDraftHours] = useState<DayHours>(DEFAULT_CUSTOM_HOURS);
  const [activeTimeField, setActiveTimeField] = useState<'start' | 'end' | null>(null);
  const [saving, setSaving] = useState(false);

  const hoursOverrides = business?.hoursOverrides ?? {};
  const timeOff = business?.timeOff ?? [];

  const markedDates = useMemo(() => {
    const marked = new Set<string>(Object.keys(hoursOverrides));
    timeOff.forEach((entry) => {
      // Only mark single-day entries individually — ranges would require expanding
      // every date in between, which isn't needed for the calendar's dot indicator.
      if (entry.startDate === entry.endDate) marked.add(entry.startDate);
    });
    return marked;
  }, [hoursOverrides, timeOff]);

  const upcomingExceptions = useMemo(() => {
    const rows: { key: string; label: string; detail: string }[] = [];
    Object.entries(hoursOverrides)
      .filter(([dateKey]) => dateKey >= todayKey)
      .forEach(([dateKey, hours]) => {
        rows.push({
          key: `hours-${dateKey}`,
          label: formatDateLabel(dateKey, locale),
          detail: `${formatTime(hours.start, locale)} - ${formatTime(hours.end, locale)}`,
        });
      });
    timeOff
      .filter((entry) => entry.endDate >= todayKey)
      .forEach((entry) => {
        rows.push({
          key: `timeoff-${entry.id}`,
          label:
            entry.startDate === entry.endDate
              ? formatDateLabel(entry.startDate, locale)
              : `${formatDateLabel(entry.startDate, locale)} - ${formatDateLabel(entry.endDate, locale)}`,
          detail: entry.label ?? t('appointments.dayOff'),
        });
      });
    return rows.sort((a, b) => a.key.localeCompare(b.key));
  }, [hoursOverrides, timeOff, todayKey, locale, t]);

  const toggleDate = (dateKey: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return next;
    });
  };

  const clearSelection = () => setSelectedDates(new Set());

  const openHoursSheet = () => {
    setDraftHours(DEFAULT_CUSTOM_HOURS);
    setShowHoursSheet(true);
  };

  const closeHoursSheet = () => {
    setShowHoursSheet(false);
    setActiveTimeField(null);
  };

  const handleSaveCustomHours = async () => {
    if (!uid || selectedDates.size === 0) return;
    setSaving(true);
    try {
      await Promise.all(Array.from(selectedDates).map((dateKey) => saveHoursOverride(uid, dateKey, draftHours)));
      queryClient.invalidateQueries({ queryKey: ['business', uid] });
      clearSelection();
      closeHoursSheet();
    } catch (err) {
      console.error('saveHoursOverride failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkDayOff = async () => {
    if (!uid || selectedDates.size === 0) return;
    setSaving(true);
    try {
      await Promise.all(
        Array.from(selectedDates).map((dateKey) =>
          addTimeOff(uid, {
            id: generateId(),
            startDate: dateKey,
            endDate: dateKey,
            label: t('addTimeOff.defaultLabel'),
          }),
        ),
      );
      queryClient.invalidateQueries({ queryKey: ['business', uid] });
      clearSelection();
    } catch (err) {
      console.error('addTimeOff failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('scheduleManagement.openingCalendarTitle')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtext}>{t('openingCalendar.subtitle')}</Text>

        <MonthCalendar
          month={month}
          onMonthChange={setMonth}
          selectedDates={selectedDates}
          onSelectDate={toggleDate}
          markedDates={markedDates}
          minDateKey={todayKey}
        />

        {selectedDates.size > 0 && (
          <View style={styles.selectionBar}>
            <Text style={styles.selectionText}>{t('openingCalendar.datesSelected', { count: selectedDates.size })}</Text>
            <TouchableOpacity onPress={clearSelection} hitSlop={8}>
              <Text style={styles.clearLink}>{t('openingCalendar.clear')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.actionRow}>
          <Button
            label={t('openingCalendar.setCustomHours')}
            variant="secondary"
            onPress={openHoursSheet}
            disabled={selectedDates.size === 0 || saving}
            style={styles.actionButton}
          />
          <Button
            label={t('openingCalendar.markDayOff')}
            variant="secondary"
            onPress={handleMarkDayOff}
            disabled={selectedDates.size === 0 || saving}
            style={styles.actionButton}
          />
        </View>

        <Text style={styles.sectionTitle}>{t('openingCalendar.upcomingExceptions')}</Text>
        {upcomingExceptions.length === 0 ? (
          <Text style={styles.emptyText}>{t('openingCalendar.noExceptions')}</Text>
        ) : (
          upcomingExceptions.map((row) => (
            <View key={row.key} style={styles.exceptionRow}>
              <Text style={styles.exceptionLabel}>{row.label}</Text>
              <Text style={styles.exceptionDetail}>{row.detail}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showHoursSheet} transparent animationType="slide" onRequestClose={closeHoursSheet}>
        <Pressable style={styles.backdrop} onPress={closeHoursSheet}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t('openingCalendar.setCustomHours')}</Text>
              <TouchableOpacity onPress={closeHoursSheet} hitSlop={12}>
                <Ionicons name="close" size={22} color={Light.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.timeRow}>
              <TouchableOpacity
                style={styles.timeField}
                activeOpacity={0.7}
                onPress={() => setActiveTimeField(activeTimeField === 'start' ? null : 'start')}
              >
                <Text style={styles.fieldLabel}>{t('scheduleManagement.opens')}</Text>
                <Text style={styles.fieldValue}>{formatTime(draftHours.start, locale)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timeField}
                activeOpacity={0.7}
                onPress={() => setActiveTimeField(activeTimeField === 'end' ? null : 'end')}
              >
                <Text style={styles.fieldLabel}>{t('scheduleManagement.closes')}</Text>
                <Text style={styles.fieldValue}>{formatTime(draftHours.end, locale)}</Text>
              </TouchableOpacity>
            </View>

            {activeTimeField && (
              <ScrollView style={styles.timeList} contentContainerStyle={styles.timeListContent}>
                {TIME_SLOTS.map((slot) => {
                  const active = draftHours[activeTimeField] === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.timeSlotRow, active && styles.timeSlotRowActive]}
                      onPress={() => {
                        setDraftHours({ ...draftHours, [activeTimeField]: slot });
                        setActiveTimeField(null);
                      }}
                    >
                      <Text style={[styles.timeSlotLabel, active && styles.timeSlotLabelActive]}>
                        {formatTime(slot, locale)}
                      </Text>
                      {active && <Ionicons name="checkmark" size={18} color={Colors.teal} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <Button label={t('common.save')} onPress={handleSaveCustomHours} loading={saving} style={styles.sheetSaveButton} />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.heading,
  },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['2xl'] },
  subtext: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: Spacing.md,
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  selectionText: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  clearLink: {
    color: Colors.teal,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  actionRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  actionButton: { flex: 1 },
  sectionTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.heading,
    marginTop: Spacing['2xl'],
    marginBottom: Spacing.sm,
  },
  emptyText: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  exceptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
  },
  exceptionLabel: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
  },
  exceptionDetail: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  backdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Light.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    maxHeight: '80%',
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
  timeRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  timeField: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Light.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  fieldLabel: {
    color: Light.textMuted,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: 0.5,
  },
  fieldValue: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  timeList: { maxHeight: 260, marginBottom: Spacing.md },
  timeListContent: { paddingBottom: Spacing.sm },
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
  sheetSaveButton: { marginTop: Spacing.sm },
});
