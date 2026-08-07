import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Light } from '../../theme/light';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ScheduleManagement'>;

export default function ScheduleManagementScreen({ navigation }: Props) {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={Light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('scheduleManagement.hubTitle')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.rowCard} activeOpacity={0.7} onPress={() => navigation.navigate('BusinessHours')}>
          <View style={styles.rowCardIconWrap}>
            <Ionicons name="time-outline" size={20} color={Colors.teal} />
          </View>
          <View style={styles.rowCardBody}>
            <Text style={styles.rowCardTitle}>{t('scheduleManagement.businessHoursTitle')}</Text>
            <Text style={styles.rowCardDescription}>{t('scheduleManagement.businessHoursDescription')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.rowCard} activeOpacity={0.7} onPress={() => navigation.navigate('OpeningCalendar')}>
          <View style={styles.rowCardIconWrap}>
            <Ionicons name="calendar-outline" size={20} color={Colors.teal} />
          </View>
          <View style={styles.rowCardBody}>
            <Text style={styles.rowCardTitle}>{t('scheduleManagement.openingCalendarTitle')}</Text>
            <Text style={styles.rowCardDescription}>{t('scheduleManagement.openingCalendarDescription')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Light.textMuted} />
        </TouchableOpacity>
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
    color: Light.textPrimary,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.heading,
  },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, gap: Spacing.md },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Light.background,
    borderWidth: 1.5,
    borderColor: Light.border,
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },
  rowCardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Light.fieldBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rowCardBody: { flex: 1, paddingRight: Spacing.md, gap: 2 },
  rowCardTitle: {
    color: Light.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
  },
  rowCardDescription: {
    color: Light.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
});
