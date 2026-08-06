import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { auth } from '../../services/firebase';
import { createReservation } from '../../services/appointments';
import { Button } from '../../components/ui';
import { DateTimePickerSheet } from '../../components/DateTimePickerSheet';
import { Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import { formatDateTime, getDefaultStartTime } from '../../utils/scheduling';
import { localeTag } from '../../utils/locale';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'AddReservation'>;

const DEFAULT_DURATION_MINUTES = 30;

export default function AddReservationScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const locale = localeTag(i18n.language);
  const uid = auth.currentUser?.uid;
  const queryClient = useQueryClient();
  const defaultLabel = t('appointments.reserved');

  const [label, setLabel] = useState(defaultLabel);
  const [startTime, setStartTime] = useState<Date>(getDefaultStartTime);
  const [endTime, setEndTime] = useState<Date>(
    () => new Date(getDefaultStartTime().getTime() + DEFAULT_DURATION_MINUTES * 60000),
  );
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  const [pickerDay, setPickerDay] = useState<Date>(() => new Date());
  const [saving, setSaving] = useState(false);

  const canSave = label.trim().length > 0 && endTime.getTime() > startTime.getTime() && !saving;

  const openPicker = (target: 'start' | 'end') => {
    const current = target === 'start' ? startTime : endTime;
    setPickerDay(new Date(current.getFullYear(), current.getMonth(), current.getDate()));
    setPickerTarget(target);
  };

  const selectTimeSlot = (hour: number, minute: number) => {
    const newDate = new Date(pickerDay);
    newDate.setHours(hour, minute, 0, 0);
    if (pickerTarget === 'start') {
      setStartTime(newDate);
      if (endTime.getTime() <= newDate.getTime()) {
        setEndTime(new Date(newDate.getTime() + DEFAULT_DURATION_MINUTES * 60000));
      }
    } else if (pickerTarget === 'end') {
      setEndTime(newDate);
    }
    setPickerTarget(null);
  };

  const handleSave = async () => {
    if (!uid || !canSave) return;
    setSaving(true);
    try {
      await createReservation({ businessId: uid, label: label.trim(), startTime, endTime });
      queryClient.invalidateQueries({ queryKey: ['appointments', uid] });
      navigation.goBack();
    } catch (err) {
      console.error('createReservation failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const activeFieldValue = pickerTarget === 'start' ? startTime : endTime;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('addReservation.title')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.helperText}>
          {t('addReservation.helperText')}
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
          <TouchableOpacity style={styles.timeField} activeOpacity={0.7} onPress={() => openPicker('start')}>
            <Text style={styles.fieldLabel}>{t('addReservation.start')}</Text>
            <Text style={styles.fieldValue}>{formatDateTime(startTime, locale, t('common.today'))}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.timeField} activeOpacity={0.7} onPress={() => openPicker('end')}>
            <Text style={styles.fieldLabel}>{t('newAppointment.end')}</Text>
            <Text style={styles.fieldValue}>{formatDateTime(endTime, locale, t('common.today'))}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button label={t('common.save')} onPress={handleSave} disabled={!canSave} loading={saving} />
      </View>

      <DateTimePickerSheet
        visible={pickerTarget !== null}
        title={pickerTarget === 'start' ? t('newAppointment.startDateTimeSheetTitle') : t('newAppointment.endTimeSheetTitle')}
        pickerDay={pickerDay}
        onSelectDay={setPickerDay}
        activeTime={activeFieldValue}
        onSelectTime={selectTimeSlot}
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
