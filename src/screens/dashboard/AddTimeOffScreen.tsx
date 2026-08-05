import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { auth } from '../../services/firebase';
import { addTimeOff } from '../../services/businesses';
import { Button } from '../../components/ui';
import { DateTimePickerSheet } from '../../components/DateTimePickerSheet';
import { Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import { isSameDay, toDateKey } from '../../utils/scheduling';
import { localeTag } from '../../utils/locale';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'AddTimeOff'>;

const DAYS_AHEAD = 60;

function formatDayLabel(date: Date, locale: string) {
  return date.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
}

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function AddTimeOffScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const locale = localeTag(i18n.language);
  const uid = auth.currentUser?.uid;
  const queryClient = useQueryClient();
  const defaultLabel = t('addTimeOff.defaultLabel');

  const [label, setLabel] = useState(defaultLabel);
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  const [saving, setSaving] = useState(false);

  const canSave = endDate.getTime() >= startDate.getTime() && !saving;

  const handleSelectDay = (day: Date) => {
    if (pickerTarget === 'start') {
      setStartDate(day);
      if (endDate.getTime() < day.getTime()) setEndDate(day);
    } else if (pickerTarget === 'end') {
      setEndDate(day);
    }
  };

  const handleSave = async () => {
    if (!uid || !canSave) return;
    setSaving(true);
    try {
      await addTimeOff(uid, {
        id: generateId(),
        startDate: toDateKey(startDate),
        endDate: toDateKey(endDate),
        label: label.trim() || defaultLabel,
      });
      queryClient.invalidateQueries({ queryKey: ['business', uid] });
      navigation.goBack();
    } catch (err) {
      console.error('addTimeOff failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const pickerDay = pickerTarget === 'start' ? startDate : endDate;
  const isSingleDay = isSameDay(startDate, endDate);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('addTimeOff.title')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.helperText}>
          {isSingleDay ? t('addTimeOff.helperTextSingle') : t('addTimeOff.helperTextRange')}
        </Text>

        <View style={styles.labelField}>
          <Text style={styles.fieldLabel}>{t('addReservation.label')}</Text>
          <TextInput
            style={styles.labelInput}
            placeholder={defaultLabel}
            placeholderTextColor={Light.textMuted}
            value={label}
            onChangeText={setLabel}
          />
        </View>

        <View style={styles.timeRow}>
          <TouchableOpacity
            style={styles.timeField}
            activeOpacity={0.7}
            onPress={() => setPickerTarget('start')}
          >
            <Text style={styles.fieldLabel}>{t('addTimeOff.startDate')}</Text>
            <Text style={styles.fieldValue}>{formatDayLabel(startDate, locale)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.timeField} activeOpacity={0.7} onPress={() => setPickerTarget('end')}>
            <Text style={styles.fieldLabel}>{t('addTimeOff.endDate')}</Text>
            <Text style={styles.fieldValue}>{formatDayLabel(endDate, locale)}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button label={t('common.save')} onPress={handleSave} disabled={!canSave} loading={saving} />
      </View>

      <DateTimePickerSheet
        visible={pickerTarget !== null}
        mode="date"
        daysAhead={DAYS_AHEAD}
        title={pickerTarget === 'start' ? t('addTimeOff.startDate') : t('addTimeOff.endDate')}
        pickerDay={pickerDay}
        onSelectDay={handleSelectDay}
        onClose={() => setPickerTarget(null)}
      />
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
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['2xl'], gap: Spacing.lg },
  helperText: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
  labelField: {
    borderWidth: 1.5,
    borderColor: Light.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  labelInput: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    padding: 0,
  },
  timeRow: { flexDirection: 'row', gap: Spacing.md },
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
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: Light.border,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
});
