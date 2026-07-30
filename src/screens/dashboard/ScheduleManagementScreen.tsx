import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth } from '../../services/firebase';
import { getBusiness, saveBusinessHours } from '../../services/businesses';
import { Button } from '../../components/ui';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';
import type { BusinessHours, DayHours, DayOfWeek } from '../../types/business';

type Props = NativeStackScreenProps<RootStackParamList, 'ScheduleManagement'>;

const DAY_ORDER: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const DEFAULT_DAY_HOURS: DayHours = { closed: false, start: '09:00', end: '18:00' };

const DEFAULT_HOURS: BusinessHours = DAY_ORDER.reduce((acc, day) => {
  acc[day] = { ...DEFAULT_DAY_HOURS };
  return acc;
}, {} as BusinessHours);

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

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

function formatDayHours(day: DayHours): string {
  return day.closed ? 'Closed' : `${formatTime(day.start)} - ${formatTime(day.end)}`;
}

export default function ScheduleManagementScreen({ navigation }: Props) {
  const uid = auth.currentUser?.uid;

  const { data: business } = useQuery({
    queryKey: ['business', uid],
    queryFn: () => (uid ? getBusiness(uid) : Promise.resolve(null)),
    enabled: !!uid,
  });

  const [hours, setHours] = useState<BusinessHours>(DEFAULT_HOURS);
  const [hydrated, setHydrated] = useState(false);
  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);
  const [draft, setDraft] = useState<DayHours | null>(null);
  const [activeTimeField, setActiveTimeField] = useState<'start' | 'end' | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (business?.hours && !hydrated) {
      setHours({ ...DEFAULT_HOURS, ...business.hours });
      setHydrated(true);
    }
  }, [business, hydrated]);

  const openDay = (day: DayOfWeek) => {
    setEditingDay(day);
    setDraft(hours[day]);
    setActiveTimeField(null);
  };

  const closeDay = () => {
    setEditingDay(null);
    setDraft(null);
    setActiveTimeField(null);
  };

  const saveDay = () => {
    if (editingDay && draft) {
      setHours((prev) => ({ ...prev, [editingDay]: draft }));
    }
    closeDay();
  };

  const selectTimeSlot = (slot: string) => {
    if (!draft || !activeTimeField) return;
    setDraft({ ...draft, [activeTimeField]: slot });
    setActiveTimeField(null);
  };

  const handleContinue = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      await saveBusinessHours(uid, hours);
    } catch (err) {
      console.error('saveBusinessHours failed:', err);
    } finally {
      setSaving(false);
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Business Hours</Text>
        <View style={{ width: 22 }} />
      </View>
      <Text style={styles.subtext}>When can clients book with you?</Text>

      <ScrollView contentContainerStyle={styles.listContent}>
        {DAY_ORDER.map((day) => (
          <TouchableOpacity key={day} style={styles.dayRow} activeOpacity={0.7} onPress={() => openDay(day)}>
            <Text style={styles.dayName}>{DAY_LABELS[day]}</Text>
            <View style={styles.dayValueRow}>
              <Text style={[styles.dayHours, hours[day].closed && styles.dayHoursClosed]}>
                {formatDayHours(hours[day])}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button label="Continue" onPress={handleContinue} loading={saving} />
      </View>

      <Modal visible={editingDay !== null} transparent animationType="slide" onRequestClose={closeDay}>
        <Pressable style={styles.backdrop} onPress={closeDay}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{editingDay ? DAY_LABELS[editingDay] : ''}</Text>
              <TouchableOpacity onPress={closeDay} hitSlop={12}>
                <Ionicons name="close" size={22} color={Light.textPrimary} />
              </TouchableOpacity>
            </View>

            {draft && (
              <>
                <View style={styles.closedRow}>
                  <Text style={styles.closedLabel}>Closed</Text>
                  <Switch
                    value={draft.closed}
                    onValueChange={(value) => setDraft({ ...draft, closed: value })}
                    trackColor={{ false: Light.track, true: Colors.tealLight }}
                    thumbColor={draft.closed ? Colors.teal : Colors.white}
                  />
                </View>

                {!draft.closed && (
                  <View style={styles.timeRow}>
                    <TouchableOpacity
                      style={styles.timeField}
                      activeOpacity={0.7}
                      onPress={() => setActiveTimeField(activeTimeField === 'start' ? null : 'start')}
                    >
                      <Text style={styles.fieldLabel}>OPENS</Text>
                      <Text style={styles.fieldValue}>{formatTime(draft.start)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.timeField}
                      activeOpacity={0.7}
                      onPress={() => setActiveTimeField(activeTimeField === 'end' ? null : 'end')}
                    >
                      <Text style={styles.fieldLabel}>CLOSES</Text>
                      <Text style={styles.fieldValue}>{formatTime(draft.end)}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {!draft.closed && activeTimeField && (
                  <ScrollView style={styles.timeList} contentContainerStyle={styles.timeListContent}>
                    {TIME_SLOTS.map((slot) => {
                      const active = draft[activeTimeField] === slot;
                      return (
                        <TouchableOpacity
                          key={slot}
                          style={[styles.timeSlotRow, active && styles.timeSlotRowActive]}
                          onPress={() => selectTimeSlot(slot)}
                        >
                          <Text style={[styles.timeSlotLabel, active && styles.timeSlotLabelActive]}>
                            {formatTime(slot)}
                          </Text>
                          {active && <Ionicons name="checkmark" size={18} color={Colors.teal} />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

                <Button label="Save" onPress={saveDay} style={styles.sheetSaveButton} />
              </>
            )}
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
  subtext: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['2xl'] },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Light.border,
  },
  dayName: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  dayValueRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dayHours: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  dayHoursClosed: { color: Light.textMuted },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: Light.border,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
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
  closedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  closedLabel: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
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
